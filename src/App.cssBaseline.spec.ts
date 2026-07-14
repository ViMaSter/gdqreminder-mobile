import { test, expect } from "./test-utils/ct";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

test.use({ viewport: { width: 460, height: 800 } });

const baselinePath = resolve(process.cwd(), "playwright", "css-baseline.json");

const styleTargets = [
  {
    label: '"data-test-selector=\"main\""',
    selector: '[data-test-selector="main"]',
  },
  {
    label: '".run.in-person"',
    selector: ".run.in-person",
  },
  {
    label: '"#app > div.container.main > mwc-drawer > span"',
    selector: "#app > div.container.main > mwc-drawer > span",
  },
  {
    label: '"#app > div.container.main > mwc-drawer"',
    selector: "#app > div.container.main > mwc-drawer",
  },
  {
    label: '"#app > div.container.main > mwc-drawer > md-list > md-list-item:nth-child(1)"',
    selector: "#app > div.container.main > mwc-drawer > md-list > md-list-item:nth-child(1)",
  },
  {
    label:
      'window.getComputedStyle(document.querySelector("#app > div.container.gdq-settings > main > md-list > md-list-item:nth-child(3) > md-switch"))',
    selector: "#app > div.container.gdq-settings > main > md-list > md-list-item:nth-child(3) > md-switch",
  },
  {
    label: '"#app > div.container.gdq-settings > main > md-list > md-list-item:nth-child(3)"',
    selector: "#app > div.container.gdq-settings > main > md-list > md-list-item:nth-child(3)",
  },
] as const;

type CapturedStyle = {
  label: string;
  selector: string;
  found: boolean;
  padding: string;
  margin: string;
  color: string;
  backgroundColor: string;
};

type BaselineData = {
  targets: CapturedStyle[];
};

const loadDependencies = async () => {
  const packageJsonPath = resolve(process.cwd(), "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  return {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
};

const hasScopedPackage = (dependencies: Record<string, string>, scope: string) =>
  Object.keys(dependencies).some((pkg) => pkg.startsWith(`${scope}/`) || pkg === scope);

test("captures or compares CSS baseline for framework refactor", async ({ page }, testInfo) => {
  test.setTimeout(60_000);

  if (testInfo.project.name !== "chromium") {
    test.skip(true, "Runs only once to avoid per-project baseline drift.");
  }

  const dependencies = await loadDependencies();
  const hasMaterialPackages = hasScopedPackage(dependencies, "@material");
  const hasM3ePackages = hasScopedPackage(dependencies, "@m3e");

  if (!hasMaterialPackages && !hasM3ePackages) {
    test.skip(true, "Neither @material nor @m3e packages are installed.");
  }

  await page.goto(page.url() + "#date=2025-01-04%2000:00:00");
  await page.evaluate(() => {
    location.reload();
  });

  // Match existing tests' app-ready signal instead of relying on page load.
  await page.waitForSelector('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="title"]');
  await page.waitForSelector(".run .runName");

  await page.click('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="navigationIcon"]');
  await page.waitForSelector(".mdc-drawer");

  await page.click('mwc-top-app-bar-fixed[data-test-selector="main"] [slot="navigationIcon"]');
  await expect(page.locator(".mdc-drawer")).not.toBeVisible();

  await page.click('[data-test="settings"]');
  await page.waitForSelector(".gdq-settings");
  await page.waitForSelector(
    "#app > div.container.gdq-settings > main > md-list > md-list-item:nth-child(3) > md-switch",
  );

  const capturedTargets = await page.evaluate((targets) => {
    return targets.map(({ label, selector }) => {
      const element = document.querySelector(selector);
      if (!element) {
        return {
          label,
          selector,
          found: false,
          padding: "",
          margin: "",
          color: "",
          backgroundColor: "",
        };
      }

      const computed = window.getComputedStyle(element);
      return {
        label,
        selector,
        found: true,
        padding: computed.padding,
        margin: computed.margin,
        color: computed.color,
        backgroundColor: computed.backgroundColor,
      };
    });
  }, styleTargets);

  const baseline: BaselineData = {
    targets: capturedTargets,
  };

  if (hasMaterialPackages) {
    await mkdir(dirname(baselinePath), { recursive: true });
    await writeFile(baselinePath, JSON.stringify(baseline, null, 2) + "\n", "utf8");
    return;
  }

  if (hasM3ePackages) {
    let expectedRaw: string;
    try {
      expectedRaw = await readFile(baselinePath, "utf8");
    } catch {
      throw new Error(
        `Missing baseline file at ${baselinePath}. Run this test with @material packages first to generate it.`,
      );
    }

    const expected = JSON.parse(expectedRaw) as BaselineData;
    expect(baseline).toEqual(expected);
  }
});