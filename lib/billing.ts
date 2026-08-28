/**
 * Clerk Billing plan / feature catalog for Piano Suite (B2C).
 *
 * These slugs must match the Clerk Dashboard (or `clerk/billing.desired.json`
 * applied via `scripts/apply-clerk-billing.sh`). Gate Convex sync with the
 * `sync` feature — prefer `has({ feature: SYNC_FEATURE_SLUG })` over plan
 * checks so entitlements can move between plans without a code deploy.
 *
 * @see docs/clerk-billing-setup.md
 * @see docs/subscription-page-plan.md
 */

/** Paid user plan slug (Clerk → Billing → Plans → User Plans). */
export const PRO_PLAN_SLUG = "pro" as const;

/**
 * Free forever local practice. Clerk auto-creates `free_user` when Billing is
 * enabled for users; we do not gate on this slug — absence of Pro/`sync` is Free.
 */
export const FREE_PLAN_SLUG = "free_user" as const;

/** Feature that unlocks Convex practice history + cross-device prefs sync. */
export const SYNC_FEATURE_SLUG = "sync" as const;

/**
 * Pre-launch switch: false gates Pro behind the Founding Pro waitlist
 * (components/waitlist/waitlist-cta.tsx) instead of Clerk PricingTable.
 * Flip to true at launch to restore the pricing table + Stripe offers.
 */
export const BILLING_ENABLED = false as const;

export function foundingProHeadline(): string {
  return "Become a Founding Pro";
}

export function foundingProSubcopy(): string {
  return "Pro launches soon. Join the waitlist to lock in founding-member pricing and shape what gets built next.";
}

export type PlanSlug = typeof PRO_PLAN_SLUG | typeof FREE_PLAN_SLUG;
export type FeatureSlug = typeof SYNC_FEATURE_SLUG;

/** Display prices for marketing copy (Clerk owns the charged amounts). */
export const PRO_PRICING = {
  currency: "USD",
  /** Monthly list price in cents — $8.00 */
  monthlyCents: 800,
  /** Annual list price in cents — $72.00 (~25% vs 12× monthly) */
  annualCents: 7200,
} as const;

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function proMonthlyLabel(): string {
  return `${formatUsdFromCents(PRO_PRICING.monthlyCents)}/mo`;
}

export function proAnnualLabel(): string {
  return `${formatUsdFromCents(PRO_PRICING.annualCents)}/yr`;
}

/** Effective monthly rate when billed annually. */
export function proAnnualEffectiveMonthlyCents(): number {
  return Math.round(PRO_PRICING.annualCents / 12);
}

export function proAnnualSavingsPercent(): number {
  const fullYear = PRO_PRICING.monthlyCents * 12;
  if (fullYear <= 0) return 0;
  return Math.round(
    ((fullYear - PRO_PRICING.annualCents) / fullYear) * 100
  );
}

/**
 * True when the user may write practice history to Convex.
 * Pass Clerk `has` results (or treat auth-disabled as full access).
 */
export function canPersistFromEntitlements(args: {
  authDisabled: boolean;
  hasSyncFeature: boolean;
  hasProPlan: boolean;
}): boolean {
  if (args.authDisabled) return true;
  return args.hasSyncFeature || args.hasProPlan;
}

/**
 * Soft upgrade copy when the UI is open but Convex sync is gated (signed-in Free).
 * Keep Tracking / Technique messaging aligned with the Pro wedge (sync, not more drills).
 */
export function localPracticeBanner(
  surface: "tracking" | "technique"
): string {
  if (surface === "tracking") {
    return "Local practice mode — upgrade to Pro to sync personal bests and history across devices.";
  }
  return "Local practice mode — metronome works; upgrade to Pro to sync session history.";
}

/**
 * True when the user may open the ambient float / pop-out panel.
 * Same entitlement as Convex sync for v1 (Pro or AUTH_DISABLED).
 */
export function canUseFloatPanelFromEntitlements(args: {
  authDisabled: boolean;
  hasSyncFeature: boolean;
  hasProPlan: boolean;
}): boolean {
  return canPersistFromEntitlements(args);
}

/**
 * Soft upgrade copy for the Pro-only float / pop-out resonance panel.
 * Pitch practice accompaniment (resonance while drilling), not "more drills."
 */
export function floatPanelUpgradeCopy(
  surface: "ripple-lab" | "atmosphere" | "chord-drill" = "ripple-lab"
): string {
  if (surface === "atmosphere") {
    return "Float panel is Pro — pop out live Chladni resonance beside Chord Drill and other tools.";
  }
  if (surface === "chord-drill") {
    return "Pro: pop out live MIDI resonance beside your drill.";
  }
  return "Pop out live resonance while you drill chords — upgrade to Pro.";
}

/**
 * Parse Clerk Billing session claims (`pla` / `fea`).
 * Format: comma-separated `u:slug` / `o:slug` (user / org scope).
 * @see https://clerk.com/docs/guides/secure/session-tokens
 */
export function splitClerkBillingClaim(
  claim: string | null | undefined
): { user: string[]; org: string[] } {
  const user: string[] = [];
  const org: string[] = [];
  if (!claim || typeof claim !== "string") {
    return { user, org };
  }
  for (const part of claim.split(",")) {
    const trimmed = part.trim();
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const scope = trimmed.slice(0, colon);
    const value = trimmed.slice(colon + 1);
    if (!value) continue;
    if (scope === "u" || scope === "user") user.push(value);
    else if (scope === "o" || scope === "org" || scope === "organization") {
      org.push(value);
    } else if (scope === "ou" || scope === "uo") {
      user.push(value);
      org.push(value);
    }
  }
  return { user, org };
}

/** True when JWT `pla`/`fea` (or camelCase aliases) grant Pro sync. */
export function hasSyncFromClerkClaims(
  claims: Record<string, unknown> | null | undefined
): boolean {
  if (!claims) return false;
  const fea = claims.fea ?? claims.features;
  const pla = claims.pla ?? claims.plans;
  const features = splitClerkBillingClaim(
    typeof fea === "string" ? fea : undefined
  );
  const plans = splitClerkBillingClaim(
    typeof pla === "string" ? pla : undefined
  );
  return (
    features.user.includes(SYNC_FEATURE_SLUG) ||
    plans.user.includes(PRO_PLAN_SLUG)
  );
}

