import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as Sentry from "@sentry/vue";
import { BrowserTracing } from "@sentry/tracing";
import {version} from '../package.json';


import App from './App.vue'

const app = createApp(App)
const pinia = createPinia();

if (process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_RELEASE)
{
  Sentry.init({
    app,
    dsn: "https://7cc331a1d01f4e78a7aab7e341705060@o489289.ingest.sentry.io/6470411",
    integrations: [
      new BrowserTracing(),
    ],
    tracesSampleRate: 1.0,
    release: "gdqreminder-mobile@" + version,
  });
}
app.use(pinia);
app.mount('#app')