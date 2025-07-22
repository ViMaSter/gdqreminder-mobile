<script setup lang="ts">
import LoadingIndicator from "./components/LoadingIndicator.vue";
import GDQSettings from "./pages/GDQSettings.vue";
import GDQMain from "./pages/GDQMain.vue";
import { PushNotifications } from "@capacitor/push-notifications";
import { EventHandler } from "./utilities/eventHandler";
import { AppLauncher } from "@capacitor/app-launcher";
import { Theme, useThemeStore } from "@/stores/theme";
import { onMounted, provide, ref, watch } from "vue";
import { useUserIDStore } from "./stores/friendUserID";
import { store } from "./utilities/firebaseConfig";
import { onSnapshot, doc, Unsubscribe } from "firebase/firestore";
import { useFriendRunReminderStore } from "./stores/friendRuns";
import { SafeArea } from "capacitor-plugin-safe-area";
import { App } from "@capacitor/app";
import Snackbar from "./components/Snackbar.vue";

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
let unsubscribe: Unsubscribe | null = null;
const subscribe = (friendUserID: string) => {
  if (friendUserID == null || friendUserID.length === 0) {
    friendRunStore.set([]);
    return;
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

onMounted(() => {
  watch(mainContent, () => {
    loadingContent.value!.hide();
  });
});

SafeArea.getSafeAreaInsets().then(({ insets }) => {
  for (const [key, value] of Object.entries(insets)) {
    document.documentElement.style.setProperty(
      `--safe-area-inset-${key}`,
      `${value}px`,
    );
  }
});

SafeArea.addListener("safeAreaChanged", (data) => {
  const { insets } = data;
  for (const [key, value] of Object.entries(insets)) {
    document.documentElement.style.setProperty(
      `--safe-area-inset-${key}`,
      `${value}px`,
    );
  }
});

const visibility = ref<Record<string, boolean>>({
  settings: false,
  main: true,
});
const setVisibility = async (key : string, value: boolean) => {
  visibility.value[key] = value;
};
</script>

<template>
  <LoadingIndicator class="loading" ref="loadingContent"></LoadingIndicator>
  <TransitionGroup name="list">
    <Suspense :key="'main'">
      <GDQMain v-show="visibility['main']" @setVisibility="setVisibility" ref="mainContent" class="main"></GDQMain>
    </Suspense>
    <Suspense :key="'settings'">
      <GDQSettings v-show="visibility['settings']" @setVisibility="setVisibility" class="gdq-settings"></GDQSettings>
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
}
body {
  font-family: Roboto;
  margin: 0;
  width: 100vw;

  background: var(--md-sys-color-background);
  color: var(--md-sys-color-on-background);
}
</style>
