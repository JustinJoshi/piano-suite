/**
 * Theme registry for the Piano Suite theming system.
 *
 * Each theme id matches a CSS class applied to <html> by next-themes.
 * The corresponding color tokens live in app/globals.css.
 */

export const themeIds = [
  "amber",
  "rose",
  "emerald",
  "ocean",
  "violet",
  "slate",
] as const;

export type ThemeId = (typeof themeIds)[number];

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
}

export const themes: Theme[] = [
  {
    id: "amber",
    name: "Amber",
    description: "Warm piano gold (default)",
  },
  {
    id: "rose",
    name: "Rose",
    description: "Soft red-pink",
  },
  {
    id: "emerald",
    name: "Emerald",
    description: "Calm practice green",
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep cyan-teal",
  },
  {
    id: "violet",
    name: "Violet",
    description: "Purple studio mood",
  },
  {
    id: "slate",
    name: "Slate",
    description: "Cool monochrome",
  },
];

export const defaultTheme: ThemeId = "amber";

export function isThemeId(value: string): value is ThemeId {
  return themeIds.includes(value as ThemeId);
}

export function findTheme(id: string): Theme | undefined {
  return themes.find((theme) => theme.id === id);
}
