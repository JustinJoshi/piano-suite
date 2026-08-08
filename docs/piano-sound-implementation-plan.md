# Piano Sound — Implementation Plan

> Branch: `kimi/piano-sound`  
> Worktree: `.worktrees/kimi-piano-sound`  
> Target: play piano sound on every MIDI note-on across the site, with a quick toggle next to the MIDI connect bar and a full settings page.

## Why `smplr` instead of Tone.js `Sampler`

- **Tone.js `Sampler`** is a generic sampler: you give it a map of note → audio file and it pitch-shifts. It does **not** ship with a piano sound; we would have to host our own samples and build the instrument from scratch.
- **`smplr`** is a sampler library that already includes high-quality instruments (`SplendidGrandPiano`, GM soundfonts) **and** can load custom `.sf2` files and sample maps. Less setup, better sound out of the box.

So the plan uses `smplr` for the engine, but keeps the door open to swap later.

## High-level architecture

```
app/layout.tsx
  └─ AudioEngineProvider        # global listener; plays sound on midi-note-on
        └─ lib/audio-engine.ts  # smplr wrapper (load, play, stop, volume)
        └─ hooks/useAudioSettings.ts  # prefs: enabled, preset, volume, custom kit

components/drills/midi-connection-bar.tsx
  └─ MidiAudioSwitch            # "Use MIDI sounds" on/off switch (visible when connected)
  └─ AudioSettingsButton        # gear icon → /settings/audio

app/settings/audio/page.tsx
  └─ master toggle, volume, preset selector, (Milestone 2) custom upload

components/tools/sidebar.tsx
  └─ new "Audio" link under Settings
```

## Milestone 1 — Core playback, toggle, and settings page

### 1. Add dependency

```bash
npm install smplr
```

### 2. Audio settings primitive

**New file: `lib/audio-settings.ts`**

Schema:

```ts
export type AudioPreset =
  | "splendid-grand-piano"
  | "fluidr3-piano"
  | "musyngkite-piano";

export type AudioSettings = {
  enabled: boolean;          // master on/off
  volume: number;            // 0..1
  preset: AudioPreset;       // built-in preset
  customKit: CustomKit | null; // Milestone 2
};

export type CustomKit =
  | { kind: "sf2"; name: string; url: string; preset: string }
  | { kind: "samples"; name: string; map: Record<string, string> };
```

Responsibilities:
- Default values: `enabled: true`, `volume: 0.7`, `preset: "splendid-grand-piano"`.
- localStorage key: `piano-suite-audio-v1`.
- Normalization function that ignores unknown presets and clamps volume.

**New file: `hooks/useAudioSettings.ts`**

Patterned on `useThemePreference.ts` / `useAmbientEffects.ts`:
- Reads localStorage immediately.
- If Pro sync (`canPersist`), reads/writes Convex `settings` key `"audio"`.
- Remote value hydrates localStorage only when local is missing.
- Returns `{ settings, setEnabled, setVolume, setPreset, setCustomKit, loaded }`.

### 3. Audio engine

**New file: `lib/audio-engine.ts`**

A small class/factory with no React dependency:

```ts
export type AudioEngine = {
  load(): Promise<void>;
  setVolume(volume: number): void;
  play(note: number, velocity: number): void;
  stop(note: number): void;
  stopAll(): void;
  dispose(): void;
};
```

Implementation notes:
- Lazily create `AudioContext` on first user gesture (e.g., MIDI Connect or first note).
- For Milestone 1, support built-in presets via `smplr`:
  - `SplendidGrandPiano`
  - `Soundfont(context, { instrument: "acoustic_grand_piano", kit: "FluidR3_GM" })`
  - `Soundfont(context, { instrument: "acoustic_grand_piano", kit: "MusyngKite" })`
  - `Soundfont(context, { instrument: "acoustic_grand_piano", kit: ... })` for GeneralUser GS (may need custom URL).
- Map MIDI note numbers (0–127) to `smplr.start({ note, velocity })`.
- Call `context.resume()` before playing if the context is suspended.
- Dispose / release notes on unmount.

### 4. Global playback host

**New file: `components/audio/audio-engine-host.tsx`**

A client provider mounted in `app/layout.tsx` inside the existing providers.

Behavior:
- Subscribes to `window` events `midi-note-on` and `midi-note-off` (the same events `lib/midi-session.ts` dispatches).
- If `settings.enabled === true` and MIDI is connected, calls `engine.play(note, velocity)` / `engine.stop(note)`.
- Loads the selected instrument when the preset changes.
- Does **not** play on pages where MIDI is irrelevant — it simply reacts to events; if no device is connected, no events fire.

Mount point in `app/layout.tsx`:

```tsx
<AmbientEffectsProvider>
  <AmbientEffectsHost />
  <AudioEngineHost />   {/* new */}
  {children}
</AmbientEffectsProvider>
```

### 5. Quick toggle + gear icon on MIDI connection bar

**Update: `components/drills/midi-connection-bar.tsx`**

When `connected === true`, render:
- A labeled switch: **“Use MIDI sounds”** — default ON.
- A gear icon button linking to `/settings/audio`.

The switch controls `settings.enabled` via `useAudioSettings()`.

Visual constraints:
- Keep the existing bar layout; add the switch inline with `flex`.
- Use theme tokens only (`text-success`, `bg-success`, `text-muted-foreground`).

### 6. Settings page

**New file: `app/settings/audio/page.tsx`**

Uses the same page shell as `/settings/theme` and `/settings/atmosphere` (`p-4 sm:p-6 lg:p-10`, `max-w-3xl`).

Cards:
1. **Master switch** — enable/disable MIDI sounds.
2. **Volume** — slider 0..1.
3. **Preset** — radio/select for the four built-in pianos.
4. **Status** — shows "Loading samples… / Ready / Error" and current preset name.
5. (Milestone 2) **Custom soundfont** — upload `.sf2` or sample-map section.

### 7. Sidebar link

**Update: `components/tools/sidebar.tsx`**

Add an **Audio** link under Settings, between Atmosphere and Billing (order: Theme → Atmosphere → Audio → Billing). Use the `Volume2` Lucide icon.

### 8. Proxy / route

`/settings/audio` is under `/settings/*`, which is already protected by `proxy.ts`. No proxy change is needed for Milestone 1.

If we later want the gear icon on public pages (e.g., `/tools/chladni`), the settings link will redirect unsigned users to `/sign-in` when auth is enabled. The inline switch on the public page would still work because it only touches localStorage.

### 9. Tests

- Unit: `lib/__tests__/audio-settings.test.ts` — normalization, localStorage round-trip.
- Unit: `lib/__tests__/audio-engine.test.ts` — mock `smplr`, assert `play`/`stop` are called with right note/velocity.
- Component: `components/drills/__tests__/midi-connection-bar.test.tsx` — switch toggles settings.
- E2E: optional smoke that the settings page loads and the switch is visible after MIDI connect.

### 10. Gate

```bash
npm run lint
npm run test:unit:run
npm run build
```

---

## Milestone 2 — Custom soundfonts, sample maps, and caching

### 1. Custom `.sf2` upload

Use `smplr`'s `Soundfont2` instrument:

```ts
import { Soundfont2 } from "smplr";
const sampler = Soundfont2(context, {
  url: objectUrlFromUserFile,
  createSoundfont: (data) => new SoundFont2(data),
});
await sampler.ready;
sampler.loadInstrument("Grand Piano");
```

UI flow in `/settings/audio`:
- File input accepts `.sf2`.
- After parsing, list available presets; user picks one.
- Store the user's choice in `settings.customKit` and `localStorage`.
- For persistence across sessions, we can keep the file in `IndexedDB` or ask the user to re-upload ( simpler v1 ).

### 2. Custom sample-map upload

Allow the user to upload a `.zip` or multiple `.wav`/`.mp3` files.

- Parse filenames like `C4.wav`, `F#3.mp3`, etc.
- Build a `Record<string, AudioBuffer>` and use `smplr`'s `Sampler`.
- Provide a simple mapping editor if filenames are ambiguous.

### 3. Preset soundfont hosting

For the built-in presets that are not in `smplr` out of the box (FluidR3, MusyngKite, GeneralUser GS), either:

- Use `smplr`'s `Soundfont` instrument with the gleitz.github.io MIDI.js soundfont URLs.
- Or mirror a small subset in `public/soundfonts/` if external fetches are unreliable.

### 4. Sample caching

Use `smplr`'s `CacheStorage`:

```ts
import { CacheStorage } from "smplr";
const storage = CacheStorage();
const piano = SplendidGrandPiano(context, { storage });
```

- Works over HTTPS.
- For local dev, document that users may need `next-dev-https` if they want caching; otherwise samples are fetched each session.
- Cache invalidation: user can clear from `/settings/audio`.

### 5. Convex sync for settings

Already wired in Milestone 1 via `useAudioSettings`. In Milestone 2 we also sync:
- Selected preset / custom kit metadata (not the uploaded binary; that stays local).
- Volume and enabled state.

This lets a Pro user keep the same piano sound across devices.

---

## Open product question

**Metronome:** The current metronome uses raw Web Audio oscillators. Should it also switch to a sampled click/woodblock when piano sounds are enabled, or stay as-is?

| Option | Pros | Cons |
|---|---|---|
| Keep oscillator click | Simple, distinct from piano, no extra samples | Slightly less “polished” |
| Sampled woodblock/snare | More musical, fits the piano sound | Adds another sample to load/maintain |

**Recommendation:** Keep the oscillator click for Milestone 1. Revisit after the piano sound is shipped.

---

## Files touched summary

### New files
- `lib/audio-settings.ts`
- `hooks/useAudioSettings.ts`
- `lib/audio-engine.ts`
- `components/audio/audio-engine-host.tsx`
- `app/settings/audio/page.tsx`
- `lib/__tests__/audio-settings.test.ts`
- `lib/__tests__/audio-engine.test.ts`

### Modified files
- `package.json` / `package-lock.json` — add `smplr`
- `app/layout.tsx` — mount `AudioEngineHost`
- `components/drills/midi-connection-bar.tsx` — switch + gear icon
- `components/tools/sidebar.tsx` — Audio link
- `docs/AGENTS.md` — add audio engine to primitive layer table
- `docs/missing-features-plan.md` — mark piano sound as in-progress

---

## First concrete commit

1. Add `smplr`.
2. Create `lib/audio-settings.ts` + tests.
3. Create `hooks/useAudioSettings.ts` (localStorage + Convex).
4. Create `lib/audio-engine.ts` + tests.
5. Create `components/audio/audio-engine-host.tsx` and mount it.
6. Update `MidiConnectionBar` with switch + gear.
7. Add `/settings/audio` page and sidebar link.
8. Gate: lint, unit, build.
