# Important Notices

Standing notices that must be acted on. Items here block launch or carry
legal/financial risk — treat them as higher priority than feature work.

---

## ⚠️ LEGAL BLOCKER — child privacy (COPPA) + music rights — before public launch

**Status: OPEN — flagged 2026-08-29 by the OpenExecutive committee review.
Do NOT announce publicly until every item below is done.**

Piano Suite is a *mixed-audience* product (piano instruction plausibly
attracts children). The FTC judges "child-directed" by **subject matter and
design, not intent**. COPPA penalties run ~$53K per violation, and the
strengthened COPPA rules take full effect **April 2026**.

### Required before public launch

1. **Age gate.** Birthdate check at signup on a neutral screen, firing
   *before* PostHog/Sentry load (no tracking of under-13 visitors).
2. **Music rights audit.** Audit every MIDI file and song arrangement.
   Self-made MIDI does not cure this — arrangements are derivative works.
   Music publishers are the most likely source of a month-one takedown.
3. **Privacy policy pass.** Name PostHog, Sentry, and Convex as processors;
   add data-retention and a deletion path; enable Sentry PII scrubbing;
   audit PostHog autocapture for form-field leakage. Also required by
   Google's API policy once Google sign-in is live.
4. **Counsel review.** Budget a $1–3K fixed-fee privacy review of the age
   gate and policy; confirm the app operates under an LLC before public
   users arrive.

### Context

Source: OpenExecutive committee review, 2026-08-29 (full response in
session history). Related launch sequence lives in
`docs/go-live-runbook.md`; the committee's recommended order is:

> legal items above → soft launch to 10–30 friendly users → staged public
> launch (HN → Product Hunt → Reddit). No new Workshop features until
> launch is behind us.
