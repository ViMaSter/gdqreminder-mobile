import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ke.mahn.gdqreminder",
  appName: "GDQ Reminder",
  webDir: "dist",
  bundledWebRuntime: false,
  plugins: {
    SystemBars: {
      insetsHandling: "disable",
    },
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
      resizeOnFullScreen: false
    }
  },
  server: {
    androidScheme: "http",
  },
};

export default config;
