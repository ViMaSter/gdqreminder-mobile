import { fileURLToPath, URL } from 'url'

import { defineConfig } from 'vite'
import sentryVitePlugin from "@sentry/vite-plugin";
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/

const plugins = [
  vue({
    template: {
      compilerOptions: {
        isCustomElement: tag => tag.startsWith('mwc-')
      }
    }
  }),
  vueJsx()
];
if (process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_RELEASE) {
    sentryVitePlugin({
      org: "vimaster",
      project: "gdqtracker-mobile",

      include: "./dist",

      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: process.env.SENTRY_RELEASE,
    });
}

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    }
  },
  server: {
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
