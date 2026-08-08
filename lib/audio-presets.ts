/**
 * Preset catalog for the MIDI-driven piano sound.
 *
 * Built-in presets are hand-curated favorites. Dynamic IDs let the browser
 * expose the full smplr catalog without hardcoding every combination.
 */

export const SOUND_FONT_KITS = [
  "MusyngKite",
  "FluidR3_GM",
  "FatBoy",
] as const;

export type SoundFontKit = (typeof SOUND_FONT_KITS)[number];

/** Curated presets we show by default in the category picker. */
export const BUILT_IN_PRESETS = [
  // Acoustic pianos
  "splendid-grand-piano",
  "fluidr3-acoustic-grand-piano",
  "musyngkite-acoustic-grand-piano",
  "fatboy-acoustic-grand-piano",
  "fluidr3-bright-acoustic-piano",
  "musyngkite-bright-acoustic-piano",
  "fatboy-bright-acoustic-piano",

  // Electric pianos
  "fluidr3-electric-piano-1",
  "musyngkite-electric-piano-1",
  "fatboy-electric-piano-1",
  "fluidr3-electric-piano-2",
  "musyngkite-electric-piano-2",
  "fatboy-electric-piano-2",
  "electric-piano-cp80",
  "electric-piano-wurlitzer",

  // Organs & vintage keys
  "fluidr3-drawbar-organ",
  "musyngkite-drawbar-organ",
  "fatboy-drawbar-organ",
  "fluidr3-rock-organ",
  "musyngkite-rock-organ",
  "fatboy-rock-organ",
  "fluidr3-harpsichord",
  "musyngkite-clavinet",

  // Synths
  "fluidr3-lead-1-square",
  "musyngkite-lead-2-sawtooth",
  "fluidr3-pad-1-new-age",
  "musyngkite-pad-2-warm",

  // Mallets & bells
  "fluidr3-vibraphone",
  "musyngkite-marimba",
  "fluidr3-glockenspiel",
  "fluidr3-tubular-bells",
] as const;

export type BuiltInPreset = (typeof BUILT_IN_PRESETS)[number];

/**
 * Any preset the app can load.
 *
 * - Built-in curated presets (string IDs above).
 * - `sf:<kit>:<instrument>` for any General MIDI instrument in any kit.
 * - `ep:<instrument>` for smplr ElectricPiano instruments.
 * - `mallet:<instrument>` for smplr Mallet instruments.
 */
export type AudioPreset =
  | BuiltInPreset
  | `sf:${SoundFontKit}:${string}`
  | `ep:${string}`
  | `mallet:${string}`;

export const PRESET_CATEGORIES: Record<BuiltInPreset, string> = {
  // Acoustic pianos
  "splendid-grand-piano": "Acoustic Pianos",
  "fluidr3-acoustic-grand-piano": "Acoustic Pianos",
  "musyngkite-acoustic-grand-piano": "Acoustic Pianos",
  "fatboy-acoustic-grand-piano": "Acoustic Pianos",
  "fluidr3-bright-acoustic-piano": "Acoustic Pianos",
  "musyngkite-bright-acoustic-piano": "Acoustic Pianos",
  "fatboy-bright-acoustic-piano": "Acoustic Pianos",

  // Electric pianos
  "fluidr3-electric-piano-1": "Electric Pianos",
  "musyngkite-electric-piano-1": "Electric Pianos",
  "fatboy-electric-piano-1": "Electric Pianos",
  "fluidr3-electric-piano-2": "Electric Pianos",
  "musyngkite-electric-piano-2": "Electric Pianos",
  "fatboy-electric-piano-2": "Electric Pianos",
  "electric-piano-cp80": "Electric Pianos",
  "electric-piano-wurlitzer": "Electric Pianos",

  // Organs & vintage keys
  "fluidr3-drawbar-organ": "Organs & Vintage Keys",
  "musyngkite-drawbar-organ": "Organs & Vintage Keys",
  "fatboy-drawbar-organ": "Organs & Vintage Keys",
  "fluidr3-rock-organ": "Organs & Vintage Keys",
  "musyngkite-rock-organ": "Organs & Vintage Keys",
  "fatboy-rock-organ": "Organs & Vintage Keys",
  "fluidr3-harpsichord": "Organs & Vintage Keys",
  "musyngkite-clavinet": "Organs & Vintage Keys",

  // Synths
  "fluidr3-lead-1-square": "Synths",
  "musyngkite-lead-2-sawtooth": "Synths",
  "fluidr3-pad-1-new-age": "Synths",
  "musyngkite-pad-2-warm": "Synths",

  // Mallets & bells
  "fluidr3-vibraphone": "Mallets & Bells",
  "musyngkite-marimba": "Mallets & Bells",
  "fluidr3-glockenspiel": "Mallets & Bells",
  "fluidr3-tubular-bells": "Mallets & Bells",
};

function formatPresetName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getPresetLabel(preset: AudioPreset): string {
  if (preset in PRESET_CATEGORIES) {
    const builtIn = preset as BuiltInPreset;
    // Derive a readable label from the ID.
    // Examples:
    //   fluidr3-acoustic-grand-piano -> FluidR3 Acoustic Grand Piano
    //   electric-piano-wurlitzer     -> Wurlitzer
    if (builtIn === "splendid-grand-piano") return "Splendid Grand Piano";
    if (builtIn === "electric-piano-cp80") return "CP80";
    if (builtIn === "electric-piano-wurlitzer") return "Wurlitzer";

    const label = builtIn;
    for (const { prefix, kit } of [
      { prefix: "fluidr3-", kit: "FluidR3" },
      { prefix: "musyngkite-", kit: "MusyngKite" },
      { prefix: "fatboy-", kit: "FatBoy" },
    ] as const) {
      if (label.startsWith(prefix)) {
        const remaining = label.slice(prefix.length);
        return `${kit} ${formatPresetName(remaining)}`;
      }
    }
    return formatPresetName(label);
  }

  if (preset.startsWith("sf:")) {
    const [, kit, instrument] = preset.split(":");
    return `${kit} ${formatPresetName(instrument ?? "")}`;
  }

  if (preset.startsWith("ep:")) {
    const name = preset.slice(3);
    return name;
  }

  if (preset.startsWith("mallet:")) {
    const name = preset.slice(7);
    return name;
  }

  return preset;
}

export function getPresetCategory(preset: AudioPreset): string {
  if (preset in PRESET_CATEGORIES) {
    return PRESET_CATEGORIES[preset as BuiltInPreset];
  }

  if (preset.startsWith("sf:")) {
    const [, , instrument] = preset.split(":");
    return GM_INSTRUMENT_CATEGORIES[instrument ?? ""] ?? "Other";
  }

  if (preset.startsWith("ep:")) return "Electric Pianos";
  if (preset.startsWith("mallet:")) return "Mallets & Bells";

  return "Other";
}

export function isAudioPreset(value: unknown): value is AudioPreset {
  if (typeof value !== "string") return false;

  if (BUILT_IN_PRESETS.includes(value as BuiltInPreset)) return true;

  const parts = value.split(":");
  if (parts.length === 3 && parts[0] === "sf") {
    return SOUND_FONT_KITS.includes(parts[1] as SoundFontKit);
  }

  if (parts.length === 2 && (parts[0] === "ep" || parts[0] === "mallet")) {
    return parts[1].length > 0;
  }

  return false;
}

/** Maps every GM instrument name returned by smplr's getSoundfontNames() to a category. */
export const GM_INSTRUMENT_CATEGORIES: Record<string, string> = {
  // Pianos
  acoustic_grand_piano: "Acoustic Pianos",
  bright_acoustic_piano: "Acoustic Pianos",
  electric_grand_piano: "Electric Pianos",
  honkytonk_piano: "Organs & Vintage Keys",

  // Chromatic percussion
  celesta: "Mallets & Bells",
  glockenspiel: "Mallets & Bells",
  music_box: "Mallets & Bells",
  vibraphone: "Mallets & Bells",
  marimba: "Mallets & Bells",
  xylophone: "Mallets & Bells",
  tubular_bells: "Mallets & Bells",
  dulcimer: "Mallets & Bells",

  // Organs
  drawbar_organ: "Organs & Vintage Keys",
  percussive_organ: "Organs & Vintage Keys",
  rock_organ: "Organs & Vintage Keys",
  church_organ: "Organs & Vintage Keys",
  reed_organ: "Organs & Vintage Keys",
  accordion: "Organs & Vintage Keys",
  harmonica: "Organs & Vintage Keys",
  tango_accordion: "Organs & Vintage Keys",

  // Guitars
  acoustic_guitar_nylon: "Guitars",
  acoustic_guitar_steel: "Guitars",
  electric_guitar_jazz: "Guitars",
  electric_guitar_clean: "Guitars",
  electric_guitar_muted: "Guitars",
  overdriven_guitar: "Guitars",
  distortion_guitar: "Guitars",
  guitar_harmonics: "Guitars",

  // Basses
  acoustic_bass: "Basses",
  electric_bass_finger: "Basses",
  electric_bass_pick: "Basses",
  fretless_bass: "Basses",
  slap_bass_1: "Basses",
  slap_bass_2: "Basses",
  synth_bass_1: "Basses",
  synth_bass_2: "Basses",

  // Strings
  violin: "Strings",
  viola: "Strings",
  cello: "Strings",
  contrabass: "Strings",
  tremolo_strings: "Strings",
  pizzicato_strings: "Strings",
  orchestral_harp: "Strings",
  timpani: "Strings",

  // Ensemble
  string_ensemble_1: "Ensemble",
  string_ensemble_2: "Ensemble",
  synth_strings_1: "Ensemble",
  synth_strings_2: "Ensemble",
  choir_aahs: "Ensemble",
  voice_oohs: "Ensemble",
  synth_voice: "Ensemble",
  orchestra_hit: "Ensemble",

  // Brass
  trumpet: "Brass",
  trombone: "Brass",
  tuba: "Brass",
  muted_trumpet: "Brass",
  french_horn: "Brass",
  brass_section: "Brass",
  synth_brass_1: "Synths",
  synth_brass_2: "Synths",

  // Reed
  soprano_sax: "Reed",
  alto_sax: "Reed",
  tenor_sax: "Reed",
  baritone_sax: "Reed",
  oboe: "Reed",
  english_horn: "Reed",
  bassoon: "Reed",
  clarinet: "Reed",

  // Pipe
  piccolo: "Pipe",
  flute: "Pipe",
  recorder: "Pipe",
  pan_flute: "Pipe",
  blown_bottle: "Pipe",
  shakuhachi: "Pipe",
  whistle: "Pipe",
  ocarina: "Pipe",

  // Synth lead
  lead_1_square: "Synths",
  lead_2_sawtooth: "Synths",
  lead_3_calliope: "Synths",
  lead_4_chiff: "Synths",
  lead_5_charang: "Synths",
  lead_6_voice: "Synths",
  lead_7_fifths: "Synths",
  lead_8_bass__lead: "Synths",

  // Synth pad
  pad_1_new_age: "Synths",
  pad_2_warm: "Synths",
  pad_3_polysynth: "Synths",
  pad_4_choir: "Synths",
  pad_5_bowed: "Synths",
  pad_6_metallic: "Synths",
  pad_7_halo: "Synths",
  pad_8_sweep: "Synths",

  // Synth effects
  fx_1_rain: "Synths",
  fx_2_soundtrack: "Synths",
  fx_3_crystal: "Synths",
  fx_4_atmosphere: "Synths",
  fx_5_brightness: "Synths",
  fx_6_goblins: "Synths",
  fx_7_echoes: "Synths",
  fx_8_scifi: "Synths",

  // Ethnic
  sitar: "Ethnic",
  banjo: "Ethnic",
  shamisen: "Ethnic",
  koto: "Ethnic",
  kalimba: "Ethnic",
  bagpipe: "Ethnic",
  fiddle: "Ethnic",
  shanai: "Ethnic",

  // Percussive
  tinkle_bell: "Mallets & Bells",
  agogo: "Mallets & Bells",
  steel_drums: "Mallets & Bells",
  woodblock: "Mallets & Bells",
  taiko_drum: "Mallets & Bells",
  melodic_tom: "Mallets & Bells",
  synth_drum: "Mallets & Bells",
  reverse_cymbal: "Mallets & Bells",

  // Sound effects
  guitar_fret_noise: "Sound Effects",
  breath_noise: "Sound Effects",
  seashore: "Sound Effects",
  bird_tweet: "Sound Effects",
  telephone_ring: "Sound Effects",
  helicopter: "Sound Effects",
  applause: "Sound Effects",
  gunshot: "Sound Effects",
};
