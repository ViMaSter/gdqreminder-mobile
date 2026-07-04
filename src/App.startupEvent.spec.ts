import { test, expect } from "./test-utils/ct";

test.use({ viewport: { width: 360, height: 800 } });

const timings = [
  [
    "after AGDQ2024, defaults to the closest upcoming event",
    "2024-03-15%2000:00:00",
    "SGDQ",
  ],
  [
    "during AGDQ2024, shows current runs, can show upcoming event",
    "2024-01-15%2000:00:00",
    "AGDQ",
  ],
  [
    "during SGDQ2026 with GamescomDQ upcoming, defaults to SGDQ",
    "2026-07-04%2000:00:00",
    "SGDQ",
  ],
  [
    "after SGDQ2026 ends with GamescomDQ upcoming, defaults to GamescomDQ",
    "2026-07-20%2000:00:00",
    "GAMESCOMGDQ",
  ],
];

timings.forEach(([testName, date, title]) => {
  test(testName, async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto(page.url() + "#date=" + date);
    await page.evaluate(() => {
      location.reload();
    });

    await page.waitForSelector('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="title"]');
    await expect(
      page.locator('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="title"]'),
    ).toHaveText(new RegExp(title));

    await page.click('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="navigationIcon"]');

    await page.waitForSelector(".mdc-drawer");
    await page.waitForSelector("md-list-item.rotating");
    await expect(page.locator("md-list-item.rotating")).toHaveCount(0, {
      timeout: 40000,
    });

    await page.click("md-list md-list-item");

    await page.waitForSelector(".day-divider");
    await expect(page.locator(".dayNumber").first()).toHaveText(/\d+/);

    await page.waitForSelector(".run");
    await expect(page.locator(".run .runName").first()).toHaveText(/\w+/);
  });
});
