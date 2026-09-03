# Transport

The page clock. One Transport per page owns tempo, meter, count-in, looping, tempo ramps, and the audible tick.

- **Kind:** interactive
- **Category:** rhythm
- **Wiring:** accepts nothing, outputs nothing, requires nothing. Its presence is meaningful: a page with a Transport is *clock-advanced*, a page without one is *event-advanced*.

## Justification

Every timed practice page needs a single master clock, and a clock needs controls a user can operate directly. Centralizing the mode decision here (clock vs. event advanced) keeps display components free of mode switches.

## Configuration

| Field | Type | Range | Meaning |
| --- | --- | --- | --- |
| `bpm` | range | 30–300 | Tempo in beats per minute |
| `beatsPerBar` | select | 2–12 | Meter |
| `countInBars` | range | 0–8 | Bars of tick before practice starts |
| `loopEnabled` | toggle | — | Repeat the selected bar range |
| `loopStartBar` / `loopEndBar` | range | 0–128 | Loop boundaries in bars |
| `rampEnabled` | toggle | — | Ramp the tempo during practice |
| `rampTargetBpm` | range | 30–300 | BPM the ramp reaches |

## Example pages

- Hanon No. 10: Transport (ramp 60→120) + Note roll + Practice report
- Daily sight-reading: Transport (count-in, continuous) + Target display

## Testing notes

- Pure clock math (`lib/feature-blocks/transport/clock.ts`) is unit tested: `beatsToMs`, `msToBeat`, `sectionRange`, `rampTempo`, `beatInBar`, `barNumber`.
- The block component is covered with React Testing Library, including the controlled-BPM path.
- The audible tick goes through `hooks/useAudio.ts`; the block contains no Web Audio code.
