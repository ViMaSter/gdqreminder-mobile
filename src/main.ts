import { createApp } from "vue";
import { createPinia } from "pinia";
import * as Sentry from "@sentry/vue";

import App from "./App.vue";
import { Capacitor } from "@capacitor/core";
import { SafeArea } from "capacitor-plugin-safe-area";
import { createI18n } from 'vue-i18n'
import { useSettingsStore } from "./stores/settings";

async function fetchLocale(languageCode: string): Promise<any> {
  const response = await fetch(`/i18n/${languageCode}.json`);
  if (!response.ok) {
    throw new Error(`Failed to load locale file: ${languageCode}`);
  }
  const locale = await response.json();
  if (!locale || Object.keys(locale).length === 0) {
    throw new Error(`Locale file for ${languageCode} is empty`);
  }
  return locale;
}
(async () => {
  const app = createApp(App);

  const pinia = createPinia();
  app.use(pinia);

  const settingsStore = useSettingsStore();

  const messages: { [code: string]: any } = {
    en: await fetchLocale("en-US"),
  };
  try {
    messages[settingsStore.currentLanguage] = await fetchLocale(settingsStore.currentLanguage);
  } catch (error) {
    console.warn(`Using fallback locale 'en-US' instead of '${settingsStore.currentLanguage}' due to error: ${error}`);
  }

  const i18n = createI18n({
    locale: settingsStore.currentLanguage,
    legacy: false,
    fallbackLocale: 'en-US',
    messages
  });
  app.use(i18n)
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

  app.mount("#app");

  SafeArea.setImmersiveNavigationBar();
})();