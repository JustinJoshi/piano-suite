import { describe, expect, it } from "vitest";
import {
  PRO_PLAN_SLUG,
  SYNC_FEATURE_SLUG,
  PRO_PRICING,
  canPersistFromEntitlements,
  canUseFloatPanelFromEntitlements,
  floatPanelUpgradeCopy,
  formatUsdFromCents,
  hasSyncFromClerkClaims,
  localPracticeBanner,
  proAnnualEffectiveMonthlyCents,
  proAnnualLabel,
  proAnnualSavingsPercent,
  proMonthlyLabel,
  splitClerkBillingClaim,
} from "@/lib/billing";

describe("billing catalog", () => {
  it("locks Pro and sync slugs for Clerk has() checks", () => {
    expect(PRO_PLAN_SLUG).toBe("pro");
    expect(SYNC_FEATURE_SLUG).toBe("sync");
  });

  it("prices Pro inside the utility band ($5–10/mo, ~$40–80/yr)", () => {
    expect(PRO_PRICING.monthlyCents).toBeGreaterThanOrEqual(500);
    expect(PRO_PRICING.monthlyCents).toBeLessThanOrEqual(1000);
    expect(PRO_PRICING.annualCents).toBeGreaterThanOrEqual(4000);
    expect(PRO_PRICING.annualCents).toBeLessThanOrEqual(8000);
  });

  it("formats display labels", () => {
    expect(formatUsdFromCents(800)).toBe("$8");
    expect(proMonthlyLabel()).toBe("$8/mo");
    expect(proAnnualLabel()).toBe("$72/yr");
    expect(proAnnualEffectiveMonthlyCents()).toBe(600);
    expect(proAnnualSavingsPercent()).toBe(25);
  });
});

describe("canPersistFromEntitlements", () => {
  it("allows persist when auth is disabled (Hobby / local bypass)", () => {
    expect(
      canPersistFromEntitlements({
        authDisabled: true,
        hasSyncFeature: false,
        hasProPlan: false,
      })
    ).toBe(true);
  });

  it("allows persist for sync feature or Pro plan", () => {
    expect(
      canPersistFromEntitlements({
        authDisabled: false,
        hasSyncFeature: true,
        hasProPlan: false,
      })
    ).toBe(true);
    expect(
      canPersistFromEntitlements({
        authDisabled: false,
        hasSyncFeature: false,
        hasProPlan: true,
      })
    ).toBe(true);
  });

  it("denies persist for Free (no sync, no Pro)", () => {
    expect(
      canPersistFromEntitlements({
        authDisabled: false,
        hasSyncFeature: false,
        hasProPlan: false,
      })
    ).toBe(false);
  });
});

describe("localPracticeBanner", () => {
  it("pitches Pro sync, not sign-in, for Free local mode", () => {
    expect(localPracticeBanner("tracking")).toMatch(/upgrade to Pro/i);
    expect(localPracticeBanner("tracking")).toMatch(/sync/i);
    expect(localPracticeBanner("technique")).toMatch(/upgrade to Pro/i);
    expect(localPracticeBanner("technique")).not.toMatch(/sign-?in/i);
  });
});

describe("float panel Pro gate", () => {
  it("matches canPersist entitlements", () => {
    expect(
      canUseFloatPanelFromEntitlements({
        authDisabled: false,
        hasSyncFeature: false,
        hasProPlan: false,
      })
    ).toBe(false);
    expect(
      canUseFloatPanelFromEntitlements({
        authDisabled: false,
        hasSyncFeature: true,
        hasProPlan: false,
      })
    ).toBe(true);
    expect(
      canUseFloatPanelFromEntitlements({
        authDisabled: true,
        hasSyncFeature: false,
        hasProPlan: false,
      })
    ).toBe(true);
  });

  it("pitches practice resonance, not more drills", () => {
    expect(floatPanelUpgradeCopy("ripple-lab")).toMatch(/resonance/i);
    expect(floatPanelUpgradeCopy("ripple-lab")).toMatch(/Pro/i);
    expect(floatPanelUpgradeCopy("atmosphere")).toMatch(/Chord Drill/i);
    expect(floatPanelUpgradeCopy("chord-drill")).toMatch(/MIDI resonance/i);
    expect(floatPanelUpgradeCopy("chord-drill")).not.toMatch(/more drills/i);
  });
});

describe("Clerk Billing claim parsing", () => {
  it("splits u:/o: scoped pla and fea claims", () => {
    expect(splitClerkBillingClaim("u:pro")).toEqual({
      user: ["pro"],
      org: [],
    });
    expect(splitClerkBillingClaim("u:sync,o:dashboard")).toEqual({
      user: ["sync"],
      org: ["dashboard"],
    });
  });

  it("detects Pro from fea sync or pla pro", () => {
    expect(hasSyncFromClerkClaims({ fea: "u:sync", pla: "u:free_user" })).toBe(
      true
    );
    expect(hasSyncFromClerkClaims({ pla: "u:pro" })).toBe(true);
    expect(hasSyncFromClerkClaims({ pla: "u:free_user", fea: "" })).toBe(false);
    expect(hasSyncFromClerkClaims({})).toBe(false);
  });
});
