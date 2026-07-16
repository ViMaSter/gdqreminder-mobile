import { test, expect } from "./test-utils/ct";

test.use({ viewport: { width: 460, height: 800 } });

test(`toast with settings hint is shown only initially`, async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("http://localhost:3100/");

  await page.waitForSelector('[data-test="main-title"]');

  await expect(page.locator('.run').first()).toBeVisible();

  await expect(page.locator('m3e-snackbar')).toHaveCount(1);

  await page.getByRole('button', { name: 'Open settings' }).click();

  await expect(page.locator('.gdq-settings m3e-app-bar')).toBeVisible();

  await expect(page.locator('.gdq-settings')).not.toHaveClass('list-leave-active');

  await page.click('.gdq-settings m3e-icon-button[slot="leading"]');

  await page.waitForSelector('[data-test="main-title"]');

  await page.locator('.run').first().focus();

  const snackbarContent = page.locator('m3e-snackbar > span').first();
  await expect(page.locator('m3e-snackbar > span > b').first()).toBeVisible();
  await expect(snackbarContent).toContainText(' - ');
  await expect(snackbarContent).toContainText(' by ');
  await expect(snackbarContent).not.toContainText('<b>');

  await page.reload();

  await page.waitForLoadState('load');

  await expect(page.locator('m3e-snackbar')).toHaveCount(0);
})