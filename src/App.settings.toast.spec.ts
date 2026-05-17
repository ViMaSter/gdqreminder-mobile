import { test, expect } from "./test-utils/ct";

test.use({ viewport: { width: 460, height: 800 } });

test(`toast with settings hint is shown only initially`, async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("http://localhost:3100/");

  await page.waitForSelector('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="title"]');

  await page.click('[data-test="settings"]');

  await expect(page.locator('.mdc-snackbar')).toHaveCount(1);

  await expect(page.locator('.mdc-snackbar--open')).toHaveCount(1);

  await expect(page.locator('.gdq-settings mwc-top-app-bar-fixed')).toBeVisible();

  await expect(page.locator('.wrapper')).not.toHaveClass('list-leave-active');

  await page.reload();

  await page.waitForLoadState('load');

  await expect(page.locator('.mdc-snackbar')).toHaveCount(1);

  await expect(page.locator('.mdc-snackbar--open')).toHaveCount(0);
})