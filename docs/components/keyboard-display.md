# Keyboard display

The on-screen piano: click, touch, or type (A W S E D…) to play without a MIDI controller.

- **Kind:** interactive
- **Category:** technique
- **Wiring:** accepts nothing, outputs nothing. Injects notes through the shared MIDI session (`pressVirtualNote`), so every drill, the audio host, and the free-play scope react to it exactly like hardware input.

## Justification

Fallback input device. It is what makes "Play now" work for visitors with no controller, and what lets free-play scope show anything on a fresh device.

## Configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `lowNote` | select | First key on the left (C1–C5) |
| `octaves` | range 1–4 | Keyboard width |
| `showNoteNames` | toggle | Letter names on the white keys |
| `computerKeys` | toggle | Play with the home-row mapping |
| `highlightScale` | select | Ring the keys belonging to this scale (`none` disables) |
| `highlightRoot` | select | Root of the highlighted scale |

## Highlighting

With `highlightScale` set, keys whose pitch class belongs to the scale get an accent ring — pair it with Free play scope so a beginner can see the shape they are improvising inside.

## Testing notes

- Key geometry lives in `lib/feature-blocks/keyboard-display/keys.ts` (pure, tested).
- The block accepts partial configs defensively: older saved pages without the highlight keys keep rendering.
