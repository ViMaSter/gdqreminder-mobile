import { test, expect } from "./test-utils/ct";

test.use({ viewport: { width: 360, height: 800 }, hasTouch: true });

type Page = Parameters<Parameters<typeof test>[2]>[0]["page"];

const isEventsListRequest = (url: string) => /\/tracker\/api\/v2\/events\/$/.test(new URL(url).pathname);

const openSidebar = async (page: Page) => {
  await page.goto(page.url() + "#date=2024-01-15%2000:00:00");
  await page.evaluate(() => {
    location.reload();
  });
  await page.waitForSelector(".run .runName");
  // the first boot stores default settings; reload so the onboarding toast stays out of the way
  await page.reload();
  await page.waitForSelector(".run .runName");

  await page.click('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="navigationIcon"]');
  await expect(page.locator("md-list-item.rotating")).toHaveCount(0, { timeout: 40_000 });
  await expect(page.locator(".mdc-snackbar--open")).toHaveCount(0);
};

// real touch input through the browser, so passive listeners and native scrolling apply as on a device
let nextTouchID = 1;
const touchDrag = async (page: Page, from: { x: number; y: number }, dx: number, dy: number) => {
  // a fresh identifier per gesture, as Chrome on Android hands them out
  const id = nextTouchID++;
  const cdp = await page.context().newCDPSession(page);
  const touchAt = (step: number) => [{ x: from.x + (dx * step) / 20, y: from.y + (dy * step) / 20, id }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: touchAt(0) });
  for (let step = 1; step <= 20; step++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: touchAt(step) });
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
};

const pullDown = async (page: Page, distance: number) => {
  const firstEvent = await page.locator("md-list md-list-item").first().boundingBox();
  const x = firstEvent!.x + firstEvent!.width / 2;
  const y = firstEvent!.y + firstEvent!.height / 2;

  await touchDrag(page, { x, y }, 0, distance);
};

test("pulling the event list down refetches events despite the cache", async ({ page }) => {
  test.setTimeout(90_000);
  await openSidebar(page);

  const indicator = page.locator('[data-test="pull-to-refresh-indicator"]');
  await expect(indicator).not.toHaveClass(/visible/);

  // keep the refresh pending long enough to inspect the resting state
  await page.route(
    (url) => isEventsListRequest(url.toString()),
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
      await route.continue();
    },
  );
  const refetch = page.waitForRequest((request) => isEventsListRequest(request.url()));
  await pullDown(page, 300);
  await refetch;

  // the list is pushed down, and the spinner fits into the gap without being clipped
  await expect(page.locator(".pullToRefresh md-list")).toHaveAttribute("style", /translateY\(64px\)/);
  await expect(indicator).toHaveClass(/visible/);
  await page.waitForTimeout(300); // let the settle transition finish
  const listTop = (await page.locator(".pullToRefresh md-list").boundingBox())!.y;
  const scrollerTop = await page.evaluate(
    () =>
      document.querySelector("mwc-drawer")!.shadowRoot!.querySelector(".mdc-drawer__content")!.getBoundingClientRect()
        .top,
  );
  const spinner = (await indicator.boundingBox())!;
  expect(spinner.height).toBeCloseTo(40, 0);
  expect(spinner.y).toBeGreaterThanOrEqual(scrollerTop);
  expect(spinner.y + spinner.height).toBeLessThanOrEqual(listTop);

  await expect(indicator).not.toHaveClass(/visible/, { timeout: 15_000 });
  await expect(page.locator("md-list md-list-item:not(.rotating)").first()).toBeVisible();
});

test("a short pull snaps back without refetching", async ({ page }) => {
  test.setTimeout(90_000);
  await openSidebar(page);

  let refetches = 0;
  page.on("request", (request) => {
    if (isEventsListRequest(request.url())) {
      refetches++;
    }
  });

  await pullDown(page, 80);
  await page.waitForTimeout(1_500);

  expect(refetches).toBe(0);
  await expect(page.locator('[data-test="pull-to-refresh-indicator"]')).not.toHaveClass(/visible/);
});

test("a failed refresh keeps the cached events and tells the user", async ({ page }) => {
  test.setTimeout(90_000);
  await openSidebar(page);

  const sidebarItems = page.locator("md-list md-list-item:not(.rotating)");
  const eventsBefore = await sidebarItems.allTextContents();

  await page.route(
    (url) => isEventsListRequest(url.toString()),
    (route) => route.abort("internetdisconnected"),
  );
  await pullDown(page, 300);

  await expect(page.locator(".mdc-snackbar--open .mdc-snackbar__label")).toContainText(
    "Couldn't refresh events",
  );
  await expect(page.locator('[data-test="pull-to-refresh-indicator"]')).not.toHaveClass(/visible/);
  expect(await sidebarItems.allTextContents()).toEqual(eventsBefore);
});

test("the drawer can still be swiped shut and open after pulling", async ({ page }) => {
  test.setTimeout(90_000);
  await openSidebar(page);
  const drawerOpen = () => page.evaluate(() => (document.querySelector("mwc-drawer") as unknown as { open: boolean }).open);

  await pullDown(page, 80);
  await touchDrag(page, { x: 200, y: 400 }, -180, 0);
  await expect.poll(drawerOpen).toBe(false);

  await touchDrag(page, { x: 2, y: 400 }, 200, 0);
  await expect.poll(drawerOpen).toBe(true);
});
