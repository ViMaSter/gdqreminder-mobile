import { test, expect } from "./test-utils/ct";
import type { Page } from "playwright/test";

test.use({ viewport: { width: 360, height: 800 } });

const friendCodeWithRuns = "59447256-69364948-37585178-50563968-306c634d-53464e70-78666532";

const normalizeTexts = (texts: string[]) =>
  texts.map((text) => text.replace(/\s+/g, " ").trim()).filter(Boolean);

const getVisibleRunNames = async (page: Page) =>
  normalizeTexts(await page.locator(".run .runName").allTextContents());

const clickFilter = async (page: Page) => {
  await page
    .locator('mwc-top-app-bar-fixed[data-test-selector="main"] md-icon-button:has(md-icon:has-text("filter_list"))')
    .click();
};

const clickSearchToggle = async (page: Page, icon: "search" | "close") => {
  await page
    .locator(`mwc-top-app-bar-fixed[data-test-selector="main"] md-icon-button:has(md-icon:has-text("${icon}"))`)
    .click();
};

const applyFriendCode = async (
  page: Page,
  friendCode: string,
) => {
  await page.click('[data-test="open-friend-menu"]');
  await page.fill('md-filled-field[label="Enter friend code"] input', friendCode);
  await page.click('md-text-button[value="apply"]');
};

const gotoStableRunsList = async (page: Page) => {
  await page.goto(page.url() + "#date=2025-01-04%2000:00:00");
  await page.evaluate(() => {
    location.reload();
  });
  await page.waitForSelector('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="title"]');
  await page.waitForSelector(".run .runName");
};

const switchToEvent = async (
  page: Page,
  eventTitle: string,
) => {
  await page.click('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="navigationIcon"]');
  await page.waitForSelector(".mdc-drawer");
  await page.click(`md-list md-list-item:has-text("${eventTitle}")`);
  await page.waitForSelector(".day-divider");
};

test.describe("filtering", () => {
  test("search close button clears text and unfocuses input", async ({ page }) => {
    test.setTimeout(60_000);

    await gotoStableRunsList(page);

    await clickSearchToggle(page, "search");

    const searchInput = page.locator('mwc-top-app-bar-fixed[data-test-selector="main"] input.searchInput');
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
      page.locator('mwc-top-app-bar-fixed[data-test-selector="main"] md-icon-button:has(md-icon:has-text("search"))'),
    ).toBeVisible();
    await expect(
      page.locator('mwc-top-app-bar-fixed[data-test-selector="main"] md-icon-button:has(md-icon:has-text("close"))'),
    ).toHaveCount(0);
  });

  test("filter label respects language setting", async ({ page }) => {
    test.setTimeout(60_000);

    await gotoStableRunsList(page);

    await page.click('[data-test="settings"]');
    await expect(page.locator(".gdq-settings mwc-top-app-bar-fixed")).toBeVisible();

    await page.locator("[data-test=open-language-dialog]").click();
    await expect(page.locator("[data-test=language-dialog]")).toBeVisible();
    await page.locator("[data-test=language-option-english]").click();
    await page.waitForSelector('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="title"]');

    await clickFilter(page);
    await expect(page.locator('[data-test="active-filter-label"]')).toHaveText("Your runs");

    await page.click('[data-test="settings"]');
    await expect(page.locator(".gdq-settings mwc-top-app-bar-fixed")).toBeVisible();

    await page.locator("[data-test=open-language-dialog]").click();
    await expect(page.locator("[data-test=language-dialog]")).toBeVisible();
    await page.locator("[data-test=language-option-german]").click();
    await page.waitForSelector('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="title"]');

    await clickFilter(page);
    await expect(page.locator('[data-test="active-filter-label"]')).toHaveText("Deine Runs");
  });

  test('searching "GAM" highlights run names and runner names in SGDQ2026', async ({ page }) => {
    test.setTimeout(60_000);

    await gotoStableRunsList(page);
    await switchToEvent(page, "SGDQ2026");

    await clickSearchToggle(page, "search");
    const searchInput = page.locator('mwc-top-app-bar-fixed[data-test-selector="main"] input.searchInput');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("GAM");

    const runDayOne = page.locator("#run-for-1783548000000");
    await expect(runDayOne).toBeVisible();
    await expect(runDayOne.locator(".run")).toHaveCount(2);

    const dayOneRunNames = normalizeTexts(await runDayOne.locator(".run .runName").allTextContents());
    expect(dayOneRunNames.some((name) => /BONUS GAME\s*[—-]\s*Wii Sports/i.test(name))).toBeTruthy();
    expect(dayOneRunNames).toContain("Zelda: The Wand of Gamelon");

    const bonusGameRun = runDayOne.locator(".run", {
      has: page.locator(".runName", { hasText: /BONUS GAME\s*[—-]\s*Wii Sports/i }),
    });
    const zeldaRun = runDayOne.locator(".run", {
      has: page.locator(".runName", { hasText: "Zelda: The Wand of Gamelon" }),
    });
    await expect(bonusGameRun).toHaveCount(1);
    await expect(zeldaRun).toHaveCount(1);

    const bonusMatchedRunParts = normalizeTexts(
      await bonusGameRun.locator(".runName .highlightPart.matched").allTextContents(),
    );
    expect(bonusMatchedRunParts.some((part) => part.toLowerCase() === "gam")).toBeTruthy();

    const zeldaMatchedRunParts = normalizeTexts(
      await zeldaRun.locator(".runName .highlightPart.matched").allTextContents(),
    );
    expect(zeldaMatchedRunParts.some((part) => part.toLowerCase() === "gam")).toBeTruthy();

    const runDayTwo = page.locator("#run-for-1783720800000");
    await expect(runDayTwo).toBeVisible();

    const run20xx = runDayTwo.locator(".run", {
      has: page.locator(".runName", { hasText: "20XX" }),
    });
    await expect(run20xx).toHaveCount(1);

    await expect(run20xx.locator(".runName .highlightPart.matched")).toHaveCount(0);
    const runnerMatchedParts = normalizeTexts(
      await run20xx.locator(".runnerName .highlightPart.matched").allTextContents(),
    );
    expect(runnerMatchedParts.some((part) => part.toLowerCase() === "gam")).toBeTruthy();
    await expect(run20xx.locator(".runnerName")).toContainText(/KatDevsGames/i);
  });

  test('searching "the legend" only underlines "the" and "leg" in game names', async ({ page }) => {
    test.setTimeout(60_000);

    await gotoStableRunsList(page);

    await clickSearchToggle(page, "search");
    const searchInput = page.locator('mwc-top-app-bar-fixed[data-test-selector="main"] input.searchInput');
    await expect(searchInput).toBeVisible();
    await searchInput.fill("");
    const query = "the legend";
    for (const char of query) {
      await searchInput.type(char);

      const legendRun = page.locator(".run", {
        has: page.locator(".runName", { hasText: "The Legend of Zelda: The Wind Waker" }),
      }).first();
      await expect(legendRun).toBeVisible();

      const matchedRunNameParts = normalizeTexts(
        await legendRun.locator(".runName .highlightPart.matched").allTextContents(),
      ).map((part) => part.toLowerCase());

      const hasFullThe = matchedRunNameParts.includes("the");
      const hasFullLegend = matchedRunNameParts.includes("legend");
      expect(hasFullThe && hasFullLegend).toBeFalsy();
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