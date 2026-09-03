# Note roll

A Synthesia-style view: notes fall toward a hit line and you play them as they cross it.

- **Kind:** interactive
- **Category:** visualization
- **Wiring:** accepts `practiceNotes`, requires a `practiceNotes` source upstream (piece library, scale library, or chord library). Wiring validation reports an unmet requirement without one.

## Justification

A continuous time-scrolling view is a different visual language from one-target-at-a-time displays. Pieces and rhythm drills read better as a roll; merging it into the target display would make one `view` setting silently change what a page requires, which makes assembly harder for an agent to reason about.

## Configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `lookaheadMs` | range 500–5000 | How much time is visible above the hit line |
| `scrollSpeed` | range 100–600 | Pixels per second |
| `handFilter` | select | `both`, `left`, or `right` |
| `showNoteNames` | toggle | Label notes with their names |
| `waitMode` | toggle | Hold position until you play (phase-2 runtime) |

## Example pages

- Moonlight Sonata, movement 1: Piece library → Note roll → Transport
- Hanon No. 10: Scale library (custom cell) → Rhythm pattern (16ths) → Note roll

## Testing notes

- `lib/feature-blocks/note-roll/geometry.ts` is pure and unit tested: visibility windows, hit-line positions (at, above, passed), note height, and hand filtering.
- In the component library the roll animates the preview sequence; the phase-2 runtime will drive it from the page's source stream.
