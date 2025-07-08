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
      Accept: "application/xml"
      }
    });

      debugger;

    // Parse the XML response using DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, "application/xml");
    const items = Array.from(xmlDoc.getElementsByTagName("list-item"));

    const data: GDQEventData[] = items.map((item) => {
      const id = Number(item.getElementsByTagName("id")[0]?.textContent || 0);
      const short = item.getElementsByTagName("short")[0]?.textContent || "";
      const datetime = item.getElementsByTagName("datetime")[0]?.textContent || "";
      return { id, short, datetime };
    }).filter((event) => {
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
