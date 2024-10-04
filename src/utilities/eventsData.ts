import { GDQEventData } from "../interfaces/GDQEvent";
import { CapacitorHttp } from "@capacitor/core";

export class EventsData {
  static async getEventsData(datetime_gte: Date): Promise<GDQEventData[]> {
    datetime_gte.setHours(0, 0, 0, 0);
    const key = "eventsData-" + datetime_gte.toISOString();
    if (localStorage.getItem(key)) {
      const eventsData = JSON.parse(localStorage.getItem(key) as string);
      if (eventsData.expiration > Date.now()) {
        return eventsData.data;
      }
    }
    const response = await CapacitorHttp.get({
      url:
        "https://gamesdonequick.com/tracker/api/v1/search/?type=event&datetime_gte=" +
        datetime_gte.toISOString(),
    });

    const data = response.data as GDQEventData[];
    const eventsData = {
      expiration: Date.now() + 1000 * 60 * 60 * 24 * 30 * 2,
      data: data,
    };
    localStorage.setItem(key, JSON.stringify(eventsData));
    return eventsData.data;
  }
}
