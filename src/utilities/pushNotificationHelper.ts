import { FCM } from "@capacitor-community/fcm";

export default class PushNotificationHelper {
  public static subscribeToScheduleUpdates = async () => {
    await FCM.subscribeTo({ topic: "event.schedule" }); // legacy global channel; replaced with `event.announcement` + `event.update`
  };
  public static subscribeToEventAnnouncements = async () => {
    await FCM.subscribeTo({ topic: "event.announcement" });
  };
  public static unsubscribeFromEventAnnouncements = async () => {
    await FCM.unsubscribeFrom({ topic: "event.announcement" });
  };
  public static isSubscribedToEventAnnouncements = async () => {
    try {
      const token = await FCM.getToken();
      return token.token.includes("event.announcement");
    } catch (e) {
      console.error("Error checking subscription to event announcements:", e);
      return false;
    }
  };
  public static subscribeToEventUpdates = async () => {
    await FCM.subscribeTo({ topic: "event.update" });
  };
  public static unsubscribeFromEventUpdates = async () => {
    await FCM.unsubscribeFrom({ topic: "event.update" });
  };
  public static isSubscribedToEventUpdates = async () => {
    try {
      const token = await FCM.getToken();
      return token.token.includes("event.update");
    } catch (e) {
      console.error("Error checking subscription to event updates:", e);
      return false;
    }
  };
  public static subscribeToStartOfRun = async (runID: string) => {
    if (parseInt(runID).toString() != runID) {
      throw new Error(`'${runID}' is not a valid run PK!`);
    }
    console.log("subscribing to run with ID " + runID);
    await FCM.subscribeTo({ topic: "run.start." + runID });
  };
  public static unsubscribeFromStartOfRun = async (runID: string) => {
    if (parseInt(runID).toString() != runID) {
      throw new Error(`'${runID}' is not a valid run PK!`);
    }
    console.log("unsubscribing from run with ID " + runID);
    await FCM.unsubscribeFrom({ topic: "run.start." + runID });
  };
}
