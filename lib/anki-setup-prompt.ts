import { DEFAULT_ANKI_CONNECT_URL } from "@/lib/anki";

/**
 * Self-contained setup prompt for the "let your computer assistant do it"
 * button on the Anki setup step. The prompt embeds the full deck files so
 * the assistant can complete the setup without fetching anything else.
 *
 * Deck contents are passed in by the route page, which reads the shipped
 * files from `public/` — the prompt can never drift from the decks users
 * download by hand.
 */

export type AnkiDeckFile = {
  title: string;
  filename: string;
  content: string;
};

const DECK_IMPORT_INSTRUCTION =
  "3. Import my two chord decks. Each file below is already in Anki's " +
  "native text-import format (tab-separated front/back cards). For each " +
  "one: save the file exactly as named into the Downloads folder, then in " +
  "Anki use File > Import and pick it.";

export function buildAnkiSetupPrompt(decks: AnkiDeckFile[]): string {
  return [
    "Please set up Anki on this computer for my Piano Suite chord practice.",
    "Follow these steps in order and tell me when each is done:",
    "",
    "1. If Anki is not installed yet, download and install it from https://apps.ankiweb.net, then open it once and create a profile.",
    "2. Install the AnkiConnect add-on: in Anki open Tools > Add-ons > Get Add-ons..., paste the code 2055492159, click OK, then restart Anki when prompted.",
    "",
    DECK_IMPORT_INSTRUCTION,
    "",
    ...decks.flatMap((deck) => [
      `#### ${deck.title} (${deck.filename})`,
      "```text",
      deck.content,
      "```",
      "",
    ]),
    "4. Verify the setup: AnkiConnect should answer at http://127.0.0.1:8765 while Anki is running.",
    "5. When everything is done, open the Piano Suite Chord Drill and turn on Anki Sync.",
  ].join("\n");
}
