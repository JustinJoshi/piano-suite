<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Primitive Layer Conventions

This project extracts shared capabilities from the original Reflex Drill HTML apps into reusable primitives. When building or migrating practice tools, follow these rules.

## Where primitives live

| Directory | Purpose |
|-----------|---------|
| `lib/music-theory.ts` | Note names, pitch classes, chord parsing, chord building, quality definitions |
| `lib/scoring.ts` | Comparing held MIDI notes to target pitch-class sets and sequences |
| `lib/anki.ts` | Typed AnkiConnect HTTP client and helpers |
| `hooks/useMidi.ts` | Web MIDI access, device list, selected input, held notes |
| `hooks/useAudio.ts` | Web Audio chimes, ticks, metronome |
| `hooks/useDrillTimer.ts` | Generic drill timer state machine |
| `hooks/useAnkiSync.ts` | Poll Anki for current card and parse its chord |
| `components/drills/drill-shell.tsx` | Shared layout wrapper for every tool page |

## Rules for tool pages

1. **Use the primitives.** Do not add new inline Web MIDI, Web Audio, or AnkiConnect code. If a tool needs behavior the primitives don't support, extend the primitive layer first.
2. **Wrap every tool page in `DrillShell`.** Keep the page component thin; the actual drill logic belongs in a component under `components/drills/<tool-name>/`.
3. **Log practice events to Convex.** The `practiceEvents` and `missEvents` tables are the source of truth for tracking. Do not store drill history only in component state or localStorage.
4. **Keep Anki integration optional.** All Anki features must degrade gracefully when AnkiConnect is not running.
5. **Add unit tests for pure logic.** Chord parsing, scoring, and Anki client behavior must be tested with Vitest. Hook behavior should be tested with React Testing Library.

## Naming conventions

- Pure utility files: `lib/<domain>.ts`
- React hooks: `hooks/use<CamelCase>.ts`
- Drill components: `components/drills/<kebab-case>/<PascalCase>.tsx`
- Tests: co-located in `__tests__` directories next to the code under test

## Testing

- Unit tests: `npm run test:unit:run`
- E2E tests: `npm run test:e2e`
- All new primitives must have unit tests before a tool migration is considered complete.
