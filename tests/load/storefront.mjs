import http from 'node:http';
import {UNSAFE_decodeViaTurboStream as decode} from 'react-router';
import {writeFileSync} from 'node:fs';
import {performance, monitorEventLoopDelay} from 'node:perf_hooks';
import {setTimeout as sleep} from 'node:timers/promises';

const origin = 'http://localhost:4173';
const users = Number(process.argv[2] ?? 1000);
const durationSeconds = Number(process.argv[3] ?? 60);
const output = process.argv[4] ?? '/tmp/wakenswag-hydrogen-2026-10-load.json';
const rampSeconds = Number(process.argv[5] ?? 0);
if (
  !Number.isInteger(users) ||
  users < 1 ||
  users > 1000 ||
  durationSeconds < 0 ||
  durationSeconds > 120
) {
  throw new Error(
    'Expected 1–1000 users and 0–120 seconds. Only the local fixture origin is supported.',
  );
}

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: users,
  maxFreeSockets: users,
});
const metrics = new Map();
const errors = [];
const errorCounts = {};
const cookies = new Map();
const issuedCookies = new Set();
let inFlight = 0;
let peakInFlight = 0;
let activeUsers = 0;
let peakUsers = 0;
let completedJourneys = 0;
let failedJourneys = 0;
let requests = 0;
let failures = 0;
const startedAt = new Date().toISOString();
const started = performance.now();
const deadline = started + (durationSeconds + rampSeconds) * 1000;
const loopDelay = monitorEventLoopDelay({resolution: 20});
loopDelay.enable();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function call(user, name, path, check, formInput) {
  const sample = {ms: 0, status: 0, ok: false};
  if (!metrics.has(name)) metrics.set(name, []);
  metrics.get(name).push(sample);
  requests++;
  inFlight++;
  peakInFlight = Math.max(peakInFlight, inFlight);
  const began = performance.now();
  try {
    const body = formInput ? JSON.stringify(formInput) : undefined;
    const response = await new Promise((resolve, reject) => {
      const req = http.request(
        new URL(path, origin),
        {
          agent,
          method: body ? 'POST' : 'GET',
          headers: {
            Origin: origin,
            ...(user.cookie ? {Cookie: user.cookie} : {}),
            ...(body
              ? {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(body),
                }
              : {}),
          },
        },
        (res) => {
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () =>
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: Buffer.concat(chunks),
            }),
          );
          res.on('error', reject);
        },
      );
      const timeout = setTimeout(
        () => req.destroy(new Error('Request exceeded 15 seconds')),
        15_000,
      );
      req.on('close', () => clearTimeout(timeout));
      req.on('error', reject);
      req.end(body);
    });
    sample.ms = performance.now() - began;
    sample.status = response.status;
    assert(response.status === 200, `${name}: HTTP ${response.status}`);
    const setCookie = response.headers['set-cookie']?.find((value) =>
      value.startsWith('cart='),
    );
    if (setCookie) {
      user.cookie = setCookie.split(';')[0];
      cookies.set(user.id, user.cookie);
      issuedCookies.add(user.cookie);
    }
    let value = response.body.toString();
    if (path.includes('.data')) {
      const decoded = await decode(
        new Response(response.body).body,
        globalThis,
      );
      await decoded.done;
      value = decoded.value;
    }
    if (path.startsWith('/api/')) value = JSON.parse(value);
    if (path.startsWith('/api/cart'))
      assert(
        /private|no-store/.test(response.headers['cache-control'] ?? ''),
        'Cart response is publicly cacheable',
      );
    await check(value, user);
    sample.ok = true;
  } catch (error) {
    sample.ms ||= performance.now() - began;
    failures++;
    const key = error.code ?? error.message;
    errorCounts[key] = (errorCounts[key] ?? 0) + 1;
    if (errors.length < 20)
      errors.push({
        user: user.id,
        step: name,
        status: sample.status,
        message: error.message,
      });
    throw error;
  } finally {
    inFlight--;
  }
}

async function journey(user) {
  const drumkit = user.id % 5 === 0;
  const quantity = drumkit ? 1 : (user.id % 2) + 1;
  const updatedQuantity = drumkit ? 1 : user.id % 2 === 0 ? 2 : 3;
  const checkCart = (expected) => (value) => {
    const result = value;
    assert(
      result && !result.errors?.length,
      'Cart action returned an error or missing data',
    );
    assert(
      result.cart?.totalQuantity === expected,
      `Expected cart quantity ${expected}, got ${result.cart?.totalQuantity}`,
    );
  };
  const checkRoot = (expected) => async (value) => {
    const result = value.root?.data;
    assert(result && !value.root?.error, 'Root loader returned an error');
    const {cart} = await result.cart;
    assert(
      cart?.totalQuantity === expected,
      `Expected persisted cart quantity ${expected}, got ${cart?.totalQuantity}`,
    );
  };
  const pause = async () => {
    if (durationSeconds) await sleep(200 + ((user.id * 17) % 401));
  };
  const step = async (...args) => {
    await call(user, ...args);
    await pause();
  };

  await step('home', '/', (html) =>
    assert(
      html.includes('Wake N Swag') && !html.includes('Something went wrong.'),
      'Home did not render',
    ),
  );
  await step('collection', drumkit ? '/drumkits' : '/swag', (html) =>
    assert(
      html.includes(drumkit ? 'Fixture drumkits' : 'Fixture Tee'),
      'Collection did not render products',
    ),
  );
  await step(
    'product',
    drumkit ? '/drumkits/fixture-drumkit' : '/swag/fixture-tee',
    (html) =>
      assert(
        html.includes(drumkit ? 'Fixture Drumkit' : 'Fixture Tee') &&
          html.includes('Add to cart'),
        'Product purchase controls missing',
      ),
  );
  await step('search', '/api/predictive-search?q=tee&limit=8', (result) => {
    assert(
      !result.error && result.items.products.length > 0,
      'Predictive search failed',
    );
  });
  await step('cart-add', '/api/cart', checkCart(quantity), {
    lines: [
      {
        merchandiseId: `gid://shopify/ProductVariant/${drumkit ? 201 : 101}`,
        quantity: drumkit ? 4 : quantity,
      },
    ],
  });
  assert(user.cookie, 'No independent cart cookie was set');
  await step('cart-read-after-add', '/.data?_routes=root', checkRoot(quantity));
  await step('cart-update', '/api/cart', checkCart(updatedQuantity), {
    lines: [
      {
        id: 'gid://shopify/CartLine/fixture',
        quantity: drumkit ? 9 : updatedQuantity,
      },
    ],
  });
  await step(
    'cart-read-after-update',
    '/.data?_routes=root',
    checkRoot(updatedQuantity),
  );
  await step('cart-remove', '/api/cart', checkCart(0), {
    lines: [{id: 'gid://shopify/CartLine/fixture', quantity: 0}],
  });
  await step('cart-read-after-remove', '/.data?_routes=root', checkRoot(0));
}

const progress = setInterval(
  () =>
    process.stdout.write(
      JSON.stringify({
        elapsedSeconds: Math.round((performance.now() - started) / 1000),
        activeUsers,
        inFlight,
        requests,
        failures,
        completedJourneys,
        failedJourneys,
      }),
    ),
  5000,
);
await Promise.all(
  Array.from({length: users}, async (_, id) => {
    const user = {id, cookie: ''};
    if (rampSeconds) await sleep((id / users) * rampSeconds * 1000);
    activeUsers++;
    peakUsers = Math.max(peakUsers, activeUsers);
    try {
      do {
        try {
          await journey(user);
          completedJourneys++;
        } catch {
          failedJourneys++;
          // A timed-out mutation may have succeeded. Abandon that journey's cart
          // so the next journey does not mistake a valid repeated add for corruption.
          user.cookie = '';
          if (durationSeconds) await sleep(500);
        }
      } while (performance.now() < deadline);
    } finally {
      activeUsers--;
    }
  }),
);
clearInterval(progress);
loopDelay.disable();
agent.destroy();

function stats(samples) {
  const values = samples.map((item) => item.ms).sort((a, b) => a - b);
  const p = (percentile) =>
    Number(
      values[Math.max(0, Math.ceil(values.length * percentile) - 1)]?.toFixed(
        2,
      ) ?? 0,
    );
  return {
    requests: samples.length,
    failures: samples.filter((item) => !item.ok).length,
    p50Ms: p(0.5),
    p95Ms: p(0.95),
    p99Ms: p(0.99),
    maxMs: p(1),
    statuses: Object.fromEntries(
      [...new Set(samples.map((item) => item.status))].map((status) => [
        status,
        samples.filter((item) => item.status === status).length,
      ]),
    ),
  };
}
const elapsedSeconds = (performance.now() - started) / 1000;
const result = {
  startedAt,
  finishedAt: new Date().toISOString(),
  origin,
  environment:
    'Local production build in MiniOxygen using the existing tests/e2e/server.ts fixture. No live Shopify API, CDN, checkout, browser rendering or production Oxygen.',
  model:
    'Closed workload: one sequential HTTP journey per virtual user, independent cart cookies, 200–600 ms think time per step. rampSeconds controls startup (0 means an immediate burst). 80% physical products, 20% drumkits. Each cycle has 10 requests; failed journeys abandon their cart before restarting; issued journeys finish after the duration.',
  users,
  peakUsers,
  peakInFlight,
  requestedDurationSeconds: durationSeconds,
  rampSeconds,
  elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
  requests,
  failures,
  requestFailurePercent: Number(((failures / requests) * 100).toFixed(3)),
  completedJourneys,
  failedJourneys,
  independentCartCookies: new Set(cookies.values()).size,
  issuedCartCookies: issuedCookies.size,
  averageRequestsPerSecond: Number((requests / elapsedSeconds).toFixed(2)),
  ...{latency: stats([...metrics.values()].flat())},
  routes: Object.fromEntries(
    [...metrics].map(([name, samples]) => [name, stats(samples)]),
  ),
  generatorEventLoopP95Ms: Number((loopDelay.percentile(95) / 1e6).toFixed(2)),
  generatorMaxRssMB: Number((process.resourceUsage().maxRSS / 1024).toFixed(2)),
  errorCounts,
  errors,
};
writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
process.stdout.write(JSON.stringify(result, null, 2) + '\n');
process.exitCode = failures || new Set(cookies.values()).size !== users ? 1 : 0;
