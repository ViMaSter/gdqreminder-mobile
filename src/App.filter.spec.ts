import { test, expect } from "./test-utils/ct";

test.use({ viewport: { width: 360, height: 800 } });

const friendCodeWithRuns = "59447256-69364948-37585178-50563968-306c634d-53464e70-78666532";

const normalizeTexts = (texts: string[]) =>
  texts.map((text) => text.replace(/\s+/g, " ").trim()).filter(Boolean);

const getVisibleRunNames = async (page: Parameters<typeof test>[0]["page"]) =>
  normalizeTexts(await page.locator(".run .runName").allTextContents());

const clickFilter = async (page: Parameters<typeof test>[0]["page"]) => {
  await page
    .locator('mwc-top-app-bar-fixed[data-test-selector="main"] md-icon-button:has(md-icon:has-text("filter_list"))')
    .click();
};

const applyFriendCode = async (
  page: Parameters<typeof test>[0]["page"],
  friendCode: string,
) => {
  await page.click('[data-test="open-friend-menu"]');
  await page.fill('md-filled-field[label="Enter friend code"] input', friendCode);
  await page.click('md-text-button[value="apply"]');
};

const gotoStableRunsList = async (page: Parameters<typeof test>[0]["page"]) => {
  await page.goto(page.url() + "#date=2025-01-04%2000:00:00");
  await page.evaluate(() => {
    location.reload();
  });
  await page.waitForSelector('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="title"]');
  await page.waitForSelector(".run .runName");
};

const switchToEvent = async (
  page: Parameters<typeof test>[0]["page"],
  eventTitle: string,
) => {
  await page.click('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="navigationIcon"]');
  await page.waitForSelector(".mdc-drawer");
  await page.click(`md-list md-list-item:has-text("${eventTitle}")`);
  await page.waitForSelector(".day-divider");
};

test.describe("filtering", () => {
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