import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ke.mahn.gdqreminder",
  appName: "GDQ Reminder",
  webDir: "dist",
  bundledWebRuntime: false,
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["anonymous"],
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    Keyboard: {
      resize: "body",
      style: "DEFAULT",
      resizeOnFullScreen: true
    }
  },
  server: {
    androidScheme: "http",
  },
};

export default config;
