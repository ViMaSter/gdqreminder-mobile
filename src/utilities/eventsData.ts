import Version from "@/plugins/versionPlugin";
import { GDQEventData } from "../interfaces/GDQEvent";
import { CapacitorHttp } from "@capacitor/core";

// keep this short: new events (e.g. GDQX) get added to the tracker at any time
// and must show up without waiting for the cache key to roll over
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

export class EventsData {
  static async getEventsData(datetime_gte: Date): Promise<GDQEventData[]> {
    datetime_gte.setHours(0, 0, 0, 0);
    const key = "eventsDataV2-" + datetime_gte.toISOString();
    let cached: { expiration: number; data: GDQEventData[] } | null = null;
    try {
      cached = JSON.parse(localStorage.getItem(key) as string);
    } catch (e) {
      // ignore cache parse errors
    }
    if (cached && cached.expiration > Date.now()) {
      return cached.data;
    }

    let data: GDQEventData[];
    try {
      const response = await CapacitorHttp.get({
        url: "https://gdqreminder.by.vincent.mahn.ke/proxy/tracker/api/v2/events/",
        headers: {
          'User-Agent': `GDQReminderClient/${(await Version.getCurrent()).versionName}`
        },
      });
      data = (response.data.results as GDQEventData[]).filter((event) => {
        return new Date(event.datetime) >= datetime_gte;
      });
    } catch (e) {
      // offline or tracker unavailable: fall back to stale data, if any
      if (cached) {
        return cached.data;
      }
      throw e;
    }

    localStorage.setItem(
      key,
      JSON.stringify({ expiration: Date.now() + CACHE_TTL_MS, data }),
    );
    return data;
  }
}
