import { test, expect } from "@playwright/experimental-ct-vue";
import * as playwright from 'playwright';

test.use({ viewport: { width: 460, height: 800 } });

const scenarios = [
  {
    "locale": "en-US",
    "defaultLanguage": "Use system default",
    "germanLanguage": "Deutsch",
  },
  {
    "locale": "de-DE",
    "defaultLanguage": "Systemstandard benutzen",
    "germanLanguage": "Deutsch",
  },
  {
    "locale": "de-AT",
    "defaultLanguage": "Use system default",
    "germanLanguage": "Deutsch",
  },
]

scenarios.forEach(({ locale, defaultLanguage, germanLanguage }) => {
  test(`locale '${locale}' uses '${defaultLanguage}' and allows switch to '${germanLanguage}'`, async ({ browser }) => {
    test.setTimeout(60_000);

    const context = await browser.newContext({ locale });

    const page = await context.newPage();

    await page.goto("http://localhost:3100/");

    await page.waitForSelector('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="title"]');

    await page.click('[data-test="settings"]');

    await expect(page.locator('.gdq-settings mwc-top-app-bar-fixed')).toBeVisible();

    await expect(page.locator('.wrapper')).not.toHaveClass('list-leave-active');

    await page.locator('[data-test=open-language-dialog]').click();

    await expect(page.locator('[data-test=language-dialog]')).toBeVisible();

    await expect(page.locator('[data-test=language-dialog]')).toContainText(defaultLanguage);

    await page.locator('[data-test=language-option-german]').click();

    await page.waitForSelector('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="title"]');

    await page.click('[data-test="settings"]');

    await expect(page.locator('[data-test=language-dialog]')).toContainText(germanLanguage);

    await context.close();
  })
});