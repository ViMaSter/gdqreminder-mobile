import { test, expect } from "../test-utils/ct";
import type { GDQEventData } from "@/interfaces/GDQEvent";
import type { GDQRunData } from "@/interfaces/GDQRun";
import { eventShortsToFollow, topicDiff } from "./scheduleUpdateTopics";

const event = (id: number, short: string): GDQEventData => ({
  id,
  short,
  datetime: "2027-01-03T16:30:00Z",
});
const run = (id: number, starttime: string, endtime: string) =>
  ({ id, starttime, endtime }) as GDQRunData;

const now = new Date("2027-01-05T12:00:00Z");

const pastEvent = {
  event: event(1, "SGDQ2026"),
  runs: [run(10, "2026-07-05T16:30:00Z", "2026-07-05T18:00:00Z")],
};
const runningEvent = {
  event: event(2, "AGDQ2027"),
  runs: [
    run(20, "2027-01-03T16:30:00Z", "2027-01-03T18:00:00Z"),
    run(21, "2027-01-09T16:30:00Z", "2027-01-09T18:00:00Z"),
  ],
};
const upcomingEvent = {
  event: event(3, "gdqx2027"),
  runs: [run(30, "2027-03-01T16:30:00Z", "2027-03-01T18:00:00Z")],
};
const events = [pastEvent, runningEvent, upcomingEvent];

test("follows running and upcoming events with at least one reminder, lowercased", async () => {
  expect(eventShortsToFollow(events, ["10", "20", "30"], now)).toEqual([
    "agdq2027",
    "gdqx2027",
  ]);
});

test("a reminder for an already finished run still counts while its event is running", async () => {
  expect(eventShortsToFollow(events, ["20"], now)).toEqual(["agdq2027"]);
});

test("ignores ended events and events without reminders", async () => {
  expect(eventShortsToFollow(events, ["10"], now)).toEqual([]);
  expect(eventShortsToFollow(events, [], now)).toEqual([]);
  expect(eventShortsToFollow(events, ["999"], now)).toEqual([]);
});

test("keeps previously followed events whose runs aren't loaded, but drops known ones that no longer qualify", async () => {
  expect(
    eventShortsToFollow([pastEvent, runningEvent], ["20"], now, ["gdqx2027", "sgdq2026"]),
  ).toEqual(["agdq2027", "gdqx2027"]);
});

test("diffs subscribed and desired topics", async () => {
  expect(topicDiff(["agdq2027", "sgdq2026"], ["agdq2027", "gdqx2027"])).toEqual({
    toSubscribe: ["gdqx2027"],
    toUnsubscribe: ["sgdq2026"],
  });
  expect(topicDiff([], [])).toEqual({ toSubscribe: [], toUnsubscribe: [] });
});
