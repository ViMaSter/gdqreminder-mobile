import { WebPlugin } from '@capacitor/core';

import type { CalendarPlugin } from './calendarPlugin';

export class CalendarWeb extends WebPlugin implements CalendarPlugin {
    // create stubs
    async getAllEvents(): Promise<any> {
        return { events: [
            {
                title: "Event 1",
                location: "Location 1",
                notes: "Notes 1",
                startDate: "2024-05-31T00:00:00Z",
                endDate: "2024-05-31T01:00:00Z"
            },
            {
                title: "Event 2",
                location: "Location 2",
                notes: "Notes 2",
                startDate: "2024-06-01T00:00:00Z",
                endDate: "2024-06-01T01:00:00Z"
            }
        ] };
    }
    async createEvent(options: any): Promise<any> {
        const isTomorrow = options.startDate.startsWith("2024-06-01");
        return { success: isTomorrow };
    }
}