# Music Rights Audit

Part of the Priority-1 legal gate in `tasks/tasks-go-live.md` (see
`IMPORTANT-NOTICES.md`). Arrangements of copyrighted songs are derivative
works; music publishers are the most likely source of a month-one takedown.
This file is the inventory + policy that keeps the app clean.

Status: **CLEAN as of 2026-08-29** — nothing copyright-encumbered is shipped.

## Inventory

Audited: every file under `public/`, every `.mid`/`.musicxml`/`.xml`/`.pdf`
in the repo, and drill content generation.

| Asset | Source | Rights status |
|---|---|---|
| `public/chord-symbols-CGDAEno11.txt` | Self-authored (original project decks) | Own work — chord symbol lists are unprotectable facts |
| `public/chord-symbols-CGDAE.txt` | Self-authored (original project decks) | Own work — same as above |
| Drill targets (chords, arpeggios, progressions) | Generated at runtime from music theory in `lib/music-theory.ts` | Chord progressions and scales are not copyrightable |
| Chladni / Julia / other visualizations | Generated from note names / math | No musical content |

No MIDI files, audio recordings, sheet music, or song arrangements ship with
the app today.

## Policy for future additions

1. Do not add MIDI/audio/sheet-music of copyrighted songs without a license
   check. "I typed it in myself" does not cure derivative-work status for
   arrangements of copyrighted compositions.
2. Public-domain compositions (pre-1929 compositions; check arrangement
   rights separately) may be added — record the source and reasoning in the
   table above.
3. Original compositions are fine — note authorship in the table.
4. User-uploaded MIDI (music player feature) is stored/transmitted only for
   the uploading user's own playback and is not redistributed by the app.
   Keep it that way; redistribution would change the analysis.

Re-audit triggers: before any public launch announcement, and whenever a
song-based feature is proposed.
