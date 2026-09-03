# Target display

Shows the current practice target — the chord or note to play right now.

- **Kind:** interactive
- **Category:** technique
- **Wiring:** accepts `practiceNotes`, outputs nothing. Point any source (chord library, scale library, piece library) at it.

## Justification

The `chordSet`, `scaleRunner`, `rootCycle`, and `progression` blocks each implement a version of this display. Target display implements it once, generically, so any source can be practiced without writing a new block.

## Configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `view` | select | `symbols` (chord/note names) or `keysDiagram` (pitch classes on a keyboard) |
| `showNext` | toggle | Preview the upcoming target |
| `showPosition` | toggle | Show progress, e.g. "3 of 8" |

## Example pages

- Two-octave scale through the fourths: Scale library → Target display → Transport
- Rootless ii-V-I: Chord library (roman numerals) → Target display → Transport

## Testing notes

- `lib/feature-blocks/target-display/render-model.ts` is pure and unit tested: `buildSymbolView` and `buildKeysDiagramView` handle empty streams, the last target (no next), and the position string.
- The block renders preview data in the component library; runtime wiring lands with the phase-2 runtime.
