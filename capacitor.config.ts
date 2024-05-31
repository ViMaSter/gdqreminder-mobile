import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ke.mahn.gdqreminder',
  appName: 'GDQ Reminder',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    BackgroundRunner: {
      label: 'com.example.background.task',
      src: 'background.js',
      event: 'myCustomEvent',
      repeat: true,
      interval: 1,
      autoStart: false
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["anonymous"],
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
