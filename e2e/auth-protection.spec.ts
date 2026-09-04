import { test, expect } from "@playwright/test";
import { signInAsTestUser } from "./auth-helper";
import {
  assertAuthBypassOffForE2E,
  expectNoApplicationError,
  expectNotBare404,
  expectRedirectedToSignIn,
} from "./auth-assertions";

/** Routes that must redirect unsigned visitors to sign-in (not bare 404).
 * `/tools` is deliberately absent: next.config.ts 307-redirects it to the
 * public /tools/workshop (redirects run before the proxy), so it no longer
 * lands on sign-in — the dedicated unsigned test below pins that. */
const PROTECTED_ROUTES = [
  "/tools/technique",
  "/tools/tracking",
  "/tools/chladni-ripple",
  "/tools/julia",
  "/tools/lissajous",
  "/tools/quasiperiodic",
  "/tools/multigrid",
  "/tools/midi-test",
  "/chat",
  "/settings/theme",
  "/settings/atmosphere",
  "/settings/billing",
] as const;

/** Public marketing / demo routes (proxy allowlist). */
const PUBLIC_ROUTES = [
  {
    path: "/",
    assert: async (page: import("@playwright/test").Page) => {
      await expect(page.locator("body")).toContainText("Piano Suite");
    },
  },
  {
    path: "/tools/chladni",
    assert: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("heading", { name: "Chladni Pattern Lab" })
      ).toBeVisible();
    },
  },
  // Ready-made drills are public (audit 2026-09, Phase 0.2): "Play now"
  // must work for a signed-out first-time visitor.
  {
    path: "/tools/chord-drill",
    assert: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("heading", { name: /Chord Drill/i }).first()
      ).toBeVisible();
    },
  },
  {
    path: "/tools/arpeggios",
    assert: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("heading", { name: /Arpeggio/i }).first()
      ).toBeVisible();
    },
  },
  {
    path: "/tools/root-cycling",
    assert: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("heading", { name: /Root Cycling/i }).first()
      ).toBeVisible();
    },
  },
  {
    path: "/tools/progression",
    assert: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("heading", { name: /Progression/i }).first()
      ).toBeVisible();
    },
  },
  {
    path: "/marketplace",
    assert: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("heading", { name: "Marketplace", exact: true })
      ).toBeVisible();
      // Featured seeds ship with the app so the gallery is never empty.
      await expect(page.getByRole("heading", { name: "Featured" })).toBeVisible();
    },
  },
  {
    path: "/articles",
    assert: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("heading", { name: "Articles", exact: true })
      ).toBeVisible();
    },
  },
  {
    path: "/articles/beginner-pianist-learning-journey",
    assert: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("heading", {
          name: /Research-Informed Guide to Learning Piano/i,
        }).first()
      ).toBeVisible();
    },
  },
  {
    path: "/pricing",
    assert: async (page: import("@playwright/test").Page) => {
      await expect(
        page.getByRole("heading", {
          name: /Practice free\. Pro is on the way\./i,
        })
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Pricing" })).toBeVisible();
    },
  },
] as const;

/** Signed-in smoke: path → visible heading (or body text for brand-only pages). */
const SIGNED_IN_ROUTE_SMOKE: Array<{
  path: string;
  /** Expected URL after optional redirects (defaults to `path`). */
  finalPath?: string;
  heading?: string | RegExp;
  bodyText?: string | RegExp;
}> = [
  { path: "/", bodyText: "Piano Suite" },
  { path: "/pricing", heading: /Practice free\. Pro is on the way\./i },
  { path: "/tools", finalPath: "/tools/workshop", heading: "Workshop" },
  { path: "/tools/chord-drill", heading: /Chord Drill/i },
  { path: "/tools/arpeggios", heading: /Arpeggio/i },
  { path: "/tools/root-cycling", heading: /Root Cycling/i },
  { path: "/tools/progression", heading: /Progression/i },
  { path: "/tools/technique", heading: /Technique/i },
  { path: "/tools/tracking", heading: "Tracking" },
  { path: "/tools/chladni", heading: "Chladni Pattern Lab" },
  { path: "/tools/chladni-ripple", heading: /Chladni Ripple/i },
  { path: "/tools/julia", heading: /Julia/i },
  { path: "/tools/lissajous", heading: /Lissajous/i },
  { path: "/tools/quasiperiodic", heading: /Quasiperiodic/i },
  { path: "/tools/multigrid", heading: /Multigrid/i },
  { path: "/tools/midi-test", heading: /MIDI/i },
  { path: "/articles", heading: "Articles" },
  { path: "/chat", heading: "Practice Assistant" },
  { path: "/settings/theme", heading: "Theme" },
  { path: "/settings/atmosphere", heading: "Atmosphere" },
  { path: "/settings/billing", heading: "Billing" },
];

test.describe("auth protection (bypass off)", () => {
  test.beforeAll(() => {
    assertAuthBypassOffForE2E();
  });

  test.describe("unsigned", () => {
    test.use({
      storageState: { cookies: [] as never[], origins: [] as never[] },
    });

    for (const route of PROTECTED_ROUTES) {
      test(`unsigned ${route} redirects to sign-in (not bare 404)`, async ({
        page,
      }) => {
        await page.goto(route);
        await expectRedirectedToSignIn(page);
      });
    }

    for (const { path, assert } of PUBLIC_ROUTES) {
      test(`unsigned ${path} stays public`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveURL(path);
        await expectNotBare404(page);
        await expectNoApplicationError(page);
        await assert(page);
      });
    }

    // /tools cannot live in PROTECTED_ROUTES (it 307s to the public
    // workshop before the proxy) nor in PUBLIC_ROUTES (that loop pins the
    // exact URL, which a redirecting path fails). Assert the redirect and
    // the destination instead.
    test("unsigned /tools lands on the public workshop", async ({ page }) => {
      await page.goto("/tools");
      await expect(page).toHaveURL("/tools/workshop");
      await expectNotBare404(page);
      await expectNoApplicationError(page);
      await expect(
        page.getByRole("heading", { name: "Workshop" }).first()
      ).toBeVisible();
    });
  });

  test.describe("signed-in", () => {
    test("signed-in user can open /tools after sign-in", async ({ page }) => {
      await signInAsTestUser(page);
      await page.goto("/tools");
      await expectNotBare404(page);
      await expectNoApplicationError(page);
      await expect(page).toHaveURL("/tools/workshop");
      await expect(
        page.getByRole("heading", { name: "Workshop" })
      ).toBeVisible();
    });

    test("signed-in homepage loads without application error", async ({
      page,
    }) => {
      await signInAsTestUser(page);
      await page.goto("/");
      await expect(page).toHaveURL("/");
      await expectNotBare404(page);
      await expectNoApplicationError(page);
      await expect(page.locator("body")).toContainText("Piano Suite");
    });

    test("deep link to tracking after sign-in reaches the tool", async ({
      page,
    }) => {
      await signInAsTestUser(page);
      await page.goto("/tools/tracking");
      await expectNotBare404(page);
      await expectNoApplicationError(page);
      await expect(page).toHaveURL(/\/tools\/tracking/);
      await expect(page.getByRole("heading", { name: "Tracking" })).toBeVisible();
    });
  });
});

test.describe("signed-in route smoke (all app pages)", () => {
  test.beforeAll(() => {
    assertAuthBypassOffForE2E();
  });

  // One test per route so failures name the broken page, retries re-run a
  // single route, and fullyParallel spreads the smoke pass across workers.
  for (const { path, finalPath, heading, bodyText } of SIGNED_IN_ROUTE_SMOKE) {
    test(`signed-in ${path} loads without bare 404 or application error`, async ({
      page,
    }) => {
      await signInAsTestUser(page);

      await page.goto(path);
      await expectNotBare404(page);
      await expectNoApplicationError(page);

      const expectedPath = finalPath ?? path;
      if (expectedPath === "/") {
        await expect(page).toHaveURL("/");
      } else {
        await expect(page).toHaveURL(new RegExp(`${expectedPath.replace(/\//g, "\\/")}$`));
      }
      if (heading !== undefined) {
        await expect(
          page.getByRole("heading", { name: heading }).first()
        ).toBeVisible();
      }
      if (bodyText !== undefined) {
        await expect(page.locator("body")).toContainText(bodyText);
      }
    });
  }
});
