<script setup lang="ts">
import Loading from './components/Loading.vue';
import GDQMain from './components/GDQMain.vue'
import { PushNotifications, Channel as g } from '@capacitor/push-notifications';
import { EventHandler } from './utilities/eventHandler';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { Theme, useThemeStore } from '@/stores/theme';
import { onMounted, provide, ref, watch } from 'vue';
import PushNotificationHelper from './utilities/pushNotificationHelper';
import { FriendUserIDState, useUserIDStore } from './stores/friendUserID';
import { store } from './utilities/firebaseConfig';
import { onSnapshot, doc, Unsubscribe } from 'firebase/firestore'
import { useFriendRunReminderStore } from './stores/friendRuns';
import { SubscriptionCallback } from 'pinia';

if (useThemeStore().currentTheme === Theme.Dark)
{
    document.body.classList.add('dark-mode');
}

const jumpToTwitch = async () => {
  const urls = [
    "twitch://stream/gamesdonequick",
    "https://twitch.tv/gamesdonequick"
  ];
  for (const url of urls) {
    const {completed} = await AppLauncher.openUrl({url});
    if (completed)
    {
      return;
    }
  }

  throw new Error("Neither the Twitch app nor a web browser is installed");
};

provide("jumpToTwitch", jumpToTwitch);

const mainContent = ref<typeof GDQMain>();

const addListeners = async () => {
  await PushNotifications.addListener('registration', token => {
    console.info('Registration token: ', token.value);
  });

  await PushNotifications.addListener('registrationError', err => {
    console.error('Registration error: ', err.error);
  });

  await PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('Push notification received: ', JSON.stringify(notification));
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
    console.log('Push notification action performed', notification.actionId, JSON.stringify(notification));
    if (!notification.notification.data.event)
    {
        console.warn("Handling notification without event data");
        return;
    }
    
    EventHandler.handleCustomEvent(notification.notification.data.event, { 
      run: jumpToTwitch,
      event: () => {
        mainContent.value!.updateCurrentEventToNewest();
      }
    });
  });
}

const registerNotifications = async () => {
  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    throw new Error('User denied permissions!');
  }

  await PushNotifications.register();

  await PushNotificationHelper.subscribeToScheduleUpdates();
}

let unsubscribe: Unsubscribe | null = null;
let subscribe = (friendUserID : string) => {
  if (friendUserID == null || friendUserID.length === 0)
  {
    return;
  }
  const docRef = doc(store, "remindersByUserID", friendUserID);
  const friendRunStore = useFriendRunReminderStore();
  if (unsubscribe != null)
  {
    unsubscribe();
  }
  unsubscribe = onSnapshot(docRef, (doc) => {
    if (doc.exists())
    {
      const data = doc.data();
      if (data)
      {
        friendRunStore.set(data.runs);
      }
    }
  });
};

const userIDStore = useUserIDStore();
if (userIDStore.friendUserID != null && userIDStore.friendUserID.length !== 0)
{
  subscribe(userIDStore.friendUserID);
}
userIDStore.$subscribe((mutation, state) => {
  subscribe(state.friendUserID!);
});

console.log(Capacitor.isPluginAvailable("PushNotification"));
registerNotifications()
  .then(async () => {
    addListeners()
      .catch(e => {
        console.groupCollapsed("Suppressed PushNotification error on web");
        console.error(e);
        console.groupEnd();
      });
  })
  .catch(e => {
    console.groupCollapsed("Suppressed PushNotification error on web");
    console.error(e);
    console.groupEnd();
  });

const loadingContent = ref<typeof Loading>();

onMounted(() => {
  watch(mainContent, () => {
    loadingContent.value!.hide();
  });
});
</script>

<template>
  <Loading class="loading" ref="loadingContent" ></Loading>
  <Suspense>
    <GDQMain ref="mainContent" ></GDQMain>
  </Suspense>
  <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:FILL@0..1" rel="stylesheet">
</template>
<style>
.loading
{
  z-index: 10000;
}
*
{
  -webkit-touch-callout: none;
    -webkit-user-select: none;
     -khtml-user-select: none;
       -moz-user-select: none;
        -ms-user-select: none;
            user-select: none;
}
body
{
  font-family: Roboto;
  margin: 0;
  width: 100vw;
}
body.dark-mode
{
  background: black;
  color: white;
  --_icon-color: white;
}
</style>