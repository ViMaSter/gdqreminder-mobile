import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
import Version from "@/plugins/versionPlugin";

/** What happened during a single failed request, captured where it was made. */
export interface RequestAttempt {
  url: string;
  method: string;
  startedAt: Date;
  durationMs: number;
  status?: number;
  responseHeaders?: Record<string, string>;
  bodyExcerpt?: string;
  error?: { name: string; message: string };
  cacheEntry?: { storedUntil?: Date; hadData: boolean };
}

export class RequestFailedError extends Error {
  constructor(
    message: string,
    public readonly attempt: RequestAttempt,
  ) {
    super(message);
    this.name = "RequestFailedError";
  }
}

// headers that help tell apart device, proxy and tracker problems; nothing user specific
const RELEVANT_HEADERS = ["content-type", "content-length", "server", "x-cache-status", "cf-ray", "cf-cache-status", "date"];

export const pickRelevantHeaders = (headers: Record<string, string> | undefined) => {
  if (!headers) {
    return undefined;
  }
  const picked: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    if (RELEVANT_HEADERS.includes(name.toLowerCase())) {
      picked[name.toLowerCase()] = value;
    }
  }
  return picked;
};

export const excerpt = (data: unknown, maxLength = 500) => {
  if (data === undefined || data === null) {
    return undefined;
  }
  const text = typeof data === "string" ? data : JSON.stringify(data);
  return text.length > maxLength ? `${text.slice(0, maxLength)}… (${text.length} chars)` : text;
};

/**
 * CapacitorHttp only parses the body when the response is labelled as JSON;
 * a proxy or CDN that drops or rewrites the content-type hands us the raw string.
 */
export const parseJsonBody = (data: unknown): unknown => {
  if (typeof data !== "string") {
    return data;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
};

export const describeError = (e: unknown) =>
  e instanceof Error
    ? { name: e.name, message: e.message }
    : { name: typeof e, message: String(e) };

interface NetworkInformationLike {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

const collectEnvironment = async () => {
  const lines: [string, string][] = [];
  const add = (label: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== "") {
      lines.push([label, String(value)]);
    }
  };

  try {
    const version = await Version.getCurrent();
    add("App version", `${version.versionName} (${version.versionCode})`);
  } catch (e) {
    add("App version", `unavailable (${describeError(e).message})`);
  }
  add("Platform", Capacitor.getPlatform());
  add("HTTP client", Capacitor.isNativePlatform() ? "CapacitorHttp (native)" : "CapacitorHttp (web fetch)");

  try {
    const info = await Device.getInfo();
    add("Device", `${info.manufacturer} ${info.model}`);
    add("OS", `${info.operatingSystem} ${info.osVersion}${info.androidSDKVersion ? ` (API ${info.androidSDKVersion})` : ""}`);
    add("WebView", info.webViewVersion);
  } catch (e) {
    add("Device", `unavailable (${describeError(e).message})`);
  }

  add("Online (browser)", navigator.onLine ? "yes" : "no");
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (connection) {
    add("Connection type", connection.type ?? "unknown");
    add("Effective type", connection.effectiveType);
    add("Downlink", connection.downlink !== undefined ? `${connection.downlink} Mbit/s` : undefined);
    add("RTT", connection.rtt !== undefined ? `${connection.rtt} ms` : undefined);
    add("Data saver", connection.saveData ? "on" : undefined);
  } else {
    add("Connection type", "not reported by this WebView");
  }

  add("Device clock", new Date().toISOString());
  add("Time zone", Intl.DateTimeFormat().resolvedOptions().timeZone);
  add("Language", navigator.language);
  return lines;
};

const table = (rows: [string, string][]) =>
  ["| | |", "|---|---|", ...rows.map(([k, v]) => `| ${k} | ${v.replace(/\|/g, "\\|").replace(/\n/g, " ")} |`)].join("\n");

const fence = (text: string) => {
  // a longer fence than any backtick run inside keeps the block intact
  const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const ticks = "`".repeat(Math.max(3, longestRun + 1));
  return `${ticks}\n${text}\n${ticks}`;
};

/** A markdown report of a failed request plus the environment, meant to be pasted into a chat or issue. */
export const buildDiagnosticsReport = async (title: string, error: unknown) => {
  const attempt = error instanceof RequestFailedError ? error.attempt : undefined;
  const requestRows: [string, string][] = [];
  if (attempt) {
    requestRows.push(["URL", `${attempt.method} ${attempt.url}`]);
    requestRows.push(["Started", attempt.startedAt.toISOString()]);
    requestRows.push(["Duration", `${attempt.durationMs} ms`]);
    requestRows.push(["HTTP status", attempt.status !== undefined ? String(attempt.status) : "no response"]);
    if (attempt.cacheEntry) {
      requestRows.push([
        "Local cache",
        attempt.cacheEntry.hadData
          ? `present${attempt.cacheEntry.storedUntil ? `, valid until ${attempt.cacheEntry.storedUntil.toISOString()}` : ""}`
          : "empty",
      ]);
    }
  }
  const failure = attempt?.error ?? describeError(error);
  requestRows.push(["Error", `${failure.name}: ${failure.message}`]);

  const sections = [
    `### ${title}`,
    "",
    "**Request**",
    "",
    table(requestRows),
  ];
  if (attempt?.responseHeaders && Object.keys(attempt.responseHeaders).length > 0) {
    sections.push("", "**Response headers**", "", table(Object.entries(attempt.responseHeaders)));
  }
  if (attempt?.bodyExcerpt) {
    sections.push("", "**Response body (excerpt)**", "", fence(attempt.bodyExcerpt));
  }
  sections.push("", "**Environment**", "", table(await collectEnvironment()));
  return sections.join("\n");
};
