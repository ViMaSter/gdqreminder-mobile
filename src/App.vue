<script setup lang="ts">
import Highlighter from "./components/Highlighter.vue";
import LoadingIndicator from "./components/LoadingIndicator.vue";
import GDQSettings from "./pages/GDQSettings.vue";
import GDQMain from "./pages/GDQMain.vue";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { EventHandler } from "./utilities/eventHandler";
import { AppLauncher } from "@capacitor/app-launcher";
import { Theme, useThemeStore } from "@/stores/theme";
import { onMounted, provide, ref, watch } from "vue";
import { useUserIDStore } from "./stores/friendUserID";
import { store } from "./utilities/firebaseConfig";
import { onSnapshot, doc, Unsubscribe } from "firebase/firestore";
import { useFriendRunReminderStore } from "./stores/friendRuns";
import { useRunReminderStore } from "./stores/runReminders";
import { App } from "@capacitor/app";
import { useSettingsStore } from "./stores/settings";
import { ONBOARDING_DATA } from "./utilities/onboardingConstants";
import SafeArea from "./plugins/safeAreaPlugin";

if (useThemeStore().currentTheme === Theme.Dark) {
  document.body.classList.add("dark-mode");
}

const backButtonHooks = ref<Array<{
  id: string,
  hook: () => void
}>>([]);
const addBackButtonHook = (id: string, hook: () => void) : void => {
  backButtonHooks.value.push({id, hook});
};
const removeBackButtonHook = (id: string) : void => {
  backButtonHooks.value = backButtonHooks.value.filter((hook) => hook.id !== id);
};
const handleBackButton = () => {
  if (backButtonHooks.value.length === 0) {
    App.exitApp();
    return;
  }

  const callback = backButtonHooks.value.pop();
  if (callback?.hook) {
    callback.hook();
  }
};

provide("addBackButtonHook", addBackButtonHook);
provide("removeBackButtonHook", removeBackButtonHook);


// Handle back button on Android and offer workaround for web
App.addListener("backButton", handleBackButton);
window.addEventListener("keydown", (e) => {
  if (
    (e.key === "b" || e.key === "B") &&
    (e.ctrlKey ||
    e.metaKey)
  ) {
    handleBackButton();
  }
});

const jumpToTwitch = async () => {
  const urls = [
    "twitch://stream/gamesdonequick",
    "https://twitch.tv/gamesdonequick",
  ];
  for (const url of urls) {
    const { completed } = await AppLauncher.openUrl({ url });
    if (completed) {
      return;
    }
  }

  throw new Error("Neither the Twitch app nor a web browser is installed");
};

provide("jumpToTwitch", jumpToTwitch);

const mainContent = ref<typeof GDQMain>();

const addListeners = async () => {
  await PushNotifications.addListener("registration", (token) => {
    console.info("Registration token: ", token.value);
  });

  await PushNotifications.addListener("registrationError", (err) => {
    console.error("Registration error: ", err.error);
  });

  await PushNotifications.addListener(
    "pushNotificationReceived",
    (notification) => {
      console.log("Push notification received: ", JSON.stringify(notification));
    },
  );

  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (notification) => {
      console.log(
        "Push notification action performed",
        notification.actionId,
        JSON.stringify(notification),
      );
      if (!notification.notification.data.event) {
        console.warn("Handling notification without event data");
        return;
      }

      EventHandler.handleCustomEvent(notification.notification.data.event, {
        run: jumpToTwitch,
        event: () => {
          mainContent.value!.updateCurrentEventToNewest();
        },
      });
    },
  );
};

const registerNotifications = async () => {
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === "prompt") {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== "granted") {
    throw new Error("User denied permissions!");
  }

  await PushNotifications.register();
};

const friendRunStore = useFriendRunReminderStore();
const runReminderStore = useRunReminderStore();
let unsubscribe: Unsubscribe | null = null;
let unsubscribeRunReminder: (() => void) | null = null;
const subscribe = (friendUserID: string) => {
  if (friendUserID == null || friendUserID.length === 0) {
    if (unsubscribeRunReminder) {
      unsubscribeRunReminder();
      unsubscribeRunReminder = null;
    }
    friendRunStore.set([]);
    return;
  }

  const ownUserID = localStorage.getItem("firebaseUserID");
  if (friendUserID === ownUserID) {
    if (unsubscribe != null) {
      unsubscribe();
      unsubscribe = null;
    }
    if (unsubscribeRunReminder) {
      unsubscribeRunReminder();
    }
    friendRunStore.set(runReminderStore.allReminders);
    unsubscribeRunReminder = runReminderStore.$subscribe((_, state) => {
      friendRunStore.set(state.runs);
    });
    return;
  }

  if (unsubscribeRunReminder) {
    unsubscribeRunReminder();
    unsubscribeRunReminder = null;
  }

  const docRef = doc(store, "remindersByUserID", friendUserID);
  if (unsubscribe != null) {
    unsubscribe();
  }
  
  unsubscribe = onSnapshot(docRef, (doc) => {
    if (!doc.exists()) {
      friendRunStore.set([]);
      return;
    }

    const data = doc.data();
    if (!data) {
      friendRunStore.set([]);
      return;
    }
    friendRunStore.set(data.runs);
  });
};

const userIDStore = useUserIDStore();
if (userIDStore.friendUserID != null && userIDStore.friendUserID.length !== 0) {
  subscribe(userIDStore.friendUserID);
}
userIDStore.$subscribe((mutation, state) => {
  subscribe(state.friendUserID!);
});

registerNotifications()
  .then(async () => {
    addListeners().catch((e) => {
      console.groupCollapsed("Suppressed PushNotification error on web");
      console.error(e);
      console.groupEnd();
    });
  })
  .catch((e) => {
    console.groupCollapsed("Suppressed PushNotification error on web");
    console.error(e);
    console.groupEnd();
  });

const loadingContent = ref<typeof LoadingIndicator>();
const highlighter = ref<typeof Highlighter>();
provide("highlightElement", (el: (HTMLElement | null)[] | HTMLElement | null) => {
  highlighter.value!.highlightElement(el);
});

const platform = Capacitor.getPlatform();
type SafeAreaInsetsMap = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

const applyInsets = (insets: SafeAreaInsetsMap) => {
  for (const [key, value] of Object.entries(insets)) {
    document.documentElement.style.setProperty(
      `--safe-area-inset-${key}`,
      `${value}px`,
    );
  }
};

const refreshSafeAreaInsets = async () => {
  if (platform !== "android") {
    return;
  }

  const insets = await SafeArea.getSafeAreaInsets();
  applyInsets(insets);
};

const refreshSafeAreaInsetsWithRetry = async () => {
  if (platform !== "android") {
    await refreshSafeAreaInsets();
    return;
  }

  // Work around delayed inset availability on some Capacitor/Android combinations.
  let lastInsets: SafeAreaInsetsMap = { top: 0, right: 0, bottom: 0, left: 0 };
  for (let attempt = 0; attempt < 6; attempt++) {
    const insets = await SafeArea.getSafeAreaInsets();
    lastInsets = {
      top: Math.max(lastInsets.top, insets.top),
      right: Math.max(lastInsets.right, insets.right),
      bottom: Math.max(lastInsets.bottom, insets.bottom),
      left: Math.max(lastInsets.left, insets.left),
    };
    applyInsets(lastInsets);

    if (lastInsets.top > 0 || lastInsets.right > 0 || lastInsets.bottom > 0 || lastInsets.left > 0) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
};

onMounted(() => {
  watch(mainContent, () => {
    if (mainContent && mainContent.value) {
      App.addListener('resume', () => {mainContent.value!.loadRuns(mainContent.value!.currentEventID); });
    }
  });

  watch(
    () => [
      mainContent.value?.currentEventID ?? -1,
      Object.keys(mainContent.value?.runsByDay ?? {}).length,
    ],
    ([eventID, dayCount]) => {
      if (eventID > 0 && dayCount > 0) {
        loadingContent.value?.hide();
      }
    },
    { immediate: true },
  );

  refreshSafeAreaInsetsWithRetry().catch((error) => {
    console.warn("Failed to refresh safe area insets", error);
  });

  if (platform === "android") {
    const refreshInsetsOnResize = () => {
      refreshSafeAreaInsetsWithRetry().catch((error) => {
        console.warn("Failed to refresh safe area insets", error);
      });
    };

    window.addEventListener("resize", refreshInsetsOnResize);
  }

});

const visibility = ref<Record<string, boolean>>({
  settings: false,
  main: true,
});
const settings = ref<typeof GDQSettings>();

const setVisibility = async (key : string, data : string) => {
  storeInitializationAtStartup = data != ONBOARDING_DATA;
  visibility.value = Object.fromEntries(Object.keys(visibility.value).map((k) => [k, false]));
  visibility.value[key] = true;
};

let storeInitializationAtStartup = useSettingsStore().initialized;
let onboardingCalledStacktraces = new Set<string>();

function requireOnboarding(): boolean {
  if (storeInitializationAtStartup) {
    return false;
  }
  storeInitializationAtStartup = true;
  const stack = new Error().stack || "";
  if (onboardingCalledStacktraces.has(stack)) {
    return false;
  }
  onboardingCalledStacktraces.add(stack);
  return true;
}
provide("requireOnboarding", requireOnboarding);
</script>

<template>
  <Highlighter ref="highlighter"></Highlighter>
  <LoadingIndicator class="loading" ref="loadingContent"></LoadingIndicator>
  <TransitionGroup name="list">
    <Suspense :key="'main'">
      <GDQMain v-show="visibility['main']" :isVisible="visibility['main']" @setVisibility="setVisibility" ref="mainContent" class="main"></GDQMain>
    </Suspense>
    <Suspense :key="'settings'">
      <GDQSettings ref="settings" v-show="visibility['settings']" :isVisible="visibility['settings']" @setVisibility="setVisibility" class="gdq-settings"></GDQSettings>
    </Suspense>
  </TransitionGroup>
  <link
    href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"
    rel="stylesheet"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL@0..1"
    rel="stylesheet"
  />
</template>
<style lang="scss">
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}

.list-move.gdq-settings, /* apply transition to moving elements */
.list-enter-active.gdq-settings,
.list-leave-active.gdq-settings {
  transition: all 0.25s ease-out;
}
.list-move.main, /* apply transition to moving elements */
.list-enter-active.main,
.list-leave-active.main {
  transition: opacity 0.25s ease-out;
  transform: initial !important;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px) translateY(0px) !important;
}

/* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
.list-leave-active {
  position: absolute !important;
  top: 0px !important;
}

.gdq-settings {
  z-index: 1000;
}

.loading {
  z-index: 10000;
}
* {
  -webkit-touch-callout: none;

  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  /* workaround for iOS Safari, which changes run name text size if alerts or friend indicators are active */
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
}
body {
  font-family: Roboto;
  margin: 0;
  width: 100vw;
  overflow-x: hidden;

  background: var(--md-sys-color-background);
  color: var(--md-sys-color-on-background);
}

#app {
  overflow-x: hidden;
}

m3e-list-action {
  --m3e-list-item-supporting-text-color: var(--md-sys-color-on-surface-variant) !important;
  --m3e-list-item-disabled-label-text-color: var(--m3e-list-item-supporting-text-color) !important;
}

m3e-app-bar {
  --m3e-app-bar-title-text-color: var(--md-theme-on-primary);
  --m3e-app-bar-small-title-text-font-size: 1.25rem;
  --m3e-app-bar-padding-left: 0.25rem;
  --m3e-app-bar-padding-right: 0.75rem;
  --m3e-app-bar-container-color: var(--mdc-theme-primary);
  background-color: var(--mdc-theme-primary);
  --m3e-icon-button-icon-color: var(--md-sys-color-on-surface-variant);
  padding-top: var(--safe-area-inset-top);
  --m3e-app-bar-small-container-height: 64px;
}

@media (max-width: 599px) {
    m3e-app-bar {
        --m3e-app-bar-small-container-height: 56px;
    }
}

m3e-icon-button[slot="leading"] {
  min-width: 3.5rem;
  margin-right: 0.5rem;
}
</style>
