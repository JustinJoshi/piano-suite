# Piece library

A source that turns an uploaded MIDI file into the page's practice stream.

- **Kind:** source (static supplementary)
- **Category:** technique
- **Wiring:** accepts nothing, outputs `practiceNotes`. Feed a note roll, target display, or rhythm pattern.

## Justification

Practicing real repertoire needs the piece's exact pitches and timing. This component is an **adapter** over the music player's shipped `parseMidiFile` primitive — no new MIDI decoding — so a piece, a hand-isolated part, or an accompaniment track all become page content.

## Configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `handFilter` | select | `both`, `left`, or `right` — practice one hand at a time |
| `role` | select | `graded` (your part) or `accompaniment` (backing, ungraded) |
| `transpose` | range −12–12 | Semitone shift for the whole piece |

## Notes

- The MIDI file is uploaded through the block and stays in component state; block config is JSON-only, so audio data never serializes into a saved page.
- Notes are adapted with `onsetMs`/`durationMs` from the file's timing, sorted by onset.
- **Hand assignment:** for files with two or more tracks the tile shows "Left hand track" / "Right hand track" selectors. Assignment is explicit user action — hands are never guessed from pitch. Selectors disable the track already claimed by the other hand, so a conflicting selection cannot be made. Assignments reset when a different file is uploaded and are never stored in the page config.
- When the page's `handFilter` targets a hand with no assigned track, the stream is empty and the tile shows an assignment prompt instead of implying filtering happened.

## Example pages

- Moonlight Sonata, movement 1: Piece library (graded, hand filter) → Note roll → Transport
- Pentatonic improvisation: Piece library (accompaniment loop) → Transport + Free play scope

## Testing notes

- `lib/feature-blocks/piece-library/adapt.ts` is pure and unit tested: note adaptation (including transpose), onset ordering, and the accompaniment marking.
