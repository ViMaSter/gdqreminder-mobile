import { FCM } from "@capacitor-community/fcm";

export default class PushNotificationHelper {
  public static scheduleUpdates = {
    subscribe: async () => {
      await FCM.subscribeTo({ topic: "event.schedule" }); // legacy global channel; replaced with `event.announcement` + `event.update`
    }
  };
  public static eventAnnouncements = {
    subscribe: async () => {
      await FCM.subscribeTo({ topic: "event.announcement" });
    },
    unsubscribe: async () => {
      await FCM.unsubscribeFrom({ topic: "event.announcement" });
    }
  };
  public static eventUpdates = {
    subscribe: async () => {
      await FCM.subscribeTo({ topic: "event.update" });
    },
    unsubscribe: async () => {
      await FCM.unsubscribeFrom({ topic: "event.update" });
    }
  };
  public static startOfRun = {
    subscribe: async (runID: string) => {
      if (parseInt(runID).toString() != runID) {
        throw new Error(`'${runID}' is not a valid run PK!`);
      }
      console.log("subscribing to run with ID " + runID);
      await FCM.subscribeTo({ topic: "run.start." + runID });
    },
    unsubscribe: async (runID: string) => {
      if (parseInt(runID).toString() != runID) {
        throw new Error(`'${runID}' is not a valid run PK!`);
      }
      console.log("unsubscribing from run with ID " + runID);
      await FCM.unsubscribeFrom({ topic: "run.start." + runID });
    }
  };
}
