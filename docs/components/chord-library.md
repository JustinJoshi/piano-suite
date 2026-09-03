# Chord library

A source that turns chord symbols or roman numerals into a chord stream.

- **Kind:** source (static supplementary)
- **Category:** theory
- **Wiring:** accepts nothing, outputs `practiceNotes`. Feed a target display, note roll, or rhythm pattern.

## Justification

Chord content is reusable across drills. The distinctive capability is **voicing**: rootless A (3-5-7-9) and rootless B (7-9-3-5) are different inversions with identical pitch-class sets, which the pitch-class scoring model cannot represent. This component carries the exact MIDI voicing.

## Configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `mode` | select | `set` (chord symbols) or `romanNumerals` (progression in a key) |
| `chords` | text | Symbols like `Cmaj7, Dm7, G7` (set mode) |
| `numerals` | text | Progression like `ii7 V7 Imaj7` (roman mode) |
| `keyRoot` | select | Key for the roman-numeral mode |
| `voicing` | select | `closed`, `rootlessA`, or `rootlessB` — rootless applies to 7th chords; triads stay closed |
| `showNext` | toggle | Preview the next chord downstream |
| `loopCount` | range 1–12 | How many times the stream repeats |

## Example pages

- Rootless ii-V-I in 12 keys: Chord library (roman numerals, rootless A) → Key cycle → Target display
- Quarters against halves: Chord library → Rhythm pattern → Transport

## Testing notes

- `lib/feature-blocks/chord-library/generate.ts` is pure and unit tested. The key assertions: rootless A and rootless B produce **different MIDI arrays** for the same chord with the **same pitch-class set**, and triads fall back to closed position.
- Unparseable symbols are skipped, never thrown.
