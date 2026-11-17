import {readFileSync} from 'node:fs';
import {createViteConfig} from './vite.config';
const env = Object.fromEntries(
  readFileSync(new URL('./tests/e2e/fixture.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1)];
    }),
);
export default createViteConfig({entry: 'tests/e2e/server.ts', env});
