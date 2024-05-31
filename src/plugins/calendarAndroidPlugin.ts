export interface EventDetails {
    title: string;
    location: string;
    notes: string;
    startDate: Date;
    endDate: Date;
}

export interface CalendarPlugin {
    getAllEvents(): Promise<{ events: EventDetails[] }>;
    createEvent(options: EventDetails): Promise<boolean>;
}