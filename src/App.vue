<script setup lang="ts">
import GDQHeader from './components/GDQHeader.vue'
import { PushNotifications, Channel as g } from '@capacitor/push-notifications';
import { EventHandler, NestedEventCallbacks} from './utilities/eventHandler';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
{
    document.body.classList.add('dark-mode');
}

const addListeners = async () => {
  const handler : NestedEventCallbacks = {
      run: {
        start: async (remaining : string[]) => {
          const [pk] = remaining;
          if(await AppLauncher.canOpenUrl({ url: "twitch://open"}))
          {
              AppLauncher.openUrl({url: `twitch://stream/gamesdonequick`});
              return;
          }
          if(await AppLauncher.canOpenUrl({ url: "https://twitch.tv/gamesdonequick"}))
          {
              AppLauncher.openUrl({url: `https://twitch.tv/gamesdonequick`});
              return;
          }

          throw new Error("Neither the Twitch app nor a web browser is installed");
        }
      }
  };

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
    EventHandler.handleCustomEvent(notification.notification.data.event, handler);
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
        console.groupCollapsed("Supressed PushNotification error on web");
        console.error(e);
        console.groupEnd();
      });
  })
  .catch(e => {
    console.groupCollapsed("Supressed PushNotification error on web");
    console.error(e);
    console.groupEnd();
  });

</script>

<template>
  <Suspense>
    <GDQHeader />
  </Suspense>
  <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css?family=Material+Icons&display=block" rel="stylesheet">
</template>
<style>
body
{
  margin: 0;
}
body.dark-mode
{
  background: black;
  color: white;
}
</style>