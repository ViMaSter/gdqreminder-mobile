import { EventDetails, EventListResult, EventUpdateResult } from "./calendarPlugin";

export interface CalendarPlugin {
    upsertEvent(options: EventDetails): Promise<EventUpdateResult>;
    cleanupEvents(options: { sync_ids: string[] }): Promise<EventUpdateResult>;
}