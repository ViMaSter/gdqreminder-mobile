import { createApp } from "vue";
import { createPinia } from "pinia";
import * as Sentry from "@sentry/vue";

import App from "./App.vue";
import { Capacitor } from "@capacitor/core";
import { SafeArea } from "capacitor-plugin-safe-area";
import { createI18n } from 'vue-i18n'
import { Device, GetLanguageCodeResult } from '@capacitor/device';
export const SUPPORT_LOCALES = ['en', 'de', 'fr', 'it', 'ja'];

Device.getLanguageCode().then(async (result : GetLanguageCodeResult) => {
  // fetch new URL('/i18n/${locale}.json', import.meta.url)
  console.log("Device Language Code:", result.value);
  let locale = "";
  try {
    const response = await fetch(`/i18n/${result.value}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load locale file: ${result.value}`);
    }
    locale = await response.json();
  }
  catch (e) {
    console.error(`Failed to load locale file: ${result.value}`, e);
  }

  const responseEn = await fetch("/i18n/en.json");
  if (!responseEn.ok) {
    throw new Error(`Failed to load locale file: en`);
  }
  const en = await responseEn.json();

  const messages : {[code: string]: any } = {en};
  if (locale) {
    messages[result.value] = locale;
  }

  const i18n = createI18n({
    
    locale: result.value,
    fallbackLocale: 'en',
    messages
  });
  const app = createApp(App);
  app.use(i18n)

  const pinia = createPinia();

  // disable sentry in dev mode
  if (Capacitor.getPlatform() !== "web") {
    Sentry.init({
      app,
      dsn: "https://7cc331a1d01f4e78a7aab7e341705060@o489289.ingest.sentry.io/6470411",
      replaysSessionSampleRate: 1.0,
      replaysOnErrorSampleRate: 1.0,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          maskAllInputs: false,
          networkDetailAllowUrls: [/.*/],
        }),
        Sentry.captureConsoleIntegration({
          levels: ["error"],
        }),
      ],
      tracesSampleRate: 1.0,
    });
  }

  app.use(pinia);
  app.mount("#app");

  SafeArea.setImmersiveNavigationBar();
});
