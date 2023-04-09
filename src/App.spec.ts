import { test, expect, } from '@playwright/experimental-ct-vue';

test.use({ viewport: { width: 540, height: 1200 } });

test('can show at least one run of last event', async ({ page }) => {
  // wait for app to load
  await page.waitForSelector('mwc-top-app-bar-fixed [slot="title"]');
  await expect(page.locator('mwc-top-app-bar-fixed [slot="title"]')).toHaveText(/\w+/);

  // click on hamburger menu
  await page.click('mwc-top-app-bar-fixed [slot="navigationIcon"]');

  await page.waitForSelector('.mdc-drawer');
  await page.waitForSelector('mwc-list mwc-list-item:not(.rotating)');
  
  await page.click('mwc-list mwc-list-item');

  await page.waitForSelector('.day-divider');
  await expect(page.locator('.dayNumber').first()).toHaveText(/\d+/);

  await page.waitForSelector('.run');
  await expect(page.locator('.run .runName').first()).toHaveText(/\w+/);
});