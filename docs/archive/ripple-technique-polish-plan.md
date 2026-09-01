# Ripple + Technique polish plan

> **Status: superseded.** This plan was drafted before the aspect-ratio work
> in `docs/chladni-ripple-wide-plan.md` and `docs/chladni-ripple-wide-report.md`.
> The actual shipped behavior is the opposite of the Chladni section below:
> `normalizeViewport` was **removed** from Pattern Lab, Ripple Lab, and the
> ambient `chladni-ripple` background so the pattern fills its container like
> the Welcome page. The Technique streak card was centered in a different
> layout (`grid grid-cols-[1fr_auto_1fr]`). Keep this file as a historical
> snapshot only; refer to the wide-plan docs and the current code for the
> shipped state.

## Goal
Fix two visual issues:
1. The Technique tracker streak card is off-center / the flame icon hugs the left edge.
2. The Chladni / Ripple visualization looks horizontally stretched on wide viewports.

## 1. Technique streak card centering

**File:** `components/drills/technique/technique-tracker.tsx`

**Current state (at time of original plan):**
```tsx
<Card className="flex flex-row items-center gap-4">
  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
    <Flame ... />
  </div>
  <div>
    <div ...>{streak}</div>
    <div ...>day streak</div>
  </div>
</Card>
```

The card left-aligns the icon + text group with `gap-4` and no horizontal padding.

**Fix (not implemented exactly as written):**
The shipped card uses a `grid grid-cols-[1fr_auto_1fr]` layout with the icon
in the first column (right-aligned), the number/label in the center column
(centered), and an empty third column. This keeps the content visually
centered without a pure flex wrapper. See the current
`components/drills/technique/technique-tracker.tsx` for the exact code.

## 2. Chladni / Ripple viewport stretching

### Background
`ChladniVisualization` has a `normalizeViewport` prop that keeps the shader domain square so the pattern does not stretch when the container is wide or tall.

- `ChladniRippleLab` already passes `normalizeViewport`.
- `ChladniLab` (Pattern Lab) does **not** pass it, so the pattern stretches horizontally on wide viewports.
- The Welcome page `ChladniBackground` intentionally does **not** pass it (previous fix), preserving the original full-viewport look.
- The ambient `AmbientRippleEffect` passes it.

### Likely cause of the "wide" look
The user is most likely seeing the **Chladni Pattern Lab** (`/tools/chladni`), which has no normalization and therefore stretches to fill the wide card.

### Plan (not implemented as written)

The original plan was to add `normalizeViewport` to `ChladniLab` so the
Pattern Lab matched the Ripple Lab. After user feedback and the investigation
in `docs/chladni-ripple-wide-report.md`, the project went the other direction:
`normalizeViewport` was removed from **both** Pattern Lab and Ripple Lab, and
from the ambient `chladni-ripple` background, so all three fill their
containers the same way the Welcome page does. The current code:

- `components/drills/chladni/chladni-lab.tsx` — does **not** pass
  `normalizeViewport`.
- `components/drills/chladni-ripple/chladni-ripple-lab.tsx` — does **not**
  pass `normalizeViewport`; card uses `aspect-[4/3] lg:aspect-[16/9]`.
- `components/ambient/ambient-effect-renderer.tsx` — `AmbientRippleEffect`
  does **not** pass `normalizeViewport`.

The "fit to viewport" toggle and hero-settings persistence discussed below
were not shipped.

### Files originally considered
- `components/drills/chladni/chladni-lab.tsx`
- `components/welcome/chladni-visualization.tsx`
- `lib/chladni-hero-settings.ts` / `lib/lab-patterns.ts`

## 3. Implementation order (historical)

This order was never executed as written. The aspect-ratio changes were
instead delivered through the work documented in
`docs/chladni-ripple-wide-plan.md` / `docs/chladni-ripple-wide-report.md`
and merged separately.

1. Technique streak card centering (small, safe).
2. Add `normalizeViewport` to Chladni Pattern Lab and verify visually.
3. Decide whether to add the fit-to-viewport toggle based on how (2) feels.
4. Update unit tests for any changed lab params / serialization.
5. Run gate: `npm run lint && npm run test:unit:run && npm run build`.
6. Push branch and open PR.

## 4. Open questions (answered by subsequent work)

- **Fit-to-viewport toggle?** Not shipped. The lab and ambient ripple simply
  fill the container.
- **Ambient Chladni background?** Also fills the container (no
  `normalizeViewport`), matching the Welcome page fill behavior.
