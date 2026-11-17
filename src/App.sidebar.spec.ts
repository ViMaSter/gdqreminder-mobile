import { test, expect } from "./test-utils/ct";

test.use({ viewport: { width: 360, height: 800 } });

const normalizeTexts = (texts: string[]) =>
  texts.map((text) => text.replace(/\s+/g, " ").trim()).filter(Boolean);

test("switching events in sidebar updates title and shown runs", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto(page.url() + "#date=2024-01-15%2000:00:00");
  await page.evaluate(() => {
    location.reload();
  });

  const title = page.locator('[data-test="main-title"]');

  await page.waitForSelector('[data-test="main-title"]');
  await page.waitForSelector(".run .runName");

  const initialTitle = (await title.textContent())?.trim() ?? "";
  const initialRunNames = normalizeTexts(await page.locator(".run .runName").allTextContents()).slice(0, 5);

  expect(initialTitle).not.toBe("");
  expect(initialRunNames.length).toBeGreaterThan(0);

  await page.click('[data-test="toggle-drawer"]');
  await expect(page.locator('[data-test="event-item"]').first()).toBeVisible();
  await expect(page.locator('[data-test="event-loading-item"]')).toHaveCount(0, { timeout: 40_000 });

  const sidebarItems = page.locator('[data-test="event-item"]');
  await expect(sidebarItems.first()).toBeVisible();

  const eventTitles = normalizeTexts(await sidebarItems.allTextContents());
  const targetEventTitle = eventTitles.find((eventTitle) => eventTitle !== initialTitle);

  expect(targetEventTitle).toBeTruthy();

  await page.click(`[data-test="event-item"]:has-text("${targetEventTitle}")`);

  await expect(title).toHaveText(targetEventTitle as string, { timeout: 10_000 });
  await page.waitForSelector(".run .runName");

  const switchedRunNames = normalizeTexts(await page.locator(".run .runName").allTextContents()).slice(0, 5);

  expect(switchedRunNames.length).toBeGreaterThan(0);
  expect(switchedRunNames).not.toEqual(initialRunNames);
});
