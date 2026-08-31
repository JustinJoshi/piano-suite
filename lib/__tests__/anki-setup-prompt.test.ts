import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import {
  buildAnkiSetupPrompt,
  type AnkiDeckFile,
} from "@/lib/anki-setup-prompt";

function loadDeck(filename: string): AnkiDeckFile {
  return {
    title: filename,
    filename,
    content: readFileSync(path.join(process.cwd(), "public", filename), "utf8"),
  };
}

describe("buildAnkiSetupPrompt", () => {
  const decks = [
    loadDeck("chord-symbols-CGDAEno11.txt"),
    loadDeck("chord-symbols-CGDAE.txt"),
  ];
  const prompt = buildAnkiSetupPrompt(decks);

  it("instructs installing Anki from the official site", () => {
    expect(prompt).toContain("https://apps.ankiweb.net");
  });

  it("includes the AnkiConnect add-on code", () => {
    expect(prompt).toContain("2055492159");
  });

  it("tells the assistant where AnkiConnect should answer", () => {
    expect(prompt).toContain("http://127.0.0.1:8765");
  });

  it("embeds each deck's filename and full contents", () => {
    for (const deck of decks) {
      expect(prompt).toContain(deck.filename);
      expect(prompt).toContain(deck.content);
    }
  });

  it("explains how to import the deck files", () => {
    expect(prompt.toLowerCase()).toContain("import");
  });

  it("frames the whole thing as one instruction to the assistant", () => {
    expect(prompt.toLowerCase()).toContain("anki");
    expect(prompt.length).toBeGreaterThan(1000);
  });
});
