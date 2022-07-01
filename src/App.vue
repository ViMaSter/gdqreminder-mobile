<script setup lang="ts">
import GDQMain from './components/GDQMain.vue'
import { PushNotifications, Channel as g } from '@capacitor/push-notifications';
import { EventHandler, NestedEventCallbacks} from './utilities/eventHandler';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { Theme, useThemeStore } from '@/stores/theme';
import { provide } from 'vue';

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

const addListeners = async () => {
  await PushNotifications.addListener('registration', token => {
    console.info('Registration token: ', token.value);
  });

  await PushNotifications.addListener('registrationError', err => {
    console.error('Registration error: ', err.error);
  });

  await PushNotifications.addListener('pushNotificationReceived', notification => {
    console.log('Push notification received: ', notification);
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', notification => {
    console.log('Push notification action performed', notification.actionId, JSON.stringify(notification));
    if (!notification.notification.data.event)
    {
        console.warn("Handling notification without event data");
        return;
    }
    EventHandler.handleCustomEvent(notification.notification.data.event, { run: jumpToTwitch });
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
}

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
</script>

<template>
  <Suspense>
    <GDQMain />
  </Suspense>
  <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Material+Icons&display=block" rel="stylesheet">
</template>
<style>
* {
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
}
</style>