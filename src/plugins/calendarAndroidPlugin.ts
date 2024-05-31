import { EventDetails, EventListResult, EventUpdateResult } from "./calendarPlugin";

export interface CalendarPlugin {
    getAllEvents(): Promise<EventListResult>;
    upsertEvent(options: EventDetails): Promise<EventUpdateResult>;
    removeEvent(options: { sync_id: string }): Promise<EventUpdateResult>;
}