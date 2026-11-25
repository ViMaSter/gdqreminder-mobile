import { FCM } from "@capacitor-community/fcm";

const eventUpdateTopic = (eventShort: string) => {
  const short = eventShort.toLowerCase();
  if (!/^[a-z0-9_.~%-]+$/.test(short)) {
    throw new Error(`'${eventShort}' is not a valid event short!`);
  }
  return `event.update.${short}`;
};

export default class PushNotificationHelper {
  // topics older app versions subscribed to; only ever unsubscribed from
  public static legacy = {
    unsubscribeFromScheduleUpdates: async () => {
      await FCM.unsubscribeFrom({ topic: "event.schedule" }); // replaced with `event.announcement` + `event.update`
    },
    unsubscribeFromAllEventUpdates: async () => {
      await FCM.unsubscribeFrom({ topic: "event.update" }); // replaced with `event.update.<event short>`
    },
  };
  public static eventAnnouncements = {
    subscribe: async () => {
      await FCM.subscribeTo({ topic: "event.announcement" });
    },
    unsubscribe: async () => {
      await FCM.unsubscribeFrom({ topic: "event.announcement" });
    }
  };
  // new runs are only announced for events the user has run reminders for
  public static eventUpdates = {
    subscribe: async (eventShort: string) => {
      const topic = eventUpdateTopic(eventShort);
      console.log("subscribing to schedule updates via " + topic);
      await FCM.subscribeTo({ topic });
    },
    unsubscribe: async (eventShort: string) => {
      const topic = eventUpdateTopic(eventShort);
      console.log("unsubscribing from schedule updates via " + topic);
      await FCM.unsubscribeFrom({ topic });
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
