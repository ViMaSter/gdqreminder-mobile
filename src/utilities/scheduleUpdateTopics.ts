import type { EventWithRuns } from "./eventSelection";

/**
 * Lowercase shorts of all events that haven't ended yet and contain at least
 * one run the user has a reminder for; only those receive "new run added" pushes.
 *
 * Previously followed events missing from `eventsWithRuns` (e.g. their runs
 * failed to load) are kept, so a flaky connection never drops a subscription.
 */
export const eventShortsToFollow = (
  eventsWithRuns: EventWithRuns[],
  reminderPKs: string[],
  now: Date,
  previouslyFollowed: string[] = [],
): string[] => {
  const reminders = new Set(reminderPKs);
  const currentTime = now.getTime();
  const knownShorts = new Set(eventsWithRuns.map(({ event }) => event.short.toLowerCase()));

  const shorts = eventsWithRuns
    .filter(({ runs }) =>
      runs.some((run) => new Date(run.endtime).getTime() > currentTime),
    )
    .filter(({ runs }) => runs.some((run) => reminders.has(run.id.toString())))
    .map(({ event }) => event.short.toLowerCase());
  const unknownShorts = previouslyFollowed.filter((short) => !knownShorts.has(short));

  return [...new Set([...shorts, ...unknownShorts])].sort();
};

export const topicDiff = (current: string[], desired: string[]) => ({
  toSubscribe: desired.filter((short) => !current.includes(short)),
  toUnsubscribe: current.filter((short) => !desired.includes(short)),
});
