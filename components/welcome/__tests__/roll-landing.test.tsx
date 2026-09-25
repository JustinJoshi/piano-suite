import fs from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isSignedIn: false }),
  useAuth: () => ({ isLoaded: true, has: () => false }),
}));
vi.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => vi.fn(async () => undefined),
}));

import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";
import { WelcomeContent } from "@/components/welcome/welcome-content";
import { defaultWelcomeConfig, mergeCopy, validateWelcomeConfig } from "@/lib/welcome-config";
import { starterTemplates } from "@/lib/starter-templates";

function renderLanding() {
  return render(
    <WelcomeConfigProvider>
      <WelcomeContent />
    </WelcomeConfigProvider>
  );
}

describe("the roll landing", () => {
  it("says what Piano Suite is in one sentence, with the italic clause", () => {
    renderLanding();
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("A workshop for building your own piano practice.");
    expect(within(h1).getByText("your own").tagName).toBe("EM");
  });

  it("offers a playable on-screen piano with no MIDI keyboard", () => {
    renderLanding();
    const piano = screen.getByRole("group", { name: /on-screen piano/i });
    expect(within(piano).getAllByRole("button")).toHaveLength(17);
    expect(screen.getAllByText(/no midi keyboard needed/i).length).toBeGreaterThan(0);
  });

  it("links each ready-made drill to its real page", () => {
    renderLanding();
    for (const [name, href] of [
      ["Chord Drill", "/tools/chord-drill"],
      ["Arpeggios", "/tools/arpeggios"],
      ["Progressions", "/tools/progression"],
      ["Root Cycling", "/tools/root-cycling"],
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("lists the ten ready-made pages from the starter registry", () => {
    for (const id of defaultWelcomeConfig.roll.pages.starterIds) {
      expect(starterTemplates.some((t) => t.id === id), id).toBe(true);
    }
    const { container } = renderLanding();
    expect(container.querySelectorAll(".roll-entry")).toHaveLength(10);
  });

  it("links only to articles that exist", () => {
    for (const { slug } of defaultWelcomeConfig.roll.reading.items) {
      expect(fs.existsSync(path.join(process.cwd(), "articles", `${slug}.md`)), slug).toBe(true);
    }
  });

  it("keeps Anki deck downloads and the Founding Pro waitlist", () => {
    renderLanding();
    expect(screen.getAllByRole("link", { name: /chord symbols/i })).toHaveLength(2);
    expect(screen.getByRole("link", { name: /join the founding pro waitlist/i })).toHaveAttribute("href", "/pricing");
  });
});

describe("mergeCopy", () => {
  it("keeps stored strings and falls back field by field", () => {
    const merged = validateWelcomeConfig({
      roll: { fine: { word: "Fin" }, drills: { items: "nope" }, reading: { items: [{ slug: 3 }] } },
    });
    expect(merged.roll.fine.word).toBe("Fin");
    expect(merged.roll.fine.text).toBe(defaultWelcomeConfig.roll.fine.text);
    expect(merged.roll.drills.items).toEqual(defaultWelcomeConfig.roll.drills.items);
    expect(merged.roll.reading.items).toEqual(defaultWelcomeConfig.roll.reading.items);
  });

  it("never lets an array change length", () => {
    expect(mergeCopy(["a", "b"], ["x"])).toEqual(["a", "b"]);
    expect(mergeCopy(["a", "b"], ["x", "y"])).toEqual(["x", "y"]);
  });
});
