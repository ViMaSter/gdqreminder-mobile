import { FCM } from "@capacitor-community/fcm";

export default class PushNotificationHelper {
  public static subscribeToScheduleUpdates = async () => {
    await FCM.subscribeTo({ topic: "event.schedule" });
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
