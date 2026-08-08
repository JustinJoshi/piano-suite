# Piano Sound Engine Research

> Goal: pick the best browser-based engine for playing piano sound in response to live MIDI input, with support for preset soundfonts and user-uploaded custom soundfonts.
>
> Research date: 2026-08-08

## Requirements recap

1. Play a sound when the user presses a MIDI key.
2. Velocity-sensitive (louder/harder with harder key presses).
3. Polyphonic (multiple notes at once, sustain/pedal friendly).
4. Work in a Next.js 16 + TypeScript app.
5. Allow the user to pick from a few popular open-source soundfonts.
6. Allow the user to upload a custom soundfont or sample pack.

## Option A — Tone.js `Sampler` with a sample map

**What it is:** [Tone.js](https://tonejs.github.io/) is a Web Audio framework. Its [`Tone.Sampler`](https://tonejs.github.io/docs/15.1.22/classes/Sampler.html) maps note names/MIDI numbers to audio URLs and automatically pitch-shifts missing notes.

**Preset soundfonts:** Tone itself ships no presets, but there are ready-made sample sets such as:

- [`tonejs-instruments`](https://github.com/nbrosowsky/tonejs-instruments) — pre-bundled instruments for Tone.js.
- The Salamander Grand Piano WAV/MP3 set mapped by note name.
- Any MIDI.js-style soundfont rendered to per-note MP3s.

**Custom upload:** The `samples` map accepts `AudioBuffer` objects, so a user can upload a folder/zip of `.wav`/`.mp3` files, we decode them with `AudioContext.decodeAudioData`, and build a sampler at runtime.

| Pros | Cons |
|---|---|
| Clean, well-known API | No built-in piano soundfont; we must host samples |
| Pitch-shifts missing notes | Pitch-shift quality is acceptable, not great |
| Easy velocity handling | Large sample sets mean large bundle or many HTTP requests |
| Works offline if samples are local | Mapping user uploads requires filename → note parsing |

**Best for:** Apps that want total control and are okay hosting their own sample library.

## Option B — `smplr`

**What it is:** [`smplr`](https://www.npmjs.com/package/smplr) is a modern Web Audio sampler library by the author of the old `soundfont-player`. It ships with several ready-to-use instruments and can read `.sf2` files directly.

**Preset soundfonts / pianos:**

- [`SplendidGrandPiano`](https://github.com/danigb/smplr) — sampled Steinway grand, 4 velocity layers.
- `Soundfont` — General MIDI soundfonts (`MusyngKite`, `FluidR3_GM`).
- `ElectricPiano`, `Mallet`, `DrumMachine`, etc.

**Custom upload:** `smplr` includes a `Soundfont2` instrument that can parse `.sf2` files. Users can upload an `.sf2` and the library lists/loads presets.

```ts
import { Soundfont2 } from "smplr";
const sampler = Soundfont2(context, { url: uploadedSf2Url, createSoundfont: … });
```

It also exposes a lower-level `Sampler` for custom buffer maps.

| Pros | Cons |
|---|---|
| Batteries-included acoustic piano (`SplendidGrandPiano`) | Hosted samples are fetched from GitHub Pages; rate limits can bite during dev |
| Built-in `.sf2` support for custom uploads | `.sf2` parsing adds some bundle size and complexity |
| Good velocity layers and effects (reverb) | Still pre-1.0; API may shift |
| Cache API support for offline reuse | HTTPS required for `CacheStorage` |

**Best for:** Fastest path to a good-sounding piano with both preset and `.sf2` upload support.

## Option C — `soundfont-player` (archived)

**What it is:** [`soundfont-player`](https://github.com/danigb/soundfont-player) is the predecessor to `smplr`. The author has archived it and recommends `smplr`.

**Preset soundfonts:** FluidR3_GM and MusyngKite.

**Custom upload:** Supports loading custom soundfont URLs.

| Pros | Cons |
|---|---|
| Simple API | Archived; no active maintenance |
| Pre-rendered MP3 soundfonts | Lower quality than `smplr` |
|  | Author explicitly recommends `smplr` |

**Verdict:** Do not start new work on this.

## Option D — Native Web Audio sampler

**What it is:** Build our own sampler with `AudioContext`, `AudioBufferSourceNode`, `GainNode`, and a map of note → buffer.

**Preset soundfonts:** We would have to host the samples ourselves, same as Tone.js.

**Custom upload:** Decode uploaded files with `AudioContext.decodeAudioData` and store them in a map.

| Pros | Cons |
|---|---|
| Zero extra dependencies | We re-implement everything smplr/Tone already do |
| Full control over envelopes, panning, reverb | Velocity layers, looping, release samples are on us |
| Lightweight if we keep it simple | Easy to end up with a half-finished sampler |

**Best for:** If bundle size is critical and we only need a simple synth-like piano.

## Option E — SF2-based engines

For users who want to upload real `.sf2` soundfonts, there are dedicated players:

- [`sfumato`](https://github.com/felixroos/sfumato) — `.sf2` player for Web Audio.
- [`spessasynth`](https://github.com/spessasus/SpessaSynth) — full SF2/SF3/DLS synthesizer.
- [`soundfont2`](https://github.com/Mrtenz/soundfont2) / [`soundfont2-esm`](https://www.npmjs.com/package/soundfont2-esm) — parser only; you still build playback.
- [`sf2-synth-audio-worklet`](https://github.com/oki07/sf2-synth-audio-worklet) — AudioWorklet-based synthesizer.

| Pros | Cons |
|---|---|
| Supports the standard soundfont format | Larger, more complex dependencies |
| Users can bring any `.sf2` piano | Parsing SF2 in the browser can be slow for big files |
| Authentic GM sound | Browser memory limits apply |

**Best for:** Advanced users who already have `.sf2` collections. Could be exposed as a “Pro / power user” upload option.

## Popular open-source soundfonts to expose as presets

| Name | Format | Size | Notes |
|---|---|---|---|
| **Salamander Grand Piano** | SFZ / WAV, also `.sf2` conversions | ~400 MB–1.2 GB full, smaller subsets available | Yamaha C5, widely used, high quality [freepats](https://freepats.zenvoid.org/Piano/acoustic-grand-piano.html) |
| **Splendid Grand Piano** | pre-sliced samples via `smplr` | hosted by smplr | Steinway, 4 velocity layers, easiest drop-in |
| **FluidR3_GM** | `.sf2` | ~140 MB | Full General MIDI; piano is decent but not great [soundfont-player](https://github.com/danigb/soundfont-player) |
| **MusyngKite** | `.sf2` | larger | Higher quality GM set [soundfont-player](https://github.com/danigb/soundfont-player) |
| **GeneralUser GS** | `.sf2` | ~30 MB | Compact GM set, good for bandwidth-conscious users |

## Recommendation

**Use `smplr` as the default engine.**

Reasoning:

1. It gives us a high-quality acoustic piano immediately (`SplendidGrandPiano`) with no sample-hosting work.
2. It has built-in General MIDI soundfont support and `.sf2` upload support, satisfying both preset and custom-soundfont requirements.
3. It is actively maintained and designed for exactly this use case.
4. It is easier to swap the audio backend later if needed than to grow a home-grown sampler.

**Architecture sketch:**

```
lib/audio-engine.ts          # smplr wrapper + engine selection
lib/audio-settings.ts        # user prefs: enabled, engine, volume, preset, custom samples
hooks/useAudioEngine.ts      # React interface: load, playNote(note, velocity), stopNote(note)
hooks/useMidi.ts             # route note-on/off to audio engine when enabled
app/settings/audio/page.tsx  # settings UI
components/drills/audio-gear-popover.tsx  # gear icon next to MIDI connect
```

**First milestone:**

1. Add `smplr` to dependencies.
2. Create `lib/audio-engine.ts` with a default `SplendidGrandPiano` instance.
3. Add a global “Piano sound” toggle and volume slider in settings.
4. Wire MIDI note-on events through the engine behind the toggle.
5. Gate: lint, unit, build, manual MIDI smoke test.

**Later milestones:**

- Add soundfont preset selector (SplendidGrandPiano, FluidR3_GM, MusyngKite, GeneralUser GS).
- Add custom `.sf2` / sample-map upload.
- Add per-tool gear icon for quick access.
- Cache downloaded samples with `CacheStorage` for Pro / repeat visits.

## Open questions for product

1. Should the piano sound play **only during drills**, or also on the `/tools/midi-test` page and when using visualization labs?
2. Should the metronome click also switch to a woodblock/snare sample, or stay as the current oscillator?
3. Do we want to host fallback samples in `public/` so the app works offline without external GitHub Pages fetches?
4. Should custom soundfont upload be a Free or Pro feature? Large `.sf2` files are client-only, but Pro could sync the choice across devices.
