# Practice report

How this page has been going: reps, speed, grade split, and days practiced.

- **Kind:** interactive
- **Category:** progress
- **Wiring:** accepts nothing, outputs nothing. Reads Convex practice history for Pro and browser history for Free — the same split the drill runtime writes with.

## Justification

Metrics belong in the report, not scattered across the palette. The block was previously "Session stats"; it absorbs the reporting role for any page, including the clock- and source-driven pages this component model introduces.

## Configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `windowDays` | range 1–90 | Days of history to summarize |
| `showGrades` | toggle | Anki-style grade split |
| `showBest` | toggle | Fastest successful rep |
| `showDays` | toggle | Distinct days practiced in the window |

## Notes

- The block type id stays `sessionStats`, so existing saved pages keep working.
- Data shape agreement between Convex rows and local history rows is documented in `lib/session-stats.ts`.

## Testing notes

- Summary math (`lib/session-stats.ts`) is pure and unit tested.
- The block is covered by React Testing Library tests for the Convex and Free-tier paths.
