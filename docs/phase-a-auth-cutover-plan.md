# Phase A — Production Auth Cutover Plan

> **Parent:** [`docs/missing-features-plan.md`](./missing-features-plan.md)  
> **Status: planning** — ops-heavy cutover with a small optional code hardening PR.  
> **Researched against (2026):**
>
> - [Clerk — Deploy to production](https://clerk.com/docs/guides/development/deployment/production)
> - [Clerk — Deploy to Vercel](https://clerk.com/docs/guides/development/deployment/vercel)
> - [Clerk — Integrate Convex](https://clerk.com/docs/guides/development/integrations/databases/convex)
> - [Convex — Clerk auth](https://docs.convex.dev/auth/clerk)
> - [Convex — Hosting on Vercel](https://docs.convex.dev/production/hosting/vercel)
> - [Convex — Environment variables / preview defaults](https://docs.convex.dev/production/environment-variables)
> - Repo: `proxy.ts`, `convex/auth.config.js`, `components/ConvexClientProvider.tsx`, README Deploy section

---

## 1. Problem statement

Piano Suite is live on Hobby Vercel at `https://piano-suite.vercel.app` with:

| Current state | Why it’s wrong for “done” |
|---------------|---------------------------|
| Clerk **development** keys (`pk_test_` / `sk_test_`) on Production | Clerk **requires a custom domain** for production; `*.vercel.app` cannot host Clerk production ([Clerk Vercel docs](https://clerk.com/docs/guides/development/deployment/vercel)) |
| `NEXT_PUBLIC_AUTH_DISABLED=true` on Production + Preview | Opens every route (and skips chat allowlist). Escape hatch for bare-404s with Clerk-dev + missing `dev-browser` handshake (esp. Firefox ETP) |
| Convex prod may still validate against **dev** Frontend API URL | Works only while the browser also uses the same Clerk **development** instance |

App code already mitigates the bare-404 path: `proxy.ts` always passes `auth.protect({ unauthenticatedUrl })`. Cutover is about **environment + Clerk instance**, not rewriting the drill stack.

### Goal

1. Serve the app on a **custom domain**.
2. Use a Clerk **production** instance (`pk_live_` / `sk_live_`) on Vercel **Production**.
3. Point Convex **production** at the production Frontend API URL (`https://clerk.<your-domain>.com`).
4. Keep Vercel **Preview** on Clerk **development** keys (official pattern).
5. **Unset** `NEXT_PUBLIC_AUTH_DISABLED` on Production and Preview, then redeploy.
6. Confirm unsigned → `/sign-in` (not 404) and signed-in Convex sync in Chrome + Firefox.

---

## 2. Architecture (what must stay aligned)

```
Browser (custom domain)
  └─ ClerkProvider (@clerk/nextjs v7)  ← pk_live on Production / pk_test on Preview
       └─ ConvexProviderWithClerk     ← fetches Clerk JWT with aud "convex"
            └─ Convex backend
                 auth.config.js:
                   domain: process.env.CLERK_FRONTEND_API_URL
                   applicationID: "convex"
```

| Layer | Responsibility | Cutover touchpoint |
|-------|----------------|--------------------|
| `proxy.ts` | Route gate via `clerkMiddleware` + `auth.protect({ unauthenticatedUrl })` | Optional: add `authorizedParties` |
| `lib/auth-disabled.ts` | Bypass only if `NEXT_PUBLIC_AUTH_DISABLED === "true"` | Unset env; keep code |
| `convex/auth.config.js` | Issuer domain for JWT validation | Set **Convex** env per deployment (not Next `.env`) |
| `ConvexClientProvider` | `ConvexProviderWithClerk` + `useAuth` | No change expected |
| Clerk Dashboard | Users, JWT / Convex integration, Domains, DNS | Create **production** instance |
| Vercel env | Keys baked at build for `NEXT_PUBLIC_*` | Split Production vs Preview |
| Convex Dashboard | `CLERK_FRONTEND_API_URL` per deployment + preview **defaults** | Prod FAPI ≠ Preview FAPI |

**Naming note:** Clerk’s current Convex guide and this repo use `CLERK_FRONTEND_API_URL`. Older Convex docs also show `CLERK_JWT_ISSUER_DOMAIN` for the same issuer URL. **Do not rename** in this repo — keep `CLERK_FRONTEND_API_URL` everywhere Convex reads it.

**Important:** Next.js app code does **not** read `CLERK_FRONTEND_API_URL` at runtime. Setting it only on Vercel does nothing for JWT validation. It must be set on each **Convex** deployment (prod / preview defaults / local `npx convex env set`).

---

## 3. Correct env matrix (fixes README oversimplification)

Clerk + Convex docs recommend **different Clerk instances** for Production vs Preview — not live keys on both.

| Variable | Vercel Production | Vercel Preview | Local `.env.local` |
|----------|-------------------|----------------|--------------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_…` | `pk_test_…` | `pk_test_…` |
| `CLERK_SECRET_KEY` | `sk_live_…` | `sk_test_…` | `sk_test_…` |
| `NEXT_PUBLIC_AUTH_DISABLED` | **unset** / not `true` | **unset** | unset for normal work |
| `CONVEX_DEPLOY_KEY` | **Production** deploy key | **Preview** deploy key | n/a (use `npx convex dev`) |
| `NEXT_PUBLIC_CONVEX_URL` | Injected by `npx convex deploy` | Injected per preview deploy | Dev deployment URL |
| `ALLOWED_CLERK_USER_ID` | Prod Clerk user id | Dev Clerk user id (or same policy) | Dev user id |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` etc. | `/sign-in`, `/sign-up`, `/` fallbacks | same | optional |

| Convex env | Production deployment | Preview deployments (project default) | Dev deployment |
|------------|----------------------|----------------------------------------|----------------|
| `CLERK_FRONTEND_API_URL` | `https://clerk.<your-domain>.com` | `https://<slug>.clerk.accounts.dev` | same as local FAPI |

> Convex preview backends are **empty** each time. Set **Project → Environment variable defaults** for the Preview type so every new preview gets the **development** FAPI URL automatically ([Convex env docs](https://docs.convex.dev/production/environment-variables)).

---

## 4. Prerequisites (blockers)

Complete before flipping Production keys:

1. **Own a domain** you can attach to Vercel (Clerk forbids production on `*.vercel.app` because production needs DNS you control).
2. Access to edit DNS at the registrar (and Cloudflare “DNS only” / grey-cloud if proxied — orange-cloud breaks Clerk’s DNS checks).
3. Clerk Dashboard admin on the Piano Suite application.
4. Convex project admin (prod deploy key + preview deploy key already used by Vercel).
5. Vercel project admin.
6. Accept that Clerk **production users are a separate database** from development — you will sign up again (or invite yourself) on prod; `ALLOWED_CLERK_USER_ID` must be updated to the **production** `user_…` id.

This app uses **email + password only** (README). That means production cutover **does not** require third-party OAuth client credentials unless you later enable Google/Apple/etc. ([Clerk production — OAuth](https://clerk.com/docs/guides/development/deployment/production)).

---

## 5. Implementation steps

### Step A0 — Preflight (local / repo)

No production traffic yet.

1. Confirm bypass is **off** locally and auth e2e pass:
   ```bash
   # NEXT_PUBLIC_AUTH_DISABLED unset
   npx convex dev   # terminal 1
   npm run test:e2e # or at least:
   npx playwright test e2e/auth-protection.spec.ts e2e/chat-auth.spec.ts
   ```
2. Confirm `proxy.ts` still uses `unauthenticatedUrl` (do not remove).
3. Optional hardening PR (can ship before or with cutover docs):
   - Pass `authorizedParties` into `clerkMiddleware` for production origins (Clerk production guide recommends this to limit subdomain session abuse):
     ```ts
     export default clerkMiddleware(
       async (auth, request) => { /* existing protect logic */ },
       {
         authorizedParties: [
           "https://<your-domain>",
           "https://www.<your-domain>", // if used
           "http://localhost:3000",
         ],
       }
     );
     ```
   - Prefer driving the list from an env var (e.g. `CLERK_AUTHORIZED_PARTIES` comma-separated) so Preview can include `https://*.vercel.app` hostnames or omit the option in non-prod. **Do not** hard-code only the prod domain if Preview still uses the same build artifact without env differentiation — use Vercel env scoping.
4. Update README Deploy / cutover checklist to match the **env matrix in §3** (today it incorrectly suggests `pk_live` on Preview).

**Gate:** lint + unit + auth e2e green with bypass off.

---

### Step A1 — Attach custom domain on Vercel

1. Vercel → Project → Settings → Domains → add `yourdomain.com` (and `www` if desired).
2. Add the DNS records Vercel shows (A / CNAME / ALIAS).
3. Wait until Vercel shows the domain **Valid** with TLS.
4. Keep `piano-suite.vercel.app` as a secondary hostname temporarily for rollback, but treat the custom domain as canonical.

**Done when:** `https://yourdomain.com` loads the current (still bypassed / pk_test) deploy.

---

### Step A2 — Create Clerk production instance + DNS

Follow [Clerk Deploy to production](https://clerk.com/docs/guides/development/deployment/production). Agent-friendly alternative: `npx clerk@latest deploy` / `clerk deploy status` if the CLI is linked.

1. Clerk Dashboard → instance switcher → **Create production instance**.
   - Prefer **clone development settings** for password/email config.
   - **Does not copy:** SSO connections, Integrations, Paths — you must reconfigure Convex integration / JWT on production ([Clerk production docs](https://clerk.com/docs/guides/development/deployment/production)).
2. Domains: set the application domain to your custom domain.
3. Add **all** DNS CNAMEs Clerk lists (typically Frontend API, Accounts, and email/DKIM hosts). Copy targets from the Dashboard — do not invent them.
   - Cloudflare: set each to **DNS only** (grey cloud).
   - Propagation can take minutes to ~48h; Clerk re-checks automatically.
4. When the Dashboard enables it, click **Deploy certificates**.
5. Activate Convex on the **production** instance:
   - Dashboard → [Convex integration](https://dashboard.clerk.com/apps/setup/convex) → Activate, **or** JWT Templates → New → **Convex** (name exactly `convex`, `aud: "convex"`).
6. Copy production values:
   - Publishable key `pk_live_…`
   - Secret key `sk_live_…`
   - Frontend API URL → `https://clerk.<your-domain>.com` (production format per Clerk/Convex docs)
7. Paths / redirects: ensure sign-in `/sign-in`, sign-up `/sign-up`, after-auth fallbacks match the app (or rely on `NEXT_PUBLIC_CLERK_*` overrides already in Vercel).
8. Restrict Frontend API origins if offered (subdomain allowlist / allowed origins) to your custom domain (+ localhost for local against prod only if you intentionally do that — usually local stays on **development** instance).

**Done when:** Clerk production checklist is green; `https://clerk.<your-domain>.com` resolves; Convex JWT template exists on **production**.

---

### Step A3 — Point Convex production at production FAPI

Convex backends do **not** read Vercel/Next `.env` for auth config.

```bash
npx convex env --prod set CLERK_FRONTEND_API_URL 'https://clerk.<your-domain>.com'
```

Then sync auth config (any of):

```bash
npx convex deploy
# or wait for the next Vercel Production build that runs convex deploy
```

Verify in Convex Dashboard → Production → Settings → Environment Variables.

Also set **Project environment variable defaults** for Preview:

| Default for | Key | Value |
|-------------|-----|-------|
| Preview | `CLERK_FRONTEND_API_URL` | `https://<dev-slug>.clerk.accounts.dev` |

Dev deployment should already have the development FAPI URL (`npx convex env set` without `--prod`).

**Done when:** Prod Convex env shows production FAPI; Preview defaults show development FAPI.

---

### Step A4 — Split Vercel environment variables

In Vercel → Settings → Environment Variables, **edit each Clerk key’s environment scope** (do not leave one `pk_test` value applied to Production):

1. **Production only:** `pk_live_`, `sk_live_`.
2. **Preview (+ Development if used):** keep `pk_test_`, `sk_test_`.
3. Unset / delete `NEXT_PUBLIC_AUTH_DISABLED` on **Production and Preview** (or set to `false` — remember only the string `true` enables bypass, but prefer unset for clarity).
4. Keep `CONVEX_DEPLOY_KEY` split: Production key on Production, Preview key on Preview (already required; do not reuse prod key on Preview).
5. Update `ALLOWED_CLERK_USER_ID` on Production **after** you create your production Clerk user (Step A6).
6. Keep redirect URL vars (`NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, etc.).

`NEXT_PUBLIC_*` values are **compile-time** — you **must redeploy** after changes.

**Recommended order of deploys:**

1. Redeploy **Preview** first with bypass **off** and **pk_test** still — validates `unauthenticatedUrl` + real gating on `*.vercel.app` without touching prod users.
2. Then redeploy **Production** with `pk_live` + bypass off + custom domain.

---

### Step A5 — Clerk / hosting allowlists for the custom domain

On the **production** Clerk instance:

- Allowed origins / redirect URLs include `https://yourdomain.com` (and paths `/sign-in`, `/sign-up`, `/tools`, `/chat` as needed).
- Optionally keep `https://piano-suite.vercel.app` only if you still serve that hostname with **development** keys (if Production hostname still points at the same Vercel project with `pk_live`, do **not** expect `pk_live` to work cleanly on `*.vercel.app` — prefer redirecting vercel.app → custom domain).

On the **development** instance (for Preview):

- Keep `http://localhost:3000` and Preview `*.vercel.app` origins as today.

---

### Step A6 — Create production user + chat allowlist

1. Open `https://yourdomain.com/sign-up`, create the owner account on the **production** instance.
2. Clerk Dashboard (production) → Users → copy `user_…`.
3. Set Vercel Production `ALLOWED_CLERK_USER_ID` to that id; redeploy if chat should work immediately.
4. Convex `users` row is created on first authenticated mutation / `EnsureSignedInUser` — no manual Convex user seed required.

---

### Step A7 — Verification

#### Preview (bypass off, pk_test)

| Check | Expect |
|-------|--------|
| Unsigned `/tools` | Redirect to `/sign-in`, **not** bare 404 |
| Unsigned `/`, `/tools/chladni` | Public |
| Sign in → `/tools` | Tools hub loads; no application error |
| Firefox default ETP | Same as Chrome for redirect + post-login |
| Convex | Settings / tracking persist when signed in (preview deployment has its own empty DB) |

#### Production (custom domain, pk_live, bypass off)

| Check | Expect |
|-------|--------|
| Browser console | **No** “Clerk has been loaded with development keys” |
| Network | Clerk FAPI host is `clerk.<your-domain>.com`, not `*.clerk.accounts.dev` |
| Unsigned `/tools` | → `/sign-in` |
| Sign in → drill → play → Tracking | Events appear (Convex prod) |
| Theme / atmosphere | Sync when signed in |
| `/chat` | 401 unsigned; 403 unless `ALLOWED_CLERK_USER_ID` matches; 200 for owner |
| `NEXT_PUBLIC_AUTH_DISABLED` | Absent from Vercel Production |

#### Local regression

```bash
npm run lint
npm run test:unit:run
# bypass off:
npx playwright test e2e/auth-protection.spec.ts e2e/chat-auth.spec.ts
```

---

### Step A8 — Docs cleanup (same PR as hardening, or follow-up)

Update `README.md` Deploy section:

- Replace “Temporary auth bypass” with past-tense / remove.
- Fix cutover checklist: **Preview stays on `pk_test`**; only Production uses `pk_live`.
- Document production FAPI form `https://clerk.<domain>.com`.
- Document Convex `--prod` env set + Preview project defaults.
- Note production users ≠ development users.
- Point to this file from the post-v1 plan / Deploy section.

Update `docs/missing-features-plan.md` Phase A status → **shipped** when verification passes.

---

## 6. Optional code changes (checklist)

| Change | Required? | Notes |
|--------|-----------|-------|
| Keep `unauthenticatedUrl` in `proxy.ts` | **Yes (already done)** | Prevents bare 404 when protect fires |
| Keep `isAuthDisabled()` opt-in | **Yes** | Emergency escape; leave unset in prod |
| `authorizedParties` on `clerkMiddleware` | Recommended | Clerk production security guidance |
| Env-driven authorized parties | Recommended | Different Production vs Preview hosts |
| Rename Convex env to `CLERK_JWT_ISSUER_DOMAIN` | **No** | Stick with `CLERK_FRONTEND_API_URL` |
| Schema / Convex function changes | **No** | Auth contract already correct (`optionalUserId` / `ensureUserId`) |
| New dependencies | **No** | |

Suggested small PR before or during cutover:

1. `proxy.ts` — `authorizedParties` from env.
2. `.env.example` — document `CLERK_AUTHORIZED_PARTIES`.
3. README — env matrix + corrected cutover.
4. Unit test: parse authorized parties helper if extracted.

---

## 7. Rollback plan

If Production breaks after the live-key deploy:

1. **Immediate:** Vercel Production → set `NEXT_PUBLIC_AUTH_DISABLED=true` and/or restore `pk_test_` / `sk_test_` on Production → **Redeploy**. Site returns to previous (open) behavior.
2. **Convex:** leave prod FAPI as-is or set back to development FAPI **only if** the browser keys are development again — issuer must match the Clerk instance that minted the JWT.
3. **DNS / Clerk:** leave production instance in place; no need to delete it while debugging.
4. Prefer fixing allowlists / FAPI mismatch over long-term re-enabling bypass.

---

## 8. Failure modes & debugging

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Bare 404 on `/tools` | Missing `unauthenticatedUrl` or old deploy | Confirm `proxy.ts` + redeploy |
| Sign-in works, Convex never syncs | Convex `CLERK_FRONTEND_API_URL` wrong / missing; or auth.config not redeployed | `npx convex env --prod set …` then `npx convex deploy` |
| `useConvexAuth` stays false after Clerk login | Issuer / `applicationID` mismatch; JWT template missing on **that** Clerk instance | Re-activate Convex integration on prod; template name `convex`, aud `convex` |
| “Loaded with development keys” on custom domain | Vercel Production still has `pk_test_` | Scope keys correctly; redeploy |
| Preview Convex empty / no sync | Preview default env missing | Project defaults for Preview FAPI |
| Chat 403 after cutover | `ALLOWED_CLERK_USER_ID` still old **dev** user id | Update to production `user_…` |
| Clerk DNS stuck | Cloudflare proxied CNAME / CAA blocking LE/GTS | DNS only; check `dig example.com CAA` |
| OAuth errors | N/A if password-only | Only if social enabled without prod credentials |

Convex debugging tip ([Convex Clerk docs](https://docs.convex.dev/auth/clerk)): after login, if `useConvexAuth().isAuthenticated` is false, the backend auth config is wrong — not the React tree.

---

## 9. What this phase does **not** include

- Multi-user chat policy (Phase E) — owner allowlist remains until then.
- Migrating development Clerk users into production (manual re-signup / Clerk export tools if ever needed).
- MIDI / ambient / lab work (Phases B–D, F).
- Removing `isAuthDisabled` from the codebase (keep as break-glass).

---

## 10. Suggested execution order (summary)

```
A0  Preflight e2e + optional authorizedParties PR + README matrix fix
A1  Custom domain → Vercel (DNS + TLS)
A2  Clerk production instance + Clerk DNS + Convex JWT on prod instance
A3  Convex prod CLERK_FRONTEND_API_URL = https://clerk.<domain>.com
    + Preview project default = development FAPI
A4  Vercel env split; unset AUTH_DISABLED; Preview redeploy first, then Production
A5  Allowlists / redirects for custom domain
A6  Create prod user; update ALLOWED_CLERK_USER_ID
A7  Smoke + local auth e2e
A8  Mark Phase A shipped in docs
```

**First concrete action when executing:** run auth e2e with bypass off (A0), then acquire/attach the custom domain (A1). Do not set `pk_live` on Vercel until A1–A3 are done.
