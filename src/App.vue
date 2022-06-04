<script setup lang="ts">
import GDQHeader from './components/GDQHeader.vue'
import { PushNotifications, Channel as g } from '@capacitor/push-notifications';

if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
{
    document.body.classList.add('dark-mode');
}

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
    console.log('Push notification action performed', notification.actionId, notification.inputValue);
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

registerNotifications().then(() => {
  addListeners();
})
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