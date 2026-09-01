# Chladni Ripple / Pattern Lab aspect-ratio report

## 1. What just broke (Pattern Lab)

The previous commit (`4d2505f`) added `normalizeViewport` to `components/drills/chladni/chladni-lab.tsx`. That prop forces `ChladniVisualization` to crop the shader domain to a centered square. On the Pattern Lab card the container is tall relative to its width at some breakpoints, so the pattern became vertically stretched / letter-boxed.

**Fix applied:** removed `normalizeViewport` from `ChladniLab` so it behaves exactly as before — the pattern fills the card and may stretch with the card aspect ratio.

## 2. How the shader handles aspect ratio

`components/welcome/chladni-visualization.tsx` fragment shader:

```glsl
vec2 uv = vUv * 2.0 - 1.0;
float aspect = uResolution.x / uResolution.y;
uv.x *= aspect;                 // scale x so the plate fills the viewport
vec2 p = uv;
if (uNormalizeViewport) {
  vec2 scale = vec2(max(aspect, 1.0), max(1.0 / aspect, 1.0));
  p /= scale;                   // undo the stretch → centered square plate
}
p *= uZoom;
```

- `normalizeViewport = false` (default): pattern stretches to fill the container. This is what the Welcome page uses.
- `normalizeViewport = true`: pattern is cropped to a centered square. This is what the Ripple Lab and ambient ripple currently use.

## 3. Why the Ripple Lab looks different from the Welcome page

| Element | Welcome page (`chladni`) | Ripple Lab (`chladni-ripple`) |
|---|---|---|
| Component | `ChladniBackground` → `ChladniVisualization` | `ChladniRippleLab` → `ChladniVisualization` |
| `normalizeViewport` | **false** | **true** |
| Container | fixed full-bleed `inset-0` | card in `lg:grid-cols-[1fr_420px]`; `aspect-square sm:aspect-[4/3] lg:aspect-auto lg:min-h-[480px]` |
| Zoom | 1.6 (hero default) | 2.2 (ripple default) |
| Line thickness | 48 | 28 |
| Line intensity | 0.5 | 0.45 (computed) |
| Color softness | 0.7 (very soft) | 0.15 (vivid) |
| MIDI reactivity | no | yes |

Two independent things make them look different:

1. **Aspect-ratio handling.** The Welcome page stretches to fill the viewport; the Ripple Lab crops to a square. On a wide screen the Ripple Lab therefore shows a small square pattern in a wide card, which reads as "wide" or empty on the sides.
2. **Default parameters.** The Welcome page is tuned to be soft atmospheric wallpaper (low zoom, thick lines, high softness). The Ripple Lab is tuned to be a reactive instrument display (higher zoom, thinner lines, vivid colors).

## 4. Options to make the Ripple Lab mirror the Welcome page

### Option A — Match the Welcome page fill behavior (recommended)

Remove `normalizeViewport` from `ChladniRippleLab` so the pattern fills the card and stretches with it, just like the Welcome page fills the viewport. Also adjust the card's aspect ratio to be closer to a desktop viewport so the proportions feel similar.

Pros:
- Matches the Welcome page visually.
- Simple change.

Cons:
- Pattern stretches on wide monitors (same as Welcome page, which the user has already accepted).
- Mobile still won't match because the lab card is square-ish while the phone viewport is tall.

Implementation sketch:

```tsx
// components/drills/chladni-ripple/chladni-ripple-lab.tsx
<div className="relative aspect-[4/3] w-full bg-background lg:aspect-[16/9]">
  <ChladniVisualization
    ...
    // remove normalizeViewport
    className="absolute inset-0 h-full w-full"
  />
</div>
```

### Option B — Add a "Match Welcome page" preset

Keep the current square crop, but add a preset that copies the Welcome page's hero defaults (`DEFAULT_HERO_CHLADNI_SETTINGS`) into the Ripple Lab params. This makes the pattern *style* match without changing the aspect ratio.

Pros:
- Keeps the square-crop behavior if that is desired elsewhere.
- One-click match.

Cons:
- Still doesn't look identical because aspect-ratio handling differs.

### Option C — Full-screen preview toggle

Add a button in the Ripple Lab that opens a full-screen overlay rendering the ripple exactly as the Welcome page would (full viewport, no normalize, hero defaults). This is the only way to get a true 1:1 match.

Pros:
- Perfect match.
- Doesn't change the normal lab layout.

Cons:
- More UI and state to maintain.
- Larger implementation.

## 5. Related ambient background question

The ambient `chladni-ripple` background (`components/ambient/ambient-effect-renderer.tsx`) also passes `normalizeViewport`. If the user sets the Welcome background to "Chladni Ripple", it will render as a centered square on a wide monitor, unlike the default "Chladni" background which stretches. This is probably part of the "looks wide" complaint.

If we want the ambient ripple to match the Welcome page too, we should remove `normalizeViewport` from `AmbientRippleEffect` as well. The float panel intentionally uses `resolutionScale={2}` to keep it crisp and can keep `normalizeViewport` if desired.

## 6. Recommended plan

1. **Immediate:** keep the Pattern Lab revert that was just applied.
2. **Ripple Lab:** remove `normalizeViewport` and adjust the preview card aspect ratio to `aspect-[4/3] lg:aspect-[16/9]` so it fills the card like the Welcome page.
3. **Ambient ripple:** also remove `normalizeViewport` from `AmbientRippleEffect` so the Welcome page background "Chladni Ripple" matches the default "Chladni" fill behavior.
4. **Optional follow-up:** add a "Welcome match" preset in the Ripple Lab that switches params to hero defaults (soft, thick lines, low zoom) so the user can toggle between the reactive lab look and the atmospheric welcome look.
5. Verify visually on `/tools/chladni-ripple` and `/` with the background set to Chladni Ripple.
