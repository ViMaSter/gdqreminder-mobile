import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/vue";
import { CaptureConsole } from '@sentry/integrations';

import App from './App.vue'
import { Capacitor } from '@capacitor/core';

const app = createApp(App)
const pinia = createPinia();

// disable sentry in dev mode
if (Capacitor.getPlatform() !== 'web') {
  Sentry.init({
    app,
    dsn: "https://7cc331a1d01f4e78a7aab7e341705060@o489289.ingest.sentry.io/6470411",
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: false,
        maskAllInputs: false,
        networkDetailAllowUrls: [/.*/]
      }),
      new CaptureConsole({
        levels: ['error']
      })
    ],
    tracesSampleRate: 1.0
  });
}

app.use(pinia);
app.mount('#app')
