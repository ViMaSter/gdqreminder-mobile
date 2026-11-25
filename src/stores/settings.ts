import { defineStore } from "pinia";
import { Capacitor } from "@capacitor/core";
import PushNotificationHelper from '@/utilities/pushNotificationHelper';
import { topicDiff } from '@/utilities/scheduleUpdateTopics';

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
  // lowercase shorts of upcoming events the user has run reminders for
  followedEventShorts: string[];
  // event shorts this device is currently subscribed to for schedule updates
  subscribedEventUpdateShorts: string[];
  // 1: generic `event.update` topic for all events; 2: `event.update.<event short>`
  topicsVersion: number;
};

const CURRENT_TOPICS_VERSION = 2;

const key = "piniaState-settings";
const defaultValue: SettingsState = {
  subscribedToEventAnnouncements: true,
  subscribedToEventUpdates: true,
  selectedLanguage: 'systemDefault',
  followedEventShorts: [],
  subscribedEventUpdateShorts: [],
  topicsVersion: CURRENT_TOPICS_VERSION,
};

// on web, Firebase is unavailable; treat calls as successful like the other settings do
const tryTopicCall = async (call: () => Promise<void>): Promise<boolean> => {
  try {
    await call();
    return true;
  } catch (error) {
    if (Capacitor.getPlatform() === "web") {
      return true;
    }
    console.warn("Updating push notification topic failed; retrying on next sync", error);
    return false;
  }
};

export const useSettingsStore = defineStore(key, {
  state: (): SettingsState => {
    const state = localStorage.getItem(key);
    if (!state) {
      new Promise<void>(async (resolve) => {
        try {
          await PushNotificationHelper.eventAnnouncements.subscribe();
        } catch (error) {
          console.error(error);
        }
        resolve();
      });
      return structuredClone(defaultValue);
    }

    // state persisted by versions before per-event schedule updates lacks the newer fields
    return { ...structuredClone(defaultValue), topicsVersion: 1, ...JSON.parse(state) };
  },
  getters: {
    initialized: () => {
      return localStorage.getItem(key) !== null;
    },
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
    async setDefaults(): Promise<void> {
      this.setSubscriptionToEventAnnouncements(true);
      this.setSubscriptionToEventUpdates(true);
    },
    async setSubscriptionToEventAnnouncements(enabled: boolean): Promise<void> {
      try {
        if (enabled) {
          await PushNotificationHelper.eventAnnouncements.subscribe();
        } else {
          await PushNotificationHelper.eventAnnouncements.unsubscribe();
        }
      } catch (error) {
        if (Capacitor.getPlatform() !== "web") {
          throw new Error(
            `Cannot update event announcements subscription as Firebase is unavailable; try restarting the app and make sure you have an internet connection. Details: ${error}`,
          );
        }
      }
      this.$state.subscribedToEventAnnouncements = enabled;
      localStorage.setItem(key, JSON.stringify(this.$state));
    },
    async setSubscriptionToEventUpdates(enabled: boolean): Promise<void> {
      this.$state.subscribedToEventUpdates = enabled;
      localStorage.setItem(key, JSON.stringify(this.$state));
      await this.syncScheduleUpdateTopics();
    },
    /**
     * Subscribes to schedule updates of exactly the followed events (or none, if disabled).
     * @param followedEventShorts lowercase shorts of upcoming events with run reminders;
     *   omit to reuse the last known ones
     */
    async syncScheduleUpdateTopics(followedEventShorts?: string[]): Promise<void> {
      if (followedEventShorts) {
        this.$state.followedEventShorts = followedEventShorts;
        localStorage.setItem(key, JSON.stringify(this.$state));
      }

      const desired = this.$state.subscribedToEventUpdates ? this.$state.followedEventShorts : [];
      const { toSubscribe, toUnsubscribe } = topicDiff(this.$state.subscribedEventUpdateShorts, desired);
      for (const short of toSubscribe) {
        if (await tryTopicCall(() => PushNotificationHelper.eventUpdates.subscribe(short))) {
          // syncs may overlap (e.g. a reminder toggled mid-sync), so don't add twice
          this.$state.subscribedEventUpdateShorts = [...new Set([...this.$state.subscribedEventUpdateShorts, short])];
          localStorage.setItem(key, JSON.stringify(this.$state));
        }
      }
      for (const short of toUnsubscribe) {
        if (await tryTopicCall(() => PushNotificationHelper.eventUpdates.unsubscribe(short))) {
          this.$state.subscribedEventUpdateShorts = this.$state.subscribedEventUpdateShorts.filter((s) => s !== short);
          localStorage.setItem(key, JSON.stringify(this.$state));
        }
      }
    },
    /**
     * Drops topics of older app versions; call after {@link syncScheduleUpdateTopics},
     * so the event-specific topics are in place before the generic one goes away.
     */
    async migrateTopics(): Promise<void> {
      if (this.$state.topicsVersion >= CURRENT_TOPICS_VERSION) {
        return;
      }
      const succeeded =
        (await tryTopicCall(PushNotificationHelper.legacy.unsubscribeFromAllEventUpdates)) &&
        (await tryTopicCall(PushNotificationHelper.legacy.unsubscribeFromScheduleUpdates));
      if (!succeeded) {
        return;
      }
      this.$state.topicsVersion = CURRENT_TOPICS_VERSION;
      localStorage.setItem(key, JSON.stringify(this.$state));
    },
    setLanguage(language: LanguageKey): void {
      this.$state.selectedLanguage = language;
      localStorage.setItem(key, JSON.stringify(this.$state));
      window.location.reload();
    }
  },
});
