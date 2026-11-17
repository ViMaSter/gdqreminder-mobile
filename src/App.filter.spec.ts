import { test, expect } from "./test-utils/ct";
import type { Page } from "playwright/test";

test.use({ viewport: { width: 360, height: 800 } });

const friendCodeWithRuns = "59447256-69364948-37585178-50563968-306c634d-53464e70-78666532";

const normalizeTexts = (texts: string[]) =>
  texts.map((text) => text.replace(/\s+/g, " ").trim()).filter(Boolean);

const getSearchTerm = (text: string, minimumLength = 4) => {
  const parts = text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= minimumLength);
  return parts[0] ?? null;
};

const getVisibleRunNames = async (page: Page) =>
  normalizeTexts(await page.locator(".run .runName").allTextContents());

const clickFilter = async (page: Page) => {
  await page.locator('[data-test="toggle-filter"]').click();
};

const clickSearchToggle = async (page: Page, icon: "search" | "close") => {
  await page.locator('[data-test="toggle-search"]').click();
};

const applyFriendCode = async (
  page: Page,
  friendCode: string,
) => {
  await page.click('[data-test="open-friend-menu"]');
  await page.fill('input[aria-label="Enter friend code"]', friendCode);
  await page.click('m3e-dialog[data-test="friend-dialog"] m3e-dialog-action[return-value="apply"]');
};

const gotoStableRunsList = async (page: Page) => {
  await page.goto(page.url() + "#date=2025-01-04%2000:00:00");
  await page.evaluate(() => {
    location.reload();
  });
  await page.waitForSelector('[data-test="main-title"]');
  await page.waitForSelector(".run .runName");
};

const switchToEvent = async (
  page: Page,
  eventTitle: string,
) => {
  await page.click('[data-test="toggle-drawer"]');
  await expect(page.locator('[data-test="event-item"]').first()).toBeVisible();
  await page.click(`[data-test="event-item"]:has-text("${eventTitle}")`);
  await page.waitForSelector(".day-divider");
};

test.describe("filtering", () => {
  test("search close button clears text and unfocuses input", async ({ page }) => {
    test.setTimeout(60_000);

    await gotoStableRunsList(page);

    await clickSearchToggle(page, "search");

    const searchInput = page.locator('m3e-app-bar[data-test-selector="main"] input.searchInput');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("zelda link");
    await expect(searchInput).toHaveValue("zelda link");

    await clickSearchToggle(page, "close");

    await expect(searchInput).toHaveCount(0);

    // Desired behavior: nothing remains focused after closing search.
    const activeElementTag = await page.evaluate(() => document.activeElement?.tagName ?? "");
    expect(activeElementTag).toBe("BODY");

    // Re-open search to verify the text was cleared.
    await clickSearchToggle(page, "search");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveValue("");

    // Intended behavior: clicking close while empty disables search and restores looking-glass icon.
    await clickSearchToggle(page, "close");
    await expect(searchInput).toHaveCount(0);
    await expect(
      page.locator('[data-test="toggle-search"]'),
    ).toBeVisible();
  });

  test("filter label respects language setting", async ({ page }) => {
    test.setTimeout(60_000);

    await gotoStableRunsList(page);

    await page.click('[data-test="settings"]');
    await expect(page.locator(".gdq-settings m3e-app-bar")).toBeVisible();

    await page.locator("[data-test=open-language-dialog]").click();
    await expect(page.locator("[data-test=language-dialog]")).toBeVisible();
    await page.locator("[data-test=language-option-english]").click();
    await page.waitForSelector('[data-test="main-title"]');

    await clickFilter(page);
    await expect(page.locator('[data-test="active-filter-label"]')).toHaveText("Your runs");

    await page.click('[data-test="settings"]');
    await expect(page.locator(".gdq-settings m3e-app-bar")).toBeVisible();

    await page.locator("[data-test=open-language-dialog]").click();
    await expect(page.locator("[data-test=language-dialog]")).toBeVisible();
    await page.locator("[data-test=language-option-german]").click();
    await page.waitForSelector('[data-test="main-title"]');

    await clickFilter(page);
    await expect(page.locator('[data-test="active-filter-label"]')).toHaveText("Deine Runs");
  });

  test("search highlights run names and runner names in SGDQ2026", async ({ page }) => {
    test.setTimeout(60_000);

    await gotoStableRunsList(page);
    await switchToEvent(page, "SGDQ2026");

    await clickSearchToggle(page, "search");
    const searchInput = page.locator('m3e-app-bar[data-test-selector="main"] input.searchInput');
    await expect(searchInput).toBeVisible();

    const runs = page.locator(".run");
    await expect(runs.first()).toBeVisible();

    const findRunNameMatchCandidate = async () => {
      const runCount = Math.min(await runs.count(), 50);
      for (let index = 0; index < runCount; index++) {
        const run = runs.nth(index);
        const runName = normalizeTexts(await run.locator(".runName").allTextContents())[0] ?? "";
        const term = getSearchTerm(runName, 4);
        if (term) {
          return { run, term };
        }
      }
      throw new Error("Could not find a run name with a searchable token.");
    };

    const findRunnerMatchCandidate = async () => {
      const runCount = Math.min(await runs.count(), 50);
      for (let index = 0; index < runCount; index++) {
        const run = runs.nth(index);
        const runnerText = normalizeTexts(await run.locator(".runnerName").allTextContents()).join(" ");
        const term = getSearchTerm(runnerText, 4);
        if (term) {
          return { run, term };
        }
      }
      throw new Error("Could not find a runner name with a searchable token.");
    };

    const runNameCandidate = await findRunNameMatchCandidate();
    await searchInput.fill(runNameCandidate.term);
    await expect.poll(async () => runNameCandidate.run.locator(".runName .highlightPart.matched").count()).toBeGreaterThan(0);
    const runMatchedParts = normalizeTexts(
      await runNameCandidate.run.locator(".runName .highlightPart.matched").allTextContents(),
    ).map((part) => part.toLowerCase());
    expect(runMatchedParts.some((part) => part.includes(runNameCandidate.term))).toBeTruthy();

    const runnerCandidate = await findRunnerMatchCandidate();
    await searchInput.fill(runnerCandidate.term);
    await expect.poll(async () => runnerCandidate.run.locator(".runnerName .highlightPart.matched").count()).toBeGreaterThan(0);
    const runnerMatchedParts = normalizeTexts(
      await runnerCandidate.run.locator(".runnerName .highlightPart.matched").allTextContents(),
    ).map((part) => part.toLowerCase());
    expect(runnerMatchedParts.some((part) => part.includes(runnerCandidate.term))).toBeTruthy();
  });

  test('searching "the legend" updates run-name highlights while typing and deleting', async ({ page }) => {
    test.setTimeout(60_000);

    await gotoStableRunsList(page);

    await clickSearchToggle(page, "search");
    const searchInput = page.locator('m3e-app-bar[data-test-selector="main"] input.searchInput');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("");

    const legendRun = page.locator(".run", {
      has: page.locator(".runName", { hasText: "The Legend of Zelda: The Wind Waker" }),
    }).first();
    await expect(legendRun).toBeVisible();

    const parseTerms = (queryValue: string) => {
      const matches = queryValue.match(/"([^"]+)"|(\S+)/g) ?? [];
      return matches
        .map((part) => part.replace(/^"|"$/g, "").trim().toLowerCase())
        .filter((part) => part.length > 0);
    };

    const assertLegendRunHighlightsFollowQuery = async (queryValue: string) => {
      const activeTerms = parseTerms(queryValue);
      const matchedRunNameParts = normalizeTexts(
        await legendRun.locator(".runName .highlightPart.matched").allTextContents(),
      ).map((part) => part.toLowerCase());

      if (activeTerms.length === 0) {
        expect(matchedRunNameParts).toHaveLength(0);
        return;
      }

      for (const term of activeTerms) {
        expect(matchedRunNameParts.some((part) => part.includes(term))).toBeTruthy();
      }
    };

    const query = "the legend";
    let currentQuery = "";
    for (const char of query) {
      await searchInput.type(char);
      currentQuery += char;
      await assertLegendRunHighlightsFollowQuery(currentQuery);
    }

    while (currentQuery.length > 0) {
      await searchInput.press("Backspace");
      currentQuery = currentQuery.slice(0, -1);
      await assertLegendRunHighlightsFollowQuery(currentQuery);
    }
  });

  test.describe("with no runs enabled", () => {
    test("toggles between empty and full list", async ({ page }) => {
      test.setTimeout(60_000);

      await gotoStableRunsList(page);

      const fullCount = await page.locator(".run").count();
      expect(fullCount).toBeGreaterThan(0);

      await clickFilter(page);
      await expect(page.locator(".run")).toHaveCount(0);

      await clickFilter(page);
      await expect(page.locator(".run")).toHaveCount(fullCount);
    });

    test("with friend code cycles friend list, empty list, and full list", async ({ page }) => {
      test.setTimeout(60_000);

      await gotoStableRunsList(page);
      await switchToEvent(page, "AGDQ2025");
      await applyFriendCode(page, friendCodeWithRuns);

      await expect(page.locator(".with-friend")).not.toHaveCount(0, {
        timeout: 5_000,
      });

      const fullCount = await page.locator(".run").count();
      expect(fullCount).toBeGreaterThan(0);

      await clickFilter(page);
      const friendsFilteredCount = await page.locator(".run").count();
      expect(friendsFilteredCount).toBeGreaterThan(0);
      await expect(page.locator(".run")).toHaveCount(await page.locator(".run .with-friend").count());

      await clickFilter(page);
      await expect(page.locator(".run")).toHaveCount(0);

      await clickFilter(page);
      await expect(page.locator(".run")).toHaveCount(fullCount);
    });
  });

  test.describe("with runs enabled", () => {
    test("toggles between own list and full list", async ({ page }) => {
      test.setTimeout(60_000);

      await gotoStableRunsList(page);

      await page.click(".run .runName", { timeout: 5_000 });
      await expect(page.locator(".is-set")).toHaveCount(1);

      const fullCount = await page.locator(".run").count();
      expect(fullCount).toBeGreaterThan(0);

      await clickFilter(page);
      const alarmCount = await page.locator(".run .is-set").count();
      expect(alarmCount).toBeGreaterThan(0);
      await expect(page.locator(".run")).toHaveCount(alarmCount);

      await clickFilter(page);
      await expect(page.locator(".run")).toHaveCount(fullCount);
    });

    test("with friend code keeps friend list and alarm list runs in correct filter states", async ({ page }) => {
      test.setTimeout(60_000);

      await gotoStableRunsList(page);
      await switchToEvent(page, "AGDQ2025");
      await applyFriendCode(page, friendCodeWithRuns);

      await expect(page.locator(".with-friend")).not.toHaveCount(0, {
        timeout: 5_000,
      });

      const friendOnlyRun = page
        .locator(".run", {
          has: page.locator(".reminder.with-friend:not(.is-set)"),
        })
        .first();
      await expect(friendOnlyRun).toBeVisible();
      const friendOnlyRunName = (await friendOnlyRun.locator(".runName").textContent())?.trim() ?? "";
      expect(friendOnlyRunName).not.toBe("");

      const ownOnlyRun = page
        .locator(".run:not(.is-over)", {
          has: page.locator(".reminder:not(.with-friend):not(.is-set)"),
        })
        .last();
      await expect(ownOnlyRun).toBeVisible();
      const ownOnlyRunName = (await ownOnlyRun.locator(".runName").textContent())?.trim() ?? "";
      expect(ownOnlyRunName).not.toBe("");

      const alarmCountBefore = await page.locator(".is-set").count();
      await ownOnlyRun.locator(".runName").click();
      await expect(page.locator(".is-set")).toHaveCount(alarmCountBefore + 1);

      const ownOnlyRunAfterToggle = page
        .locator(".run", {
          has: page.locator(".runName", { hasText: ownOnlyRunName }),
        })
        .first();
      await expect(ownOnlyRunAfterToggle.locator(".reminder.is-set")).toBeVisible();
      await expect(ownOnlyRunAfterToggle.locator(".reminder.with-friend")).toHaveCount(0);

      const fullNames = await getVisibleRunNames(page);
      expect(fullNames).toContain(friendOnlyRunName);
      expect(fullNames).toContain(ownOnlyRunName);

      await clickFilter(page);
      const friendAndOwnNames = await getVisibleRunNames(page);
      expect(friendAndOwnNames).toContain(friendOnlyRunName);
      expect(friendAndOwnNames).toContain(ownOnlyRunName);

      await clickFilter(page);
      const ownOnlyNames = await getVisibleRunNames(page);
      expect(ownOnlyNames).toContain(ownOnlyRunName);
      expect(ownOnlyNames).not.toContain(friendOnlyRunName);

      await clickFilter(page);
      const backToFullNames = await getVisibleRunNames(page);
      expect(backToFullNames).toContain(friendOnlyRunName);
      expect(backToFullNames).toContain(ownOnlyRunName);
    });
  });
});