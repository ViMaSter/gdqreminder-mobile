import { GDQEventData } from "@/interfaces/GDQEvent";
import { GDQRunData } from "@/interfaces/GDQRun";

export type SeededEventsSnapshot = {
  generatedAt: string;
  events: GDQEventData[];
  runsByEventID: Record<string, GDQRunData[]>;
};

export const seededEventsFallback: SeededEventsSnapshot = {
  generatedAt: "1970-01-01T00:00:00.000Z",
  events: [],
  runsByEventID: {},
};
