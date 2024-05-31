import { registerPlugin } from '@capacitor/core';

export interface EventList {
    events: EventDetails[];
}

export interface EventCreationResult {
    success: boolean;
}

export interface EventDetails {
    title: string;
    location: string;
    notes: string;
    startDate: Date;
    endDate: Date;
}

export interface CalendarPlugin {
    getAllEvents(): Promise<EventList>;
    createEvent(options: EventDetails): Promise<EventCreationResult>;
}

const Calendar = registerPlugin<CalendarPlugin>('Calendar', {
    web: () => import('./calendarWebPlugin').then(m => new m.CalendarWeb())
});

export default Calendar;