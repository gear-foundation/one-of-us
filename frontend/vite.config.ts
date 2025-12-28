import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

// Vite config with Node polyfills for web3/kzg-wasm
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      // node core polyfills
      path: 'path-browserify',
      url: 'url/',
      buffer: 'buffer/',
      process: 'process/browser',
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
      util: 'util/',
      events: 'events/',
    },
  },

  optimizeDeps: {
    esbuildOptions: {
      // define global for some libs
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },

  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
