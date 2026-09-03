# Scale library

A source that generates scale runs in any key, span, direction, and pattern.

- **Kind:** source (static supplementary)
- **Category:** technique
- **Wiring:** accepts nothing, outputs `practiceNotes`. Feed a target display, note roll, or rhythm pattern.

## Justification

The scale runner hardcodes three patterns (straight, thirds, triads). This source generalizes them and adds the **custom cell** — a degree pattern like `1235` that repeats over the run. That absorbs entire technique-book exercises: Hanon No. 10 is one cell plus a transposition rule, not a page of hand-authored notes.

## Configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `scale` | select | Any of the 13 scale types from `lib/scales.ts` |
| `root` | select | Any of the 12 roots |
| `span` | select | `pentascale`, `octave`, or `twoOctaves` |
| `pattern` | select | `straight`, `thirds`, `triads`, or `custom` |
| `customCell` | text | Degrees like `1235`, used when pattern is `custom` |
| `direction` | select | `up`, `down`, or `upDown` |
| `hands` | select | `right`, `left`, or `both` |
| `loopCount` | range 1–12 | How many times the run repeats |
| `metronomeAdvanced` | toggle | One note per beat instead of event-advanced |

## Example pages

- Two-octave scale through the fourths: Scale library (major, 2 octaves, up-down) → Key cycle → Target display
- Hanon No. 10: Scale library (custom cell) → Rhythm pattern (16ths) → Transport

## Testing notes

- `lib/feature-blocks/scale-library/generate.ts` is pure and unit tested: `expandCell` (Hanon-style degree expansion), `parseCell`, and `generateScale` for built-in and custom patterns.
- Unknown scale ids produce an empty stream, never a throw.
