# Subscription / Pricing Page — Plan

> **Status: proposed.** Research + information architecture only. No billing
> code ships in this doc. For current product surface see `README.md`,
> `DESIGN-PRINCIPLES.md`, and the welcome layout under `components/welcome/`.

## Goal

Add a marketing-facing **subscription page** where visitors can understand
plans, compare Free vs paid access, and start checkout — without breaking the
welcome hero’s composition rules or the token-driven theme system.

## Product context (today)

| Fact | Implication for pricing |
|------|-------------------------|
| Auth is Clerk; Convex holds user data | Prefer **Clerk Billing (B2C)** over a second Stripe Billing stack |
| Welcome `/` and Pattern Lab are public; tools/articles/chat are gated | Pricing must be **public** so unsigned visitors can evaluate before signing up |
| Hero is a full-viewport math atmosphere + sparse copy | Pricing must **not** live in the first viewport |
| Navbar = marketing; `/tools/*` + `/settings/*` = dashboard shell | Pricing is a **marketing** page (`Navbar`), not a `DrillShell` tool |
| Navbar CTA is “Try it free” (sign-up) | Paid conversion should sit **downstream** of value explanation, not replace trial |

There is no pricing/billing surface yet (`PricingTable`, Stripe, or plan
entitlements). Chat is currently owner-allowlisted, not a general paid feature.

---

## UX research summary

Sources: 2026 SaaS pricing UX patterns (decision architecture, CRO), music-learning
app paywalls (Musora, Practito, Piano Marvel, Simply Piano), and Clerk Billing
guidance (dedicated pricing page + `PricingTable`).

### What converts

1. **Answer three questions in ~5 seconds:** who is this for, what does it cost,
   what do I get.
2. **2–3 plans max.** More tiers → decision paralysis. For a solo piano practice
   app, **Free + Pro** (optional annual vs monthly on Pro) beats a three-column
   “Starter / Pro / Enterprise” spreadsheet.
3. **One recommended plan.** Badge + stronger border/CTA on the paid (or
   annual) option; earn the recommendation with a clear “for whom” line.
4. **Monthly ↔ annual toggle.** Default monthly; surface annual savings when
   toggled (“Save X%”) so annual feels like a discount, not the baseline.
5. **Risk reversal next to the CTA**, not in the footer: cancel anytime, what
   happens after trial, no surprise charges.
6. **Progressive disclosure.** 4–6 decision features on the cards; deeper
   comparison or FAQ below. Avoid 20-row tables above the fold.
7. **Dedicated page.** Clerk recommends a standalone pricing route. Embedding a
   full checkout UI in the welcome scroll fights the existing narrative arc.
8. **Match CTA to buying motion.** Self-serve B2C → “Start Pro” / “Subscribe”,
   not “Talk to sales”. Unsigned users hit sign-up, then checkout.

### Music-app patterns that fit this product

| Pattern | Fit for Piano Suite |
|---------|---------------------|
| **Freemium** (limited free forever) | Strong — Pattern Lab + a taste of drills already teach value without a hard wall |
| **Trial → hard paywall** (Musora-style) | Weak for v1 — the app’s identity is “blocked practice / Anki verified,” not content library FOMO |
| **Annual anchoring** | Strong — use monthly vs annual on the paid plan, highlight annual |
| Soft paywall after value | Strong — welcome page educates first; pricing is the decision step |

### Anti-patterns to avoid here

- Pricing cards, badges, or plan chips **inside the hero** (violates
  `DESIGN-PRINCIPLES.md` §8 hero budget and the frontend design rules).
- Dashboard-style sidebar on the pricing route (wrong shell).
- Six identical “Buy now” buttons with no recommended plan.
- Hard-coded hex / purple-on-white SaaS clichés — use theme tokens only.
- Gating Pattern Lab or the public welcome atmosphere behind pay (kills the
  brand demo).

---

## Placement map (relative to the welcome page)

### Current welcome vertical structure

```
┌ sticky Navbar ──────────────────────────────────────────┐
│  Brand · Tools · Articles · Chat · [Sign in | Try free] │
└─────────────────────────────────────────────────────────┘
┌ Hero (min-h-svh) ───────────────────────────────────────┐
│  eyebrow · headline · one sentence · “Enter the drill”  │
│  (full-bleed atmosphere behind; hero-scrim pocket)      │
└─────────────────────────────────────────────────────────┘
  01 memory science
  02 Anki / FSRS
  03 motor memory
  04 Anki ↔ MIDI loop (FlowSection)
  05 jazz practice tradition
  06 companion decks (downloads)
┌ Bottom CTA ─────────────────────────────────────────────┐
│  “Enter the drill” + Anki/MIDI prerequisite             │
└─────────────────────────────────────────────────────────┘
  Footer
```

### Recommended placement (do / don’t)

| Surface | Action | Why |
|---------|--------|-----|
| **Hero first viewport** | **Do not** add pricing | Hero budget is brand + one CTA. Pricing here reads as a second product |
| **Navbar** | Add **Pricing** link | Expected discovery path; keeps Tools/Articles/Chat intact |
| **After feature 06, before bottom CTA** | Optional thin **“Plans” teaser** (one headline + one sentence + link to `/pricing`) | Value story is complete; buyer is ready to decide without leaving the scroll entirely |
| **Bottom `CtaSection`** | Keep primary “Enter the drill”; add secondary text link **See plans** | Dual path: practice now vs evaluate paid |
| **Dedicated `/pricing`** | **Primary subscribe surface** | Clerk + CRO consensus; room for toggle, FAQ, risk reversal |
| **`/settings/billing` (signed-in)** | Manage / cancel / change plan | Account ownership, not marketing |
| **Tools sidebar** | Soft “Upgrade” only when a gated action fails | Contextual, not a second marketing page |

### Information architecture diagram

```mermaid
flowchart TD
  Welcome["/ Welcome hero + features 01–06"]
  Teaser["Optional plans teaser before bottom CTA"]
  BottomCTA["Bottom CTA: Enter drill · See plans"]
  Nav["Navbar → Pricing"]
  Pricing["/pricing public marketing page"]
  SignUp["/sign-up if unsigned"]
  Checkout["Clerk Billing checkout"]
  Tools["/tools drills"]
  Billing["/settings/billing manage"]

  Welcome --> Teaser --> BottomCTA
  Welcome --> Nav
  Nav --> Pricing
  BottomCTA -->|"See plans"| Pricing
  BottomCTA -->|"Enter the drill"| Tools
  Pricing -->|"Subscribe / Start Pro"| SignUp
  SignUp --> Checkout
  Pricing -->|"already signed in"| Checkout
  Checkout --> Tools
  Tools -->|"manage plan"| Billing
  Billing --> Checkout
```

### Route & shell decisions

| Route | Public? | Shell | Role |
|-------|---------|-------|------|
| `/pricing` | **Yes** (add to `proxy.ts` public list) | `Navbar` + marketing main (same atmosphere language as `/`) | Browse plans + start checkout |
| `/subscribe` | Optional alias → redirect to `/pricing` | — | Friendly URL if desired |
| `/settings/billing` | No (auth required) | Dashboard shell like theme/atmosphere | Manage subscription |
| Welcome inline teaser | On `/` | Existing welcome composition | Soft funnel only |

---

## Proposed `/pricing` page composition

One job per section. Cards are allowed here because they are the **interaction
container** for choosing a plan.

1. **Compact page hero** (not `min-h-svh`)
   - Fraunces heading: who it’s for (solo pianists drilling with Anki + MIDI)
   - One supporting sentence
   - No plan grid in this block if it crowds mobile; otherwise headline + toggle
     can share the first screen

2. **Billing period toggle** — Monthly / Annual (show savings on Annual)

3. **Plan cards (2)**
   - **Free** — Pattern Lab, limited practice taste, local-only or account with
     capped persistence (exact entitlements TBD in implementation phase)
   - **Pro** (recommended) — full drills, Convex sync / tracking, theme +
     atmosphere sync, future paid features
   - Each card: for-whom line, price, 4–6 bullets, CTA, risk line under CTA

4. **Trust / risk strip** adjacent to cards  
   Cancel anytime · Works with your Anki deck · MIDI keyboard required for drills

5. **Short comparison** (optional, collapsed on mobile) — only features that
   differ between Free and Pro

6. **FAQ (5–8)** — cancel, trial vs free forever, AnkiConnect still required?,
   what if I only want Pattern Lab?, student/educator?, refunds (Clerk Billing
   limitations), currencies (USD today)

7. **Secondary CTA** — back to Tools or “Enter the drill”

Footer can reuse the welcome footer line or a slim variant.

### Styling constraints (must follow)

- Tokens only: `bg-card`, `text-primary`, `border-border`, `ring-primary`, etc.
- Typography: Fraunces for page/plan titles; Inter for body; Geist Mono only for
  prices/timers if it matches existing stat treatment
- Surfaces: `rounded-xl` / `rounded-2xl` cards with `border border-border` /
  `ring-1 ring-foreground/10` — same language as `FeatureSection` cards
- CTAs: `rounded-full` primary pills (matches hero / navbar)
- Atmosphere: prefer the same fixed ambient background + light scrim as welcome
  so `/pricing` feels like the same instrument, not a white SaaS insert
- Do **not** invent a purple gradient or cream-serif look; stay on the warm dark
  studio palette from `DESIGN-PRINCIPLES.md`

### Clerk UI theming note

`PricingTable` is the fastest path to checkout. If the default Clerk chrome
fights the theme, wrap it in a token-styled shell first; if still off-brand,
use custom plan cards that call Clerk’s checkout APIs / components while keeping
plan definitions in the Clerk Dashboard.

---

## Pricing model recommendation (research)

### What this product actually is

Piano Suite is **not** a mass-market lesson library (Simply Piano / Musora). It is a
**niche utility** for pianists who already have Anki + a MIDI keyboard:

| Trait | Implication for pricing |
|-------|-------------------------|
| Small, educated audience (jazz / theory drillers) | Freemium needs *huge* volume to work on conversion % alone — you won’t get Simply Piano scale |
| High setup friction (AnkiConnect + MIDI) | Hard trial cutoffs punish users still wiring hardware |
| Core loop is client-side Web MIDI | Marginal cost of a free practicer is low until they sync |
| Sticky value is **history / PBs / streaks across devices** | Natural paid wedge already exists as `canPersist` vs local |
| No song/content FOMO | Musora-style hard paywall is the wrong psychology |
| Solo tool, weak network effects | Pure freemium-for-virality doesn’t apply |
| Chat is owner-allowlisted + LLM-costly | Do **not** hang v1 Pro on Chat |

### Models considered

| Model | Fit | Why |
|-------|-----|-----|
| **Hard free trial → paywall** (Musora) | Poor | Content-library FOMO; kills habit during Anki/MIDI setup |
| **Pure paid / no free** | Poor | Hardware + Anki already filter hard; adding pay before “aha” shrinks funnel to near zero |
| **Classic freemium** (Free forever limited + Pro) | **Good** | Matches architecture; Piano Marvel pattern; keeps non-payers practicing |
| **Opt-in free trial of Pro only** | Mediocre alone | Higher trial→paid %, but after expiry users leave forever — bad for a habit tool |
| **Reverse trial → Free forever** | **Best hybrid** | Full Pro for 7–14 days on signup, then land on Free; users *felt* sync before upgrade |
| **One-time / lifetime** | Weak as primary | Fits musician “buy a tool” instinct, but Convex + future AI are ongoing costs; Clerk Billing is subscription-first. Offer later as promo, not v1 spine |
| **Usage / seat / org billing** | Poor for v1 | Solo B2C product |

### Verdict

**Ship: Freemium (Free forever + Pro subscription), optionally with a 7–14 day reverse trial of Pro on first signup.**

Why this beats alternatives for *this* app:

1. **The paid product is sync + continuity**, not “more songs.” That maps cleanly to Free = local practice, Pro = Convex history / cross-device / full tracking — the split the codebase already has (`canAccess` vs `canPersist`).
2. **Niche + setup friction** means you must leave a durable free path after any trial, or you churn people mid-onboarding. Reverse trial → Free forever does that; a hard wall does not.
3. **Market analogs:** Piano Marvel uses freemium (useful free tier, pay for depth). Anki itself monetizes **sync** (AnkiWeb), not flashcards — the closest conceptual cousin to Piano Suite’s Pro wedge.
4. **Economics:** Client-side drills are cheap; you pay Convex mainly when users persist. Gate *persistence and multi-device continuity*, not the ability to play a chord once.
5. **Price positioning:** Charge like a **practice utility**, not a curriculum app. Simply Piano / Musora sit ~$15–30/mo for libraries. Indie sync tools sit lower. Target band for Pro: about **$5–10/mo or ~$40–80/yr** (exact numbers TBD) — enough to matter, not “another Simply Piano.”

### What Free vs Pro should mean (decisive packaging)

Prefer **full local drills on Free** over “one mode only.” Limiting drill *modes* before the user finishes MIDI/Anki setup creates false “broken app” signals. Limit what they **keep**.

| Capability | Free (forever) | Pro |
|------------|----------------|-----|
| Welcome + Pattern Lab | ✓ | ✓ |
| Companion Anki deck downloads | ✓ | ✓ |
| All core drills (chord, arpeggios, progression, root cycling, technique) | ✓ **local-only** | ✓ |
| Tracking / PBs / miss history | Browser-local or session | **Synced** (Convex) |
| Theme + atmosphere prefs | localStorage | **Synced** |
| Cross-device restore | ✗ | ✓ |
| Articles | Prefer **public or Free** (marketing) | ✓ |
| AI Chat | Stay owner-only until productized | Not a v1 Pro pillar |

Upgrade moment copy: *“Your reps are staying on this browser. Unlock Pro to keep personal bests and history across devices.”* — not *“Buy more drills.”*

### Optional Phase 1.5 — reverse trial

On first account creation, grant Pro features for **14 days** (no card required). When it ends, silently continue as Free (local drills still work). Prompt upgrade only when they hit a sync-worthy action (view Tracking across sessions, new device, export/import). This is the 2026 “reverse trial” pattern adapted to a habit product.

### Explicit non-recommendations

- Do **not** use a Musora-style hard paywall before any practice.
- Do **not** make Pattern Lab or the welcome atmosphere paid (they are the demo).
- Do **not** sell Chat as Pro until the allowlist and cost model change.
- Do **not** lead with lifetime pricing until subscription retention is proven.

Prefer **value-based** bullets (“Sync practice history across devices”) over
feature dumps (“Access Convex `practiceEvents`”).

---

## Technical architecture (when implementing)

### Billing provider

**Clerk Billing for B2C** — already on `@clerk/nextjs`, Stripe under the hood for
payments, Plans/Features configured in Clerk Dashboard. Annual plans supported.
Known limits to surface in FAQ/copy: USD-only today, no built-in VAT, refunds via
Stripe not reflected in Clerk MRR, no 3DS (relevant for some EU renewals).

### File layout (proposed)

| Concern | Path |
|---------|------|
| Public pricing page | `app/pricing/page.tsx` |
| Page sections | `components/pricing/*` (hero, plan-grid, faq, teaser) |
| Welcome teaser | `components/welcome/pricing-teaser.tsx` (optional) |
| Manage billing | `app/settings/billing/page.tsx` |
| Entitlement helpers | `lib/billing.ts` + `hooks/usePlanAccess.ts` |
| Public route | `proxy.ts` — add `/pricing` |
| Nav | `components/navbar.tsx` — Pricing link |
| Docs | README + this plan |
| Tests | unit for entitlement helpers; e2e that `/pricing` is public |

### Hotspots (single-writer awareness)

- `proxy.ts` (public routes)
- `components/navbar.tsx`
- `components/welcome/welcome-page.tsx` / `cta-section.tsx` (teaser + secondary CTA)
- Possibly `components/tools/sidebar.tsx` for upgrade affordance
- `README.md` / auth tables
- **Not** required for v1 UI: `convex/schema.ts`, `package.json` (unless enabling
  a Clerk Billing feature flag / new package), `app/globals.css` (only if new
  semantic tokens are needed for plan badges)

### Auth & entitlement flow

1. `/pricing` public — browse without login.
2. Subscribe CTA → if signed out, sign-up with return to checkout / pricing.
3. After active Pro subscription, `has()` / Clerk plan checks gate paid
   capabilities in tools (and optionally Convex mutations).
4. Queries still use `optionalUserId`; never throw from root providers when a
   plan check is missing.
5. `NEXT_PUBLIC_AUTH_DISABLED` bypass: decide explicitly whether billing checks
   are skipped in that mode (recommend: skip gates when bypass is on, for local
   Hobby parity).

### Out of scope (v1)

- B2B / Organizations billing
- Custom enterprise quotes
- Tax/VAT UI
- Replacing Clerk with raw Stripe Billing
- Hard-paywalling the welcome hero or Pattern Lab
- Moving Chat off the owner allowlist solely because Pro exists

---

## Implementation phases

### Phase 0 — Decisions (this plan)

- [x] UX research + placement map
- [ ] Owner confirms Free vs Pro entitlements and price points
- [ ] Owner confirms Clerk Billing vs custom Stripe

### Phase 1 — Marketing surface (no hard gates yet)

- Public `/pricing` page styled to design system
- Navbar + welcome secondary links / optional teaser
- Clerk `PricingTable` (or custom cards) wired to Dashboard plans
- `/settings/billing` manage entry for signed-in users

### Phase 2 — Entitlements

- `lib/billing` helpers + soft upgrade UI when a Pro-only action is hit
- E2E: public `/pricing`, signed-in checkout smoke (test mode), gate behavior

### Phase 3 — Polish

- Annual default A/B later if needed
- FAQ copy from real support questions
- Appearance tuning so Clerk checkout matches theme tokens

---

## Success criteria

- First welcome viewport unchanged in spirit: brand, one headline, one sentence,
  one primary drill CTA, atmosphere intact.
- Visitors can reach pricing from navbar and from below the value story without
  hunting.
- Pricing page answers who / cost / what-you-get above the fold on mobile.
- All colors come from theme tokens; page still looks correct on every preset.
- Unsigned users can view `/pricing` with auth enabled (no bare 404).

## Open questions for the owner

1. Exact Free vs Pro feature split and monthly/annual prices?
2. Free forever with limits, or free trial of Pro?
3. Should Articles stay auth-gated, or become a Free marketing channel?
4. Is Chat ever a Pro feature, or stay owner-only?
5. Clerk Billing appearance: stock `PricingTable` first, or custom cards from day one?
