import { WebPlugin } from "@capacitor/core";

import type {
  CalendarPlugin,
  EventDetails,
  EventUpdateResult,
} from "./calendarPlugin";

export class CalendarWeb extends WebPlugin implements CalendarPlugin {
  currentEvents: EventDetails[] = [];
  async upsertEvent(options: EventDetails): Promise<EventUpdateResult> {
    console.warn(
      "No calendar implementation available on web, using local list",
    );
    const existingEvent = this.currentEvents.find(
      (e) => e.sync_id === options.sync_id,
    );
    if (existingEvent) {
      existingEvent.title = options.title;
      existingEvent.location = options.location;
      existingEvent.notes = options.notes;
      existingEvent.startDate = options.startDate;
      existingEvent.endDate = options.endDate;
    } else {
      this.currentEvents.push(options);
    }
    return { error: "" };
  }
  async cleanupEvents(options: {
    sync_ids: string[];
  }): Promise<EventUpdateResult> {
    console.warn(
      "No calendar implementation available on web, using local list",
    );
    this.currentEvents = this.currentEvents.filter(
      (e) => !options.sync_ids.includes(e.sync_id),
    );
    return { error: "" };
  }
}
