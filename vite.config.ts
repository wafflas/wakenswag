import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import {localHttps} from '@shopify/hydrogen/vite';
import {oxygen, type OxygenPluginOptions} from '@shopify/mini-oxygen/vite';
import {reactRouter} from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';

export function createViteConfig(oxygenOptions: OxygenPluginOptions = {}) {
  return defineConfig({
    root: fileURLToPath(new URL('.', import.meta.url)),
    plugins: [
      tailwindcss(),
      localHttps({enabled: process.env.npm_lifecycle_event === 'dev:https'}),
      ...oxygen(oxygenOptions),
      reactRouter(),
    ],
    resolve: {
      alias: {
        // Keep the application alias explicit for Vite and server builds.
        '~': fileURLToPath(new URL('./app', import.meta.url)),
      },
      tsconfigPaths: true,
    },
    build: {
      // Allow a strict Content-Security-Policy
      // without inlining assets as base64:
      assetsInlineLimit: 0,
    },
    ssr: {
      optimizeDeps: {
        /**
         * Include dependencies here if they throw CJS<>ESM errors.
         * For example, for the following error:
         *
         * > ReferenceError: module is not defined
         * >   at /Users/.../node_modules/example-dep/index.js:1:1
         *
         * Include 'example-dep' in the array below.
         * @see https://vitejs.dev/config/dep-optimization-options
         */
        include: [
          'sanitize-html',
          'react',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-dom',
          'react-dom/server',
          'react-router > set-cookie-parser',
          'react-router > cookie',
          'react-router',
        ],
      },
    },
    server: {
      allowedHosts: ['.tryhydrogen.dev', '.trycloudflare.com'],
    },
  });
}
export default createViteConfig();
