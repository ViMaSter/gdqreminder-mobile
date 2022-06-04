import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ke.mahn.gdqreminder',
  appName: 'GDQ Reminder',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
