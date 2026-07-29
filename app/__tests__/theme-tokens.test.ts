import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Guards against components using a Tailwind color utility whose backing token
 * was never declared. `bg-success` silently renders no color if
 * `--color-success` is missing from the `@theme inline` block.
 */
const globalsCss = fs.readFileSync(
  path.join(__dirname, "../globals.css"),
  "utf-8"
);

const SEMANTIC_TOKENS = [
  "background",
  "foreground",
  "card",
  "popover",
  "primary",
  "secondary",
  "muted",
  "accent",
  "destructive",
  "success",
  "border",
  "input",
  "ring",
  "sidebar-background",
  "grade-again",
  "grade-hard",
  "grade-good",
  "grade-easy",
  "grade-ungraded",
] as const;

describe("theme tokens", () => {
  it.each(SEMANTIC_TOKENS)(
    "exposes --color-%s as a Tailwind utility",
    (token) => {
      expect(globalsCss).toContain(`--color-${token}:`);
    }
  );

  it("declares a value for every token mapped in @theme inline", () => {
    const themeBlock = globalsCss.match(/@theme inline \{([\s\S]*?)\n\}/);
    expect(themeBlock).not.toBeNull();

    const mapped = [
      ...themeBlock![1].matchAll(/--color-[\w-]+:\s*var\((--[\w-]+)\)/g),
    ].map((m) => m[1]);
    expect(mapped.length).toBeGreaterThan(0);

    for (const variable of mapped) {
      // Every mapped variable must be assigned somewhere outside the map itself.
      const declaration = new RegExp(`${variable}:\\s*[^v]`);
      expect(
        declaration.test(globalsCss),
        `${variable} is mapped in @theme inline but never given a value`
      ).toBe(true);
    }
  });
});
