# Section loop

A transform that keeps only the notes inside a bar window, rebases the window
to start at zero, and repeats it.

- **Kind:** transform
- **Category:** rhythm
- **Wiring:** accepts `practiceNotes`, outputs `practiceNotes`, requires nothing. Needs an upstream source (scale library, chord library, piece library) to be meaningful — wiring validation reports an orphan transform without one.

## Justification

Length is a property of the stream, not the source. Looping a window of bars over any source — most importantly an uploaded piece — is one generic transform instead of per-source section controls, and it composes before the displays so the note roll, targets, and clock all agree on the loop.

## Configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `startBar` | range 0–999 | First bar of the section (0-indexed) |
| `endBar` | range 1–1000 | Exclusive end: notes before this bar are kept |
| `repeats` | range 1–16 | How many times the section loops |

## Example pages

- Bars 9–16 of a piece: Piece library → Section loop (bars 9–16, repeats 4) → Note roll → Transport
- Drill one chord page section: Chord library → Section loop (bars 0–2, repeats 8) → Transport

## Testing notes

- `lib/feature-blocks/section-loop/transform.ts` is pure and unit tested: window selection at a boundary onset (start inclusive, end exclusive), rebasing to zero, repeated copies with correct offsets, an empty window returning `[]`, and `repeats: 1` as a plain slice.
- The bar window comes from `sectionRange` in `lib/feature-blocks/transport/clock.ts` — one source of truth for bar maths on the legacy time-only path.
- Streams carrying source musical metadata (parsed MIDI) select the window in *source* bars via `lib/midi-musical-time.ts` and are retimed to the practice BPM afterwards, so changing practice speed never changes which musical bars are selected. Practice-BPM selection only applies to legacy streams without metadata.
- Notes with no `onsetMs` pass through untouched at the front, in order.
