import { test, expect } from "./test-utils/ct";

test.use({ viewport: { width: 360, height: 800 } });

test("adding and removing friend code with pre-existing runs toggles friend indicators", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(page.url());

  await page.waitForSelector('[data-test="main-title"]');
  await page.waitForSelector('.run .runName');

  await page.click('[data-test="toggle-drawer"]');

  await expect(page.locator('[data-test="event-item"]').first()).toBeVisible();

  await page.click('[data-test="event-item"]:has-text("AGDQ2025")');

  await page.waitForSelector(".day-divider");
  
  const threeAGDQ2025RunId = "59447256-69364948-37585178-50563968-306c634d-53464e70-78666532";

  await page.click('[data-test="open-friend-menu"]');

  await expect(page.locator(".with-friend")).toHaveCount(0);

  await page.fill('input[aria-label="Enter friend code"]', threeAGDQ2025RunId);

  await page.click('m3e-dialog[data-test="friend-dialog"] m3e-dialog-action[return-value="apply"]');

  await expect(page.locator(".with-friend")).not.toHaveCount(0, {
    timeout: 5000,
  });
});

test("adding your own friend code means clock and friend indicator are shown", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto(page.url() + "#date=2025-01-04%2000:00:00");

  // wait for firebase to be initialized
  await page.waitForFunction(() => localStorage.getItem("firebaseUserID"));

  await page.waitForSelector('[data-test="main-title"]');

  await page.waitForSelector(".day-divider");

  await page.click(".run .runName", { timeout: 5000 });
  await expect(page.locator(".is-set")).toHaveCount(1);
  await expect(page.locator(".with-friend")).toHaveCount(0);

  await page.click('[data-test="open-friend-menu"]');
  await page.click('m3e-dialog[data-test="friend-dialog"] m3e-icon-button');

  const friendCode = await page.evaluate(() => navigator.clipboard.readText());

  await page.fill('input[aria-label="Enter friend code"]', friendCode);
  await page.click('m3e-dialog[data-test="friend-dialog"] m3e-dialog-action[return-value="apply"]');

  await expect(page.locator(".is-set")).toHaveCount(1);
  await expect(page.locator(".with-friend")).toHaveCount(1);

  await page.click(".run .runName", { timeout: 5000 });
  await expect(page.locator(".is-set")).toHaveCount(0);
  await expect(page.locator(".with-friend")).toHaveCount(0);

  await page.click(".run .runName", { timeout: 5000 });
  await expect(page.locator(".is-set")).toHaveCount(1); 
  await expect(page.locator(".with-friend")).toHaveCount(1);
});

test("back button press can close opened friend menu", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto(page.url());

  await page.waitForSelector('[data-test="main-title"]');

  await page.click('[data-test="open-friend-menu"]');

  await expect(page.locator('m3e-dialog[data-test="friend-dialog"] dialog[open]')).toHaveCount(1);

  // emulates back button of phones
  await page.keyboard.down("Control");
  await page.keyboard.press("b");
  await page.keyboard.up("Control");

  await expect(page.locator('m3e-dialog[data-test="friend-dialog"] dialog[open]')).toHaveCount(0);
});