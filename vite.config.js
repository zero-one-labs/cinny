import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { wasm } from '@rollup/plugin-wasm';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import inject from '@rollup/plugin-inject';
import topLevelAwait from 'vite-plugin-top-level-await';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';
import buildConfig from './build.config';
import fixLinkifyPlugin from './vite-plugin-fix-linkify';

const copyFiles = {
  targets: [
    {
      src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
      dest: '',
      rename: 'pdf.worker.min.js',
    },
    {
      src: 'netlify.toml',
      dest: '',
    },
    {
      src: 'config.json',
      dest: '',
    },
    {
      src: 'public/manifest.json',
      dest: '',
    },
    {
      src: 'public/res/android',
      dest: 'public/',
    },
    {
      src: 'public/locales',
      dest: 'public/',
    },
  ],
};

function serverMatrixSdkCryptoWasm(wasmFilePath) {
  return {
    name: 'vite-plugin-serve-matrix-sdk-crypto-wasm',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === wasmFilePath) {
          const resolvedPath = path.join(path.resolve(), "/node_modules/@matrix-org/matrix-sdk-crypto-wasm/pkg/matrix_sdk_crypto_wasm_bg.wasm");

          if (fs.existsSync(resolvedPath)) {
            res.setHeader('Content-Type', 'application/wasm');
            res.setHeader('Cache-Control', 'no-cache');

            const fileStream = fs.createReadStream(resolvedPath);
            fileStream.pipe(res);
          } else {
            res.writeHead(404);
            res.end('File not found');
          }
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  appType: 'spa',
  publicDir: false,
  base: buildConfig.base,
  server: {
    port: 8080,
    host: '0.0.0.0', // Allow access from network devices
    strictPort: true,
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..'],
    },
    hmr: {
      port: 8080,
    },
  },
  plugins: [
    fixLinkifyPlugin(),
    serverMatrixSdkCryptoWasm('/node_modules/.vite/deps/pkg/matrix_sdk_crypto_wasm_bg.wasm'),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: '__tla',
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: (i) => `__tla_${i}`,
    }),
    viteStaticCopy(copyFiles),
    wasm(),
    vanillaExtractPlugin(),
    react(),
    VitePWA({
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      injectRegister: false,
      manifest: false,
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    }),
  ],
  optimizeDeps: {
    include: ['linkify-react', 'linkifyjs'],
    exclude: ['folds'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        // Enable esbuild polyfill plugins
        NodeGlobalsPolyfillPlugin({
          process: false,
          buffer: true,
        }),
        // Fix linkify issues during optimization
        {
          name: 'esbuild-fix-linkify',
          setup(build) {
            build.onLoad({ filter: /linkify/ }, async (args) => {
              const fs = await import('fs');
              let contents = await fs.promises.readFile(args.path, 'utf8');
              
              // Apply the same fixes during dependency optimization
              if (contents.includes('options.assign(')) {
                contents = contents.replace(/\boptions\.assign\(/g, 'Object.assign(');
                console.log(`[esbuild-fix-linkify] Fixed options.assign in: ${args.path}`);
              }
              
              if (contents.includes('.assign(') && !contents.includes('Object.assign(')) {
                contents = contents.replace(/(\w+)\.assign\s*\(/g, 'Object.assign(');
                console.log(`[esbuild-fix-linkify] Fixed .assign calls in: ${args.path}`);
              }
              
              return { contents, loader: 'js' };
            });
          }
        }
      ],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    copyPublicDir: false,
    minify: false,
    rollupOptions: {
      plugins: [
        inject({ 
          Buffer: ['buffer', 'Buffer']
        }),
        // Also add the fix plugin to rollup - more comprehensive
        {
          name: 'rollup-fix-linkify',
          transform(code, id) {
            // Only process linkify-related files
            if (!id.includes('linkify') && !code.includes('linkify') && !code.includes('Linkify')) {
              return null;
            }
            
            let hasChanges = false;
            let transformed = code;
            
            // Fix options.assign pattern first
            if (code.includes('options.assign(')) {
              transformed = transformed.replace(/\boptions\.assign\(/g, 'Object.assign(');
              hasChanges = true;
              console.log(`[rollup-fix-linkify] Fixed options.assign in: ${id}`);
            }
            
            // Fix any other .assign calls that aren't Object.assign
            if (code.includes('.assign(') && !transformed.includes('Object.assign(')) {
              transformed = transformed.replace(/(\w+)\.assign\s*\(/g, 'Object.assign(');
              hasChanges = true;
              console.log(`[rollup-fix-linkify] Fixed .assign calls in: ${id}`);
            }
            
            // Add Object.assign polyfill if we made changes
            if (hasChanges && !code.includes('Object.assign')) {
              const polyfill = `
// Object.assign polyfill for linkify-react compatibility
if (typeof Object.assign !== 'function') {
  Object.assign = function(target) {
    'use strict';
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];
      if (nextSource != null) {
        for (var nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}
`;
              transformed = polyfill + '\n' + transformed;
              console.log(`[rollup-fix-linkify] Added Object.assign polyfill to: ${id}`);
            }
            
            if (hasChanges) {
              return {
                code: transformed,
                map: null
              };
            }
            
            return null;
          }
        }
      ]
    },
  },
});
