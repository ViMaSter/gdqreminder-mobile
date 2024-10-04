import { test, expect } from "@playwright/experimental-ct-vue";

test.use({ viewport: { width: 360, height: 800 } });

const timings = [
  [
    "after AGDQ2024, shows no runs, can show upcoming event",
    "2024-03-15%2000:00:00",
    "WEB",
  ],
  [
    "during AGDQ2024, shows current runs, can show upcoming event",
    "2024-01-15%2000:00:00",
    "AGDQ",
  ],
];

timings.forEach(([testName, date, title]) => {
  test(testName, async ({ page }) => {
    await page.goto(page.url() + "#date=" + date);
    await page.evaluate(() => {
      location.reload();
    });

    await page.waitForSelector('mwc-top-app-bar-fixed [slot="title"]');
    await expect(
      page.locator('mwc-top-app-bar-fixed [slot="title"]'),
    ).toHaveText(new RegExp(title));

    await page.click('mwc-top-app-bar-fixed [slot="navigationIcon"]');

    await page.waitForSelector(".mdc-drawer");
    await page.waitForSelector("md-list-item.rotating");
    await expect(page.locator("md-list-item.rotating")).toHaveCount(0, {
      timeout: 20000,
    });

    await page.click("md-list md-list-item");

    await page.waitForSelector(".day-divider");
    await expect(page.locator(".dayNumber").first()).toHaveText(/\d+/);

    await page.waitForSelector(".run");
    await expect(page.locator(".run .runName").first()).toHaveText(/\w+/);
  });
});
