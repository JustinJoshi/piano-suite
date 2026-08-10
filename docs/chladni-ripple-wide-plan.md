# Plan: make Chladni Ripple match the Welcome page fill behavior

## Goal

Remove the "wide" / square-crop look from the Chladni Ripple Lab and the ambient `chladni-ripple` background so they fill their containers the same way the Welcome page Chladni background does.

## Background

- `ChladniVisualization` has a `normalizeViewport` prop.
  - `false` (default): pattern stretches to fill the container.
  - `true`: pattern is cropped to a centered square.
- The Welcome page (`ChladniBackground`) does **not** pass `normalizeViewport`, so it stretches to fill the full viewport.
- The Ripple Lab and ambient `chladni-ripple` background pass `normalizeViewport`, so they show a centered square pattern that looks small/empty on wide screens.

## Steps

### 1. Revert the Pattern Lab regression

Already done in the current branch: removed `normalizeViewport` from `components/drills/chladni/chladni-lab.tsx`.

Verification:
- `components/drills/chladni/__tests__/chladni-lab.test.tsx` still passes.

### 2. Update the Ripple Lab preview card

File: `components/drills/chladni-ripple/chladni-ripple-lab.tsx`

Changes:
- Remove `normalizeViewport` from the `<ChladniVisualization />` call.
- Change the container from:
  ```tsx
  <div className="relative aspect-square w-full bg-background sm:aspect-[4/3] lg:aspect-auto lg:min-h-[480px]">
  ```
  to:
  ```tsx
  <div className="relative aspect-[4/3] w-full bg-background lg:aspect-[16/9]">
  ```
  This makes the card fill the left column with a viewport-like aspect ratio instead of a square.

### 3. Update the ambient Chladni Ripple background

File: `components/ambient/ambient-effect-renderer.tsx`

Changes:
- In `AmbientRippleEffect`, remove `normalizeViewport` from the `<ChladniVisualization />` call.
- Keep `resolutionScale` passthrough unchanged.
- The float panel intentionally uses `resolutionScale={2}` and can keep `normalizeViewport` if desired, since it is a small pop-out panel rather than a full-page background.

### 4. Update tests if needed

- `components/drills/chladni-ripple/__tests__/chladni-ripple-lab.test.tsx` mocks `ChladniVisualization`, so prop changes will not break tests.
- `components/ambient/__tests__/ambient-effects-host.test.tsx` only checks that the background renders; no prop assertions needed.
- If any test asserts `normalizeViewport` specifically, update it.

### 5. Verify visually

- `/tools/chladni` — pattern should fill the card and no longer look vertically stretched.
- `/tools/chladni-ripple` — pattern should fill the preview card and look similar to the Welcome page background.
- `/` with the background set to Chladni Ripple — background should fill the viewport without a centered square crop.

### 6. Run the gate

```bash
npm run lint
npm run test:unit:run
npm run build
```

### 7. Update PR #37

- Commit the changes to the existing branch `kimi/ripple-technique-polish`.
- Push to update PR #37.
- The Preview URL will refresh; verify the three pages above.

## Out of scope

- Changing the Ripple Lab default params (zoom, thickness, softness). The current plan is only about aspect-ratio / fill behavior. A "Welcome match" preset can be added later if the user wants the soft atmospheric style in the lab.
- Refactoring the shader. The shader already supports both modes; we only need to change the props.
