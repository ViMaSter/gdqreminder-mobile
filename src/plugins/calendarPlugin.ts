import { registerPlugin } from '@capacitor/core';

export interface Result {
    error: string;
}

export interface EventListResult extends Result {
    events: EventDetails[];
}

export interface EventUpdateResult extends Result {
}

export interface EventDetails {
    sync_id: string;
    title: string;
    location: string;
    notes: string;
    startDate: Date;
    endDate: Date;
}

export interface CalendarPlugin {
    getAllEvents(): Promise<EventListResult>;
    upsertEvent(options: EventDetails): Promise<EventUpdateResult>;
    removeEvent(options: { sync_id: string }): Promise<EventUpdateResult>;
}

const Calendar = registerPlugin<CalendarPlugin>('Calendar', {
    web: () => import('./calendarWebPlugin').then(m => new m.CalendarWeb())
});

export default Calendar;