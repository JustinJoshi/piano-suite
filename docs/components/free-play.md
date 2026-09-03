# Free play scope

No targets, no grading: a live readout of what the player is playing right now.

- **Kind:** interactive
- **Category:** visualization
- **Wiring:** accepts nothing, outputs nothing. Reads the shared MIDI session directly — hardware keyboards and the on-screen keyboard both feed it.

## Justification

Improvisation has no misses. If the runtime's only vocabulary is target/hit/miss, an entire category of practice — and the creativity pillar of the app — has no representation. This block characterizes playing instead of grading it: the cheapest of the runtime modes, and the one that makes the Workshop welcoming to beginners noodling for the first time.

## Configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `scale` | select | Which scale counts as "in" for the in-scale readout |
| `root` | select | Scale root |
| `windowSeconds` | range 5–120 | Rolling window for density and note count |

## Readouts

- **In-scale share** — percentage of held pitch classes inside the scope scale
- **Notes per second** — density over the rolling window
- **Range** — lowest to highest note currently held
- **Note spread** — histogram of recently played pitch classes

## Example pages

- Pentatonic improvisation: Scale library (as scope) + Piece library (accompaniment loop) → Transport → Free play scope + keyboard display (highlighting the same scale)

## Testing notes

- `lib/feature-blocks/free-play/analysis.ts` is pure and unit tested: `inScaleRatio`, `pitchRange`, `notesPerSecond`, `pcHistogram`, `scalePcsFor`.
- The block subscribes to the session store's `midi-note-on` window events; it introduces no MIDI code of its own.
