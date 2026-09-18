# Song player

The existing music player, demoted into a Workshop block. Upload a MIDI or audio file and play it back through the piano sound while you follow along on the same page.

- **Kind:** interactive
- **Category:** technique
- **Wiring:** accepts nothing, outputs nothing, requires nothing. It drives the global music player (playback and `music-note-on`/`music-note-off` events survive route changes); it does not read the page stream.

## Justification

Theme 2 of `docs/NORTH-STAR.md`: demote, don't delete. The player was already a standalone widget mounted in the Ripple Lab; wrapping it — never forking it — gives any practice page its own playback with one block. The block consumes the root `MusicPlayerProvider` via `useMusicPlayer()` and mounts no provider of its own.

## Configuration

| Field | Type | Meaning |
| --- | --- | --- |
| `showUpload` | toggle | Show the upload / replace controls inside the block |
| `startPaused` | toggle | Do not auto-play when a file finishes loading (default: on) |

## Example pages

- Learn a piece, one section at a time: Piece library + Section loop + Note roll + Song player
- Listen-first practice: Song player (start paused) + On-screen keyboard

## Testing notes

- The block component is covered with React Testing Library (`components/feature-blocks/__tests__/song-player-block.test.tsx`), mocking `@/hooks/useMusicPlayer` and `@/hooks/useAudioSettings` exactly as the player's own test does.
- The shared `MusicPlayer` component gains only optional props (`showUpload`, `autoPlayOnLoad`); the standalone Ripple Lab usage is untouched and covered by its existing tests.
