import type {Config} from '@react-router/dev/config';
export default {
  buildDirectory: 'dist',
  ssr: true,
  // Allow Cloudflare quick tunnels for local demos (Origin ≠ localhost).
  allowedActionOrigins: ['*.trycloudflare.com'],
  future: {v8_middleware: true},
} satisfies Config;
