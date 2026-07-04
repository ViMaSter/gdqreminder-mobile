import { GDQEventData } from "@/interfaces/GDQEvent";
import { GDQRunData } from "@/interfaces/GDQRun";

type EventWithRuns = {
  event: GDQEventData;
  runs: GDQRunData[];
};

type EventTimeWindow = {
  event: GDQEventData;
  start: number;
  end: number;
};

const toTimestamp = (time: string): number | null => {
  const timestamp = new Date(time).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return timestamp;
};

const toEventWindow = ({ event, runs }: EventWithRuns): EventTimeWindow | null => {
  if (runs.length <= 0) {
    return null;
  }

  const sortedRuns = [...runs].sort(
    (a, b) =>
      new Date(a.starttime).getTime() -
      new Date(b.starttime).getTime(),
  );

  const firstRunStart = toTimestamp(sortedRuns[0].starttime);
  const lastRunEnd = toTimestamp(sortedRuns[sortedRuns.length - 1].endtime);
  if (firstRunStart == null || lastRunEnd == null) {
    return null;
  }

  return {
    event,
    start: firstRunStart,
    end: lastRunEnd,
  };
};

export const selectDefaultEvent = (
  eventsWithRuns: EventWithRuns[],
  now: Date,
): GDQEventData | null => {
  const currentTime = now.getTime();
  const windows = eventsWithRuns
    .map(toEventWindow)
    .filter((window): window is EventTimeWindow => window != null);

  const runningEvents = windows
    .filter(({ start, end }) => start <= currentTime && currentTime <= end)
    .sort((a, b) => b.start - a.start);
  if (runningEvents.length > 0) {
    return runningEvents[0].event;
  }

  const upcomingEvents = windows
    .filter(({ start }) => currentTime < start)
    .sort((a, b) => a.start - b.start);
  if (upcomingEvents.length > 0) {
    return upcomingEvents[0].event;
  }

  const pastEvents = windows
    .filter(({ end }) => end < currentTime)
    .sort((a, b) => b.end - a.end);
  if (pastEvents.length > 0) {
    return pastEvents[0].event;
  }

  return null;
};

export type { EventWithRuns };