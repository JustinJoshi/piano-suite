# Ripple + Technique polish plan

## Goal
Fix two visual issues:
1. The Technique tracker streak card is off-center / the flame icon hugs the left edge.
2. The Chladni / Ripple visualization looks horizontally stretched on wide viewports.

## 1. Technique streak card centering

**File:** `components/drills/technique/technique-tracker.tsx`

**Current state:**
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

**Fix:**
- Wrap the icon, number, and label in a single centered flex row.
- Center that row inside the card with `justify-center` and add horizontal padding.

```tsx
<Card className="flex items-center justify-center px-6 py-4">
  <div className="flex flex-row items-center gap-4">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
      <Flame ... />
    </div>
    <div className="text-center">
      <div ...>{streak}</div>
      <div ...>day streak</div>
    </div>
  </div>
</Card>
```

## 2. Chladni / Ripple viewport stretching

### Background
`ChladniVisualization` has a `normalizeViewport` prop that keeps the shader domain square so the pattern does not stretch when the container is wide or tall.

- `ChladniRippleLab` already passes `normalizeViewport`.
- `ChladniLab` (Pattern Lab) does **not** pass it, so the pattern stretches horizontally on wide viewports.
- The Welcome page `ChladniBackground` intentionally does **not** pass it (previous fix), preserving the original full-viewport look.
- The ambient `AmbientRippleEffect` passes it.

### Likely cause of the "wide" look
The user is most likely seeing the **Chladni Pattern Lab** (`/tools/chladni`), which has no normalization and therefore stretches to fill the wide card.

### Plan
1. Add `normalizeViewport` to `ChladniLab` so the Pattern Lab matches the Ripple Lab.
2. Inspect the default `zoom` value on wide cards. Normalization keeps the domain square, but if the default zoom is too low the pattern can look small/centered with empty side margins. Adjust the default lab zoom if needed (current default is `2.33`).
3. Optionally expose a "fit to viewport" toggle in the lab so users can choose between:
   - `normalizeViewport = true` — square, unstretched pattern (default)
   - `normalizeViewport = false` — fill the container, may stretch
4. Keep Welcome page background non-normalized as already requested.

### Files to touch
- `components/drills/chladni/chladni-lab.tsx` — pass `normalizeViewport`, add toggle if desired
- `components/welcome/chladni-visualization.tsx` — no change unless we add the toggle prop support (already exists)
- `lib/chladni-hero-settings.ts` / `lib/lab-patterns.ts` — persist the toggle if we add it

## 3. Implementation order

1. Technique streak card centering (small, safe).
2. Add `normalizeViewport` to Chladni Pattern Lab and verify visually.
3. Decide whether to add the fit-to-viewport toggle based on how (2) feels.
4. Update unit tests for any changed lab params / serialization.
5. Run gate: `npm run lint && npm run test:unit:run && npm run build`.
6. Push branch and open PR.

## 4. Open questions

- Do we want a user-facing "fit to viewport" toggle, or is simply normalizing the Pattern Lab enough?
- Should the ambient Chladni background (when set via Atmosphere settings) also normalize, or stay full-bleed like the welcome page?
