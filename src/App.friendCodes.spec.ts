import { test, expect } from "@playwright/experimental-ct-vue";

test.use({ viewport: { width: 360, height: 800 } });

test("adding and removing friend code with pre-existing runs toggles friend indicators", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(page.url());

  await page.waitForSelector('mwc-top-app-bar-fixed [slot="title"]');

  await page.click('mwc-top-app-bar-fixed [slot="navigationIcon"]');

  await page.waitForSelector(".mdc-drawer");

  await page.click('md-list md-list-item:has-text("AGDQ2025")');

  await page.waitForSelector(".day-divider");
  
  const threeAGDQ2025RunId = "59447256-69364948-37585178-50563968-306c634d-53464e70-78666532";

  await page.click('[data-test="open-friend-menu"]');

  await expect(page.locator(".with-friend")).toHaveCount(0);

  await page.fill('md-filled-field[label="Enter friend code"] input', threeAGDQ2025RunId);
  
  await page.click('md-text-button[value="apply"]');

  await expect(page.locator(".with-friend")).not.toHaveCount(0, {
    timeout: 5000,
  });
});

test("adding your own friend code means clock and friend indicator are shown", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(page.url() + "#date=2025-01-04%2000:00:00");

  await page.waitForSelector('mwc-top-app-bar-fixed [slot="title"]');

  await page.waitForSelector(".day-divider");

  await page.click(".run .runName", { timeout: 5000 });
  await expect(page.locator(".is-set")).toHaveCount(1);
  await expect(page.locator(".with-friend")).toHaveCount(0);

  await page.click('[data-test="open-friend-menu"]');
  await page.click('md-dialog md-icon-button');

  const friendCode = await page.evaluate(() => navigator.clipboard.readText());

  await page.fill('md-filled-field[label="Enter friend code"] input', friendCode);
  await page.click('md-text-button[value="apply"]');

  await expect(page.locator(".is-set")).toHaveCount(1);
  await expect(page.locator(".with-friend")).toHaveCount(1);

  await page.click(".run .runName", { timeout: 5000 });
  await expect(page.locator(".is-set")).toHaveCount(0);
  await expect(page.locator(".with-friend")).toHaveCount(0);

  await page.click(".run .runName", { timeout: 5000 });
  await expect(page.locator(".is-set")).toHaveCount(1); 
  await expect(page.locator(".with-friend")).toHaveCount(1);
});