import Version from "@/plugins/versionPlugin";
import { GDQEventData } from "../interfaces/GDQEvent";
import { CapacitorHttp } from "@capacitor/core";
import {
  RequestAttempt,
  RequestFailedError,
  describeError,
  excerpt,
  parseJsonBody,
  pickRelevantHeaders,
} from "./requestDiagnostics";

// keep this short: new events (e.g. GDQX) get added to the tracker at any time
// and must show up without waiting for the cache key to roll over
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const EVENTS_URL = "https://gdqreminder.by.vincent.mahn.ke/proxy/tracker/api/v2/events/";

export class EventsData {
  /**
   * @param forceRefresh skip a still valid cache entry; a failed request then
   *   throws a {@link RequestFailedError} instead of silently handing back the cached data
   */
  static async getEventsData(
    datetime_gte: Date,
    { forceRefresh = false } = {},
  ): Promise<GDQEventData[]> {
    datetime_gte.setHours(0, 0, 0, 0);
    const key = "eventsDataV2-" + datetime_gte.toISOString();
    let cached: { expiration: number; data: GDQEventData[] } | null = null;
    try {
      cached = JSON.parse(localStorage.getItem(key) as string);
    } catch (e) {
      // ignore cache parse errors
    }
    if (!forceRefresh && cached && cached.expiration > Date.now()) {
      return cached.data;
    }

    const attempt: RequestAttempt = {
      url: EVENTS_URL,
      method: "GET",
      startedAt: new Date(),
      durationMs: 0,
      cacheEntry: {
        hadData: !!cached?.data,
        storedUntil: cached?.expiration ? new Date(cached.expiration) : undefined,
      },
    };
    let data: GDQEventData[];
    try {
      const response = await CapacitorHttp.get({
        url: EVENTS_URL,
        headers: {
          'User-Agent': `GDQReminderClient/${(await Version.getCurrent()).versionName}`
        },
        // without these, a stalled connection keeps the refresh spinner going forever
        connectTimeout: 15_000,
        readTimeout: 30_000,
      });
      attempt.status = response.status;
      attempt.responseHeaders = pickRelevantHeaders(response.headers);
      // CapacitorHttp resolves on HTTP errors, and bodies without a JSON
      // content-type (e.g. an upstream challenge page) arrive as a string
      const body = parseJsonBody(response.data) as { results?: unknown } | null;
      if (response.status !== 200 || !Array.isArray(body?.results)) {
        attempt.bodyExcerpt = excerpt(response.data);
        throw new Error(`Unexpected events response (HTTP ${response.status})`);
      }
      data = (body.results as GDQEventData[]).filter((event) => {
        return new Date(event.datetime) >= datetime_gte;
      });
    } catch (e) {
      // offline or tracker unavailable: fall back to stale data, if any
      if (cached && !forceRefresh) {
        return cached.data;
      }
      attempt.durationMs = Date.now() - attempt.startedAt.getTime();
      attempt.error = describeError(e);
      throw new RequestFailedError(`Loading events failed: ${attempt.error.message}`, attempt);
    }

    localStorage.setItem(
      key,
      JSON.stringify({ expiration: Date.now() + CACHE_TTL_MS, data }),
    );
    return data;
  }
}
