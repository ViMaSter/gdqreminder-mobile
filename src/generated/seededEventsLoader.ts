import { seededEventsFallback, SeededEventsSnapshot } from "@/generated/seededEventsFallback";

// Resolve generated seed file when present, otherwise fall back to an empty snapshot.
const seededModules = import.meta.glob("./seededEvents.ts", {
  eager: true,
}) as Record<string, { seededEventsSnapshot?: SeededEventsSnapshot }>;

const firstModule = Object.values(seededModules)[0];

export const seededEventsSnapshot: SeededEventsSnapshot =
  firstModule?.seededEventsSnapshot ?? seededEventsFallback;
