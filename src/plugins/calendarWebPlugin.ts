import { WebPlugin } from '@capacitor/core';

import type { CalendarPlugin, EventDetails, EventListResult, EventUpdateResult } from './calendarPlugin';

export class CalendarWeb extends WebPlugin implements CalendarPlugin {
    currentEvents : EventDetails[] = [];
    async getAllEvents(): Promise<EventListResult> {
        console.warn("No calendar implementation available on web, using local list");
        return { events: this.currentEvents, error: "" };
    }
    async upsertEvent(options: EventDetails): Promise<EventUpdateResult> {
        console.warn("No calendar implementation available on web, using local list");
        const existingEvent = this.currentEvents.find(e => e.sync_id === options.sync_id);
        if (existingEvent) {
            existingEvent.title = options.title;
            existingEvent.location = options.location;
            existingEvent.notes = options.notes;
            existingEvent.startDate = options.startDate;
            existingEvent.endDate = options.endDate;
        } else {
            this.currentEvents.push(options);
        }
        return {error: ""};
    }
    async removeEvent(options: { sync_id: string }): Promise<EventUpdateResult> {
        console.warn("No calendar implementation available on web, using local list");
        this.currentEvents = this.currentEvents.filter(e => e.sync_id !== options.sync_id);
        return {error: ""};
    }
}