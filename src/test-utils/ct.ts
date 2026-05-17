import { expect, test as base } from "@playwright/experimental-ct-vue";
import { writeFile } from "node:fs/promises";

type ConsoleArgLike = {
  jsonValue: () => Promise<unknown>;
  toString: () => string;
};

type ConsoleMessageLike = {
  args: () => ConsoleArgLike[];
  text: () => string;
  type: () => string;
};

type ErrorLike = {
  message: string;
  stack?: string;
};

type RequestLike = {
  method: () => string;
  url: () => string;
  failure: () => { errorText?: string } | null;
};

const formatTimestamp = () => new Date().toISOString();

const pushConsoleLine = async (entries: string[], msg: ConsoleMessageLike) => {
  const values = await Promise.all(
    msg.args().map(async (arg) => {
      try {
        return JSON.stringify(await arg.jsonValue());
      } catch {
        return arg.toString();
      }
    }),
  );

  const fallbackText = msg.text();
  const renderedValues = values.filter(Boolean).join(" ").trim();
  const suffix = renderedValues.length > 0 ? renderedValues : fallbackText;
  entries.push(`[${formatTimestamp()}] [browser:${msg.type()}] ${suffix}`);
};

const pushPageErrorLine = (entries: string[], error: ErrorLike) => {
  const stack = error.stack ? `\n${error.stack}` : "";
  entries.push(`[${formatTimestamp()}] [pageerror] ${error.message}${stack}`);
};

const pushRequestFailedLine = (entries: string[], request: RequestLike) => {
  const failureText = request.failure()?.errorText ?? "unknown";
  entries.push(
    `[${formatTimestamp()}] [requestfailed] ${request.method()} ${request.url()} (${failureText})`,
  );
};

const attachIfAny = async (
  testInfo: {
    attach: (name: string, options: { body: Buffer; contentType: string }) => Promise<void>;
    outputPath: (pathSegment: string) => string;
  },
  name: string,
  entries: string[],
) => {
  const body = entries.length > 0 ? entries.join("\n") : "[no entries captured]";
  const outputFile = testInfo.outputPath(name);
  await writeFile(outputFile, body, "utf8");

  await testInfo.attach(name, {
    body: Buffer.from(body, "utf8"),
    contentType: "text/plain",
  });
};

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const browserConsoleEntries: string[] = [];
    const pageErrorEntries: string[] = [];
    const failedRequestEntries: string[] = [];
    const pendingConsoleParses: Promise<void>[] = [];

    const onConsole = (msg: ConsoleMessageLike) => {
      pendingConsoleParses.push(pushConsoleLine(browserConsoleEntries, msg));
    };
    const onPageError = (error: ErrorLike) => {
      pushPageErrorLine(pageErrorEntries, error);
    };
    const onRequestFailed = (request: RequestLike) => {
      pushRequestFailedLine(failedRequestEntries, request);
    };

    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    page.on("requestfailed", onRequestFailed);

    await use(page);

    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("requestfailed", onRequestFailed);

    if (pendingConsoleParses.length > 0) {
      await Promise.allSettled(pendingConsoleParses);
    }

    await attachIfAny(testInfo, "browser-console.log", browserConsoleEntries);
    await attachIfAny(testInfo, "page-errors.log", pageErrorEntries);
    await attachIfAny(testInfo, "request-failures.log", failedRequestEntries);
  },
});

export { expect };