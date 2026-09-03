# Rhythm pattern

A transform that places incoming notes on a per-hand onset grid and scales note length.

- **Kind:** transform
- **Category:** rhythm
- **Wiring:** accepts `practiceNotes`, outputs `practiceNotes`, requires nothing. Needs an upstream source (scale library, chord library, piece library) to be meaningful — wiring validation reports an orphan transform without one.

## Justification

Timing is a property applied to content, not content itself. One generic transform turns any source into a rhythmic drill ("play this scale in swung eighths"), which replaces a family of per-source rhythm variants. The duration ratio also provides articulation (staccato ↔ legato) for free.

## Configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `leftPattern` | text | Binary onset grid for the left hand, e.g. `1010` |
| `rightPattern` | text | Binary onset grid for the right hand, e.g. `0101` |
| `barsPerCycle` | range 1–16 | Bars the pattern spans before repeating |
| `durationRatio` | range 0.1–1.0 | Note length: 0.1 staccato, 1.0 legato |

## Example pages

- Hanon No. 10: Scale library → Rhythm pattern (16ths) → Transport
- Quarters against halves: Chord library → Rhythm pattern (LH `1010`, RH `10001000`) → Transport

## Testing notes

- `lib/feature-blocks/rhythm-pattern/transform.ts` is pure and unit tested: `gridOnsets`, `assignOnsets`, `applyDurationRatio`, `transform`.
- `assignOnsets` preserves a source's own hand labels; the grid only fills notes that arrive without one.
- Duration is beat length × `durationRatio`, applied exactly once.
