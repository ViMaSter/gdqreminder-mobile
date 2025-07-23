import Version from "@/plugins/versionPlugin";
import { GDQEventData } from "../interfaces/GDQEvent";
import { CapacitorHttp } from "@capacitor/core";

export class EventsData {
  static async getEventsData(datetime_gte: Date): Promise<GDQEventData[]> {
    datetime_gte.setHours(0, 0, 0, 0);
    const key = "eventsDataV2-" + datetime_gte.toISOString();
    if (localStorage.getItem(key)) {
      const eventsData = JSON.parse(localStorage.getItem(key) as string);
      if (eventsData.expiration > Date.now()) {
        return eventsData.data;
      }
    }
    const response = await CapacitorHttp.get({
      url: "https://tracker.gamesdonequick.com/tracker/api/v2/events/",
      headers: {
        'User-Agent': `GDQReminderClient/${(await Version.getCurrent()).versionName}`
      },
    });

    const data = (response.data.results as GDQEventData[]).filter((event) => {
      return new Date(event.datetime) >= datetime_gte;
    });
    const eventsData = {
      expiration: Date.now() + 1000 * 60 * 60 * 24 * 30 * 2,
      data,
    };
    localStorage.setItem(key, JSON.stringify(eventsData));
    return eventsData.data;
  }
}
