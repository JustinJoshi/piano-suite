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

