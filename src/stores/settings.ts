import { defineStore } from "pinia";
import PushNotificationHelper from '@/utilities/pushNotificationHelper';

export const languages = {
  'systemDefault': 'systemDefault',
  'english': 'en-US',
  'german': 'de-DE'
} as const;
export type LanguageKey = keyof typeof languages;

type SettingsState = {
  subscribedToEventAnnouncements: boolean;
  subscribedToEventUpdates: boolean;
  selectedLanguage: LanguageKey;
};

const key = "piniaState-settings";
const defaultValue: SettingsState = {
  subscribedToEventAnnouncements: false,
  subscribedToEventUpdates: false,
  selectedLanguage: 'systemDefault',
};

export const useSettingsStore = defineStore(key, {
  state: (): SettingsState => {
    const state = localStorage.getItem(key);
    if (!state) {
      return defaultValue;
    }

    return JSON.parse(state);
  },
  getters: {
    eventAnnouncementsEnabled: (state) => state.subscribedToEventAnnouncements,
    eventUpdatesEnabled: (state) => state.subscribedToEventUpdates,
    currentLanguage: (state) => {
      if (state.selectedLanguage !== 'systemDefault') {
        return languages[state.selectedLanguage];
      }
      return navigator.language; // Fallback to browser language if 'systemDefault'
    },
  },
  actions: {
    async setSubscriptionToEventAnnouncements(enabled: boolean): Promise<void> {
      try {
        if (enabled) {
          await PushNotificationHelper.eventAnnouncements.subscribe();
        } else {
          await PushNotificationHelper.eventAnnouncements.unsubscribe();
        }
      } catch (error) {
        throw new Error(
          `Cannot update event announcements subscription as Firebase is unavailable; try restarting the app and make sure you have an internet connection. Details: ${error}`,
        );
      }
      this.$state.subscribedToEventAnnouncements = enabled;
      localStorage.setItem(key, JSON.stringify(this.$state));
    },
    async setSubscriptionToEventUpdates(enabled: boolean): Promise<void> {
      try {
        if (enabled) {
          await PushNotificationHelper.eventUpdates.subscribe();
        } else {
          await PushNotificationHelper.eventUpdates.unsubscribe();
        }
      } catch (error) {
        throw new Error(
          `Cannot update event updates subscription as Firebase is unavailable; try restarting the app and make sure you have an internet connection. Details: ${error}`,
        );
      }
      this.$state.subscribedToEventUpdates = enabled;
      localStorage.setItem(key, JSON.stringify(this.$state));
    },
    setLanguage(language: LanguageKey): void {
      this.$state.selectedLanguage = language;
      localStorage.setItem(key, JSON.stringify(this.$state));
      location = location;
    }
  },
});
