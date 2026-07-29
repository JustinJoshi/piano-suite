# Clerk Billing setup — Piano Suite (WP0)

> **Owner action required.** Cloud agents cannot complete OAuth to your Clerk
> account. Run the CLI steps below on a machine where you can log into Clerk,
> or create the same plans in the Dashboard.

Product decisions locked in code (`lib/billing.ts`):

| Item | Value |
|------|--------|
| Model | Freemium (Free forever + Pro). Reverse trial deferred |
| Free | Clerk `free_user` (auto-created). Local drills; no Convex sync |
| Pro plan slug | `pro` |
| Sync feature slug | `sync` |
| Monthly | **$8.00** (`800` cents) |
| Annual | **$72.00** (`7200` cents, ~$6/mo, **25%** off) |
| Payer | User (B2C) — not Organizations |
| Trial on plan | Off for v1 |

Gate Convex writes with `has({ feature: 'sync' })` (fallback `has({ plan: 'pro' })`).
See `canPersistFromEntitlements` in `lib/billing.ts`.

---

## Path A — CLI (preferred)

From the repo root:

```bash
npx clerk auth login
npx clerk link

# Preview
./scripts/apply-clerk-billing.sh

# Write to the linked **dev** instance
./scripts/apply-clerk-billing.sh --apply

# Later, production instance (needs your own Stripe account in Billing Settings)
./scripts/apply-clerk-billing.sh --instance prod --apply
```

What the script does:

1. `clerk enable billing --for users` — turns on B2C Billing; creates `free_user`
2. Dry-run / apply `clerk/billing.desired.json` — Pro plan + `sync` feature

Dev instances use Clerk’s shared Stripe **test** gateway (no Stripe account).
Production requires connecting your Stripe account under
[Billing → Settings](https://dashboard.clerk.com/last-active?path=billing/settings).

If `config patch` rejects the JSON shape, open `clerk/billing.pulled.json`
(created by the script, gitignored), align field names, and re-run — or use Path B.

---

## Path B — Dashboard (manual)

1. Open [Billing → Settings](https://dashboard.clerk.com/last-active?path=billing/settings)  
   Enable Billing for **Users**. Confirm the development gateway in dev.
2. Open [Billing → Plans](https://dashboard.clerk.com/last-active?path=billing/plans) → **Plans for Users**.
3. Keep / confirm **Free** (`free_user`).
4. **Add Plan** → Pro  
   - Slug: `pro` (must match `PRO_PLAN_SLUG`)  
   - Publicly available: on  
   - Monthly: `$8.00`  
   - Annual: `$72.00` (or monthly equivalent `$6.00` if the UI asks that way)  
   - Free trial: off  
5. On the Pro plan → **Add Feature**  
   - Name: Cloud sync  
   - Slug: `sync` (must match `SYNC_FEATURE_SLUG`)  
   - Description: Save practice history, personal bests, and preferences across devices.  
   - Publicly available: on (so it appears on the pricing table)
6. Confirm Pro appears under **User** plans (wrong tab → empty `<PricingTable />`).

---

## Before taking real payments (cutover)

Do **not** charge customers while Hobby + Clerk **development** keys +
`NEXT_PUBLIC_AUTH_DISABLED=true` are still the production posture.

1. Custom domain on Vercel; Clerk production instance + `pk_live` / `sk_live`
2. Connect **your** Stripe account on the production Billing Settings page
3. Apply the same Pro/`sync` config to prod (`--instance prod` or Dashboard)
4. Unset `NEXT_PUBLIC_AUTH_DISABLED` and redeploy (README auth cutover checklist)
5. Confirm Vercel Hobby → commercial plan if you will charge (Hobby is non-commercial)

---

## Verify

```bash
# After enable + plans exist, list plans (Backend API; needs linked project)
npx clerk api /billing/plans
```

In the app (after WP1/WP4 code):

- `/pricing` shows Free + Pro
- `has({ feature: 'sync' })` is true only after a successful Pro checkout (test card)

Test cards: [Stripe testing](https://docs.stripe.com/testing)

---

## Files

| Path | Role |
|------|------|
| `lib/billing.ts` | Slugs + display prices + `canPersistFromEntitlements` |
| `clerk/billing.desired.json` | Desired PLAPI billing patch |
| `scripts/apply-clerk-billing.sh` | Enable + patch helper |
| `docs/subscription-page-plan.md` | Full freemium plan |
