/**
 * Theme registry for the Piano Suite theming system.
 *
 * Each theme id matches a CSS class applied to <html> by next-themes.
 * The corresponding color tokens live in app/globals.css.
 *
 * Roll is the default: roll paper, printing ink, red key-slip felt and a
 * brass tracker bar. It overrides the whole surface ladder, like Ivory.
 * Every other preset except Ivory is a dark "stage" that swaps only the
 * brand ramp. Public pages always wear the roll (`.tone-roll`); presets
 * apply to the workspace.
 */

export const themeIds = [
  "roll",
  "amber",
  "ivory",
  "rose",
  "emerald",
  "ocean",
  "violet",
  "slate",
] as const;

export type ThemeId = (typeof themeIds)[number];

export type ThemeAppearance = "dark" | "light";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  appearance: ThemeAppearance;
}

export const themes: Theme[] = [
  {
    id: "roll",
    name: "Roll",
    description: "Paper, ink and red felt — the default",
    appearance: "light",
  },
  {
    id: "amber",
    name: "Amber",
    description: "Brass and ebony — the studio stage",
    appearance: "dark",
  },
  {
    id: "ivory",
    name: "Ivory",
    description: "Light stage — paper, ivory keys, brass accents",
    appearance: "light",
  },
  {
    id: "rose",
    name: "Rose",
    description: "Rosewood — warm red-pink",
    appearance: "dark",
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Green room — calm practice green",
    appearance: "dark",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep cyan-teal",
    appearance: "dark",
  },
  {
    id: "violet",
    name: "Violet",
    description: "Late-night studio purple",
    appearance: "dark",
  },
  {
    id: "slate",
    name: "Slate",
    description: "Cool monochrome",
    appearance: "dark",
  },
];

export const defaultTheme: ThemeId = "roll";

export function isThemeId(value: string): value is ThemeId {
  return themeIds.includes(value as ThemeId);
}

export function findTheme(id: string): Theme | undefined {
  return themes.find((theme) => theme.id === id);
}
