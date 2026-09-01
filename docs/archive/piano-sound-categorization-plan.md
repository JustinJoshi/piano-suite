# Piano Sound — Preset Categories & Soundfont Browser Plan

> Branch: `kimi/piano-sound`  
> Worktree: `.worktrees/kimi-piano-sound`  
> Goal: move from a flat list of piano presets to curated categories, expose smplr’s full GM catalog, and give users clear paths to find more soundfonts.

## Current state (verified from the code)

- `lib/audio-settings.ts` defines `AudioPreset` as a flat union of four acoustic-piano IDs and a label map.
- `lib/audio-engine.ts` maps each ID to a `smplr` instrument (`SplendidGrandPiano` or `Soundfont` with a fixed kit/instrument).
- `hooks/useAudioSettings.tsx` persists the active preset to localStorage and Convex.
- `app/settings/audio/page.tsx` shows a single `<select>` for presets and a "Custom soundfonts coming soon" card.
- `components/audio/audio-engine-host.tsx` recreates the engine on preset change and reports loading state.
- Loading state is already wired: `engineState` is in the audio context and shown in both the settings page and `MidiConnectionBar`.

## What `smplr` can reach

`smplr` fetches samples on demand from public GitHub-hosted libraries:

- `gleitz.github.io/midi-js-soundfonts` — General MIDI soundfonts (FluidR3_GM, MusyngKite, FatBoy, Tabla).
- `smpldsnds.github.io` — Splendid Grand Piano, Greg Sullivan e-pianos, VCSL, drum machines, Mellotron.
- `goldst.dev/midi-js-soundfonts` — optional note-loop data.

Exposed catalog helpers (all exported from `smplr`):

- `getSoundfontNames()` — 128 GM instruments.
- `getSoundfontKits()` — `["MusyngKite", "FluidR3_GM"]` by default; arbitrary kit strings work (we already use `"FatBoy"`).
- `getElectricPianoNames()` — `CP80`, `PianetT`, `WurlitzerEP200`, `TX81Z`.
- `getMalletNames()` — vibraphone, xylophone, tubular bells, balafon.
- `getDrumMachineNames()`, `getDrumAbuseMachineNames()`, `getMellotronNames()`, `getVersilianInstruments()`, `getSmolkenNames()`.

That means the built-in browser can expose **hundreds** of presets without us hosting anything.

## Recommended two-phase workflow

### Phase 1 — Curated categories, full browser, and external links

**1. Add sample caching**

Use `smplr`’s `CacheStorage` so fetched samples persist across visits instead of being re-downloaded every session.

- File: `lib/audio-engine.ts`
- Change: pass `CacheStorage("piano-suite")` into every `smplr` instrument constructor.
- Add a "Clear audio cache" button in `/settings/audio` for users who need to free space.

**2. Expand the preset model to support categories + dynamic GM presets**

Keep the current `AudioPreset` union for hand-curated favorites, but also allow dynamic IDs of the form `sf:<kit>:<instrument>` so the browser can set any GM soundfont without hardcoding 384 union members.

- File: `lib/audio-settings.ts`
- Add:
  - `AUDIO_PRESET_CATEGORIES` mapping each curated preset to a category slug.
  - Validation that accepts known curated IDs and well-formed `sf:<kit>:<instrument>` IDs.
  - Human-readable labels for dynamic IDs derived from the instrument/kit name.
- Curated categories and initial presets:
  - **Acoustic Pianos** — Splendid Grand, FluidR3 Grand, MusyngKite Grand, FatBoy Grand.
  - **Electric Pianos** — Rhodes (`electric_piano_1`), FM (`electric_piano_2`), Wurlitzer EP200, CP80, Pianet T.
  - **Organs & Vintage Keys** — Drawbar organ, rock organ, harpsichord, clavinet.
  - **Synths** — Square lead, saw lead, new-age pad, warm pad.
  - **Mallets & Bells** — Vibraphone, marimba, glockenspiel, tubular bells.

**3. Refactor the engine to build arbitrary smplr instruments**

- File: `lib/audio-engine.ts`
- Replace the single `switch (preset)` with a resolver that can return:
  - `SplendidGrandPiano` for the dedicated preset.
  - `Soundfont(context, { instrument, kit })` for `sf:*` and curated GM presets.
  - `ElectricPiano(context, { instrument })`, `Mallet(context, { instrument })`, etc., for specialty curated presets.

**4. Redesign the `/settings/audio` Preset card**

- File: `app/settings/audio/page.tsx`
- Show curated presets grouped by category (accordion or grouped `<optgroup>`).
- Add a secondary "Browse all soundfonts" section:
  - Category filter (Pianos, Organs, Synths, Mallets, etc.) driven by GM instrument grouping.
  - Kit selector: MusyngKite / FluidR3_GM / FatBoy.
  - Search by instrument name.
  - Clicking an item sets it as the active preset using the `sf:<kit>:<instrument>` ID.
- Keep the loading indicator already implemented.

**5. Add an external resources section**

- File: `app/settings/audio/page.tsx`
- Card at the bottom titled "Find more soundfonts" with links and short descriptions:
  - [Polyphone.io](https://www.polyphone.io) — browse and download free `.sf2` files.
  - [Musical Artifacts](https://musical-artifacts.com) — curated free soundfonts.
  - [Zanderjaz Free SoundFonts](https://www.zanderjaz.com/downloads/soundfonts/) — categorized SF2 library.
  - [gleitz/midi-js-soundfonts on GitHub](https://github.com/gleitz/midi-js-soundfonts) — the GM soundfont source `smplr` uses.
  - [smpldsnds on GitHub](https://github.com/smpldsnds) — the sample-library organization behind Splendid Grand Piano, e-pianos, VCSL, etc.
- Explain that downloaded `.sf2` files can be uploaded once Phase 2 custom upload ships.

**6. Tests**

- Update `lib/__tests__/audio-engine.test.ts` to cover new instrument families (ElectricPiano, Mallet).
- Update `lib/__tests__/audio-settings.test.ts` for dynamic `sf:*` IDs and category metadata.
- Update `components/drills/__tests__/midi-connection-bar.test.tsx` mocks if the context shape changes.
- Add E2E coverage for switching to a non-piano preset and seeing the loading indicator.

**7. Gate**

```bash
npm run lint
npm run test:unit:run
npm run build
```

Run E2E if the settings page or preset switching changes materially.

---

### Phase 2 — Custom `.sf2` / sample upload (Milestone 2) ✅ Shipped

**1. Custom `.sf2` upload**

- File: `components/audio/sf2-uploader.tsx`
- File input accepts `.sf2`.
- Uses `soundfont2` + `smplr.Soundfont2` to parse and list instrument presets.
- Selected preset metadata stored in `settings.customKit`; blob stored in IndexedDB.

**2. Sample-map upload**

- File: `components/audio/sample-map-uploader.tsx`
- Accepts individual audio files or a `.zip` archive.
- Filenames like `C4.wav`, `F#3.mp3`, or `60.wav` are mapped to MIDI notes.
- Sample blobs stored in IndexedDB; note → blob-key map stored in `settings.customKit`.

**3. Persist uploaded files locally**

- File: `lib/audio-storage.ts`
- IndexedDB object store `customKits` holds blobs keyed by kit/sample ID.
- Object URLs are created on demand and revoked when the engine disposes.
- "Delete kit" removes blobs from IndexedDB and clears `customKit`.

**4. Settings sync**

- Convex syncs only metadata (`customKit` name, preset/index map, enabled, volume).
- Audio binaries stay device-local in IndexedDB.

**5. Tests**

- `lib/__tests__/audio-storage.test.ts`
- `lib/__tests__/sf2-kit.test.ts`
- `lib/__tests__/sample-map-kit.test.ts`
- `lib/__tests__/audio-engine.test.ts` covers custom SF2 loading.

---

## Why not one-click import from external sites?

Browser security (CORS and same-origin policy) prevents a web app from fetching an arbitrary `.sf2` directly from Polyphone, Musical Artifacts, or most download pages. The user must download the file first, then upload it. The best we can do is:

1. Expose everything `smplr` can already reach through the built-in browser.
2. Link to trusted external libraries for sounds beyond that catalog.
3. Make custom upload as easy as possible in Phase 2.

## Files likely touched

- `lib/audio-settings.ts` — categories, dynamic preset IDs, validation.
- `lib/audio-engine.ts` — CacheStorage, arbitrary instrument resolution.
- `hooks/useAudioSettings.tsx` — no major changes unless context shape expands.
- `app/settings/audio/page.tsx` — categorized UI, browser, external links, clear cache.
- `components/audio/audio-engine-host.tsx` — no changes expected.
- `components/drills/midi-connection-bar.tsx` — no changes expected.
- `lib/__tests__/audio-engine.test.ts` — new instrument tests.
- `lib/__tests__/audio-settings.test.ts` — category/dynamic ID tests.
- `e2e/audio-loading.authenticated.spec.ts` — extend to cover non-piano preset.
- `docs/piano-sound-implementation-plan.md` — update to reflect completed/new work.
- `AGENTS.md` — update if new primitives emerge.

## Suggested commit sequence for Phase 1

1. Add `CacheStorage` to the audio engine and a clear-cache button.
2. Add preset category metadata and expand curated presets.
3. Refactor engine to resolve arbitrary `smplr` instruments.
4. Redesign `/settings/audio` with category picker + full browser + external links.
5. Update tests and docs.
6. Gate.
