import { fileURLToPath, URL } from 'url'

import { defineConfig } from 'vite'
import { sentryVitePlugin } from "@sentry/vite-plugin";
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/

const plugins = [
  vue({
    template: {
      compilerOptions: {
        isCustomElement: tag => tag.startsWith('mwc-') || tag.startsWith('md-')
      }
    }
  }),
  vueJsx(),
  legacy({
    targets: ['defaults', 'Android >= 66'],
    modernPolyfills: true
  }),
];
if (process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_RELEASE) {
    plugins.push(sentryVitePlugin({
      org: "vimaster",
      project: "gdqreminder-mobile",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: "./dist/**"
      },
      release: {
        name: "gdqreminder-mobile@" + process.env.SENTRY_RELEASE
      },
    }));
}

export default defineConfig({
  build: {
    sourcemap: true
  },
  plugins,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
  server: {
    hmr: false,
    host: true,
    port: 4437
  },
  css: {
    preprocessorOptions:
    {
      scss:
      {
        additionalData: `@import "@/styles/_variables.scss";`
      }
    }
  }
})
