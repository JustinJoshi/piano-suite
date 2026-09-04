import { describe, it, expect } from "vitest";
import {
  defaultWelcomeConfig,
  validateWelcomeConfig,
  type WelcomeConfig,
} from "@/lib/welcome-config";
import { drillTools } from "@/lib/tools";

describe("welcome-config", () => {
  it("default config round-trips through validation unchanged", () => {
    const validated = validateWelcomeConfig(defaultWelcomeConfig);
    expect(validated).toEqual(defaultWelcomeConfig);
  });

  it("fills missing fields from defaults", () => {
    const partial = { hero: { headline: "Custom headline" } } as unknown as WelcomeConfig;
    const validated = validateWelcomeConfig(partial);
    expect(validated.hero.headline).toBe("Custom headline");
    expect(validated.hero.subheadline).toBe(defaultWelcomeConfig.hero.subheadline);
    expect(validated.features.sections.length).toBe(
      defaultWelcomeConfig.features.sections.length
    );
  });

  it("falls back to defaults for invalid enum values", () => {
    const partial = {
      styleTokens: {
        sectionSpacing: "huge",
        cardRadius: "round",
        headingFont: "comic",
        bodyFont: "serif",
        backgroundEffect: "fireworks",
      },
    } as unknown as WelcomeConfig;
    const validated = validateWelcomeConfig(partial);
    expect(validated.styleTokens.sectionSpacing).toBe(
      defaultWelcomeConfig.styleTokens.sectionSpacing
    );
    expect(validated.styleTokens.cardRadius).toBe(
      defaultWelcomeConfig.styleTokens.cardRadius
    );
    expect(validated.styleTokens.headingFont).toBe(
      defaultWelcomeConfig.styleTokens.headingFont
    );
  });

  it("discards invalid feature sections and keeps valid ones", () => {
    const partial = {
      features: {
        sections: [
          { id: "valid", number: "01", label: "ok", title: "Ok", body: ["hello"] },
          { id: "invalid", number: "02", label: "bad", title: "Bad" },
        ],
      },
    } as unknown as WelcomeConfig;
    const validated = validateWelcomeConfig(partial);
    expect(validated.features.sections.length).toBe(1);
    expect(validated.features.sections[0].id).toBe("valid");
    expect(validated.features.sections[0].body).toEqual(["hello"]);
  });

  it("falls back to default sections when none are valid", () => {
    const partial = {
      features: {
        sections: [
          { id: "invalid", number: "02", label: "bad", title: "Bad" },
        ],
      },
    } as unknown as WelcomeConfig;
    const validated = validateWelcomeConfig(partial);
    expect(validated.features.sections.length).toBe(
      defaultWelcomeConfig.features.sections.length
    );
  });

  it("discards invalid onboarding pillars", () => {
    const partial = {
      onboarding: {
        pillars: [
          {
            id: "bad-pillar",
            headline: "Bad",
            body: [],
            nextDelayMs: 0,
            resources: [],
          },
        ],
      },
    } as unknown as WelcomeConfig;
    const validated = validateWelcomeConfig(partial);
    expect(validated.onboarding.pillars).toEqual(
      defaultWelcomeConfig.onboarding.pillars
    );
  });

  it("ignores non-object input and returns defaults", () => {
    expect(validateWelcomeConfig(null)).toEqual(defaultWelcomeConfig);
    expect(validateWelcomeConfig("nope")).toEqual(defaultWelcomeConfig);
    expect(validateWelcomeConfig(42)).toEqual(defaultWelcomeConfig);
  });

  describe("Audit 1 — Workshop-first landing page", () => {
    it("TC1: hero headline mentions building or workshop, not tools", () => {
      const headline = defaultWelcomeConfig.hero.headline.toLowerCase();
      expect(
        headline.includes("build") || headline.includes("workshop") || headline.includes("practice")
      ).toBe(true);
      expect(headline.includes("tools built for")).toBe(false);
    });

    it("TC1: hero CTA points to /start (three-door chooser)", () => {
      expect(defaultWelcomeConfig.hero.ctaHref).toBe("/start");
    });

    it("Phase 2.1: play and build doors lead to different places", () => {
      const play = defaultWelcomeConfig.doors.items.find((d) => d.id === "play")!;
      const build = defaultWelcomeConfig.doors.items.find((d) => d.id === "build")!;
      expect(play.href).not.toBe(build.href);
    });

    it("Phase 2.1: play door opens a public ready-made drill", () => {
      const play = defaultWelcomeConfig.doors.items.find((d) => d.id === "play")!;
      // The four drillTools hrefs are exactly the proxy's public drill
      // routes, so this keeps the Play door on a route a signed-out
      // visitor can actually open.
      expect(drillTools.map((t) => t.href)).toContain(play.href);
    });

    it("TC1: hero subheadline mentions blocks, templates, or building", () => {
      const sub = defaultWelcomeConfig.hero.subheadline.toLowerCase();
      expect(
        sub.includes("block") || sub.includes("template") || sub.includes("build")
      ).toBe(true);
    });

    it("TC2: feature sections reduced from 6 to 4", () => {
      expect(defaultWelcomeConfig.features.sections.length).toBe(4);
    });

    it("TC2: first section is not why-it-works (the chord-drill essay opener)", () => {
      expect(defaultWelcomeConfig.features.sections[0].id).not.toBe("why-it-works");
    });

    it("TC2: sections include Workshop-first ids", () => {
      const ids = defaultWelcomeConfig.features.sections.map((s) => s.id);
      expect(ids).toContain("build-your-practice");
      expect(ids).toContain("start-from-something-that-works");
    });

    it("TC3: flow steps do not contain anki as a label", () => {
      const labels = defaultWelcomeConfig.flow.steps.map((s) => s.label);
      expect(labels).not.toContain("anki");
    });

    it("TC3: flow steps describe the Workshop workflow", () => {
      const ids = defaultWelcomeConfig.flow.steps.map((s) => s.id);
      expect(ids).toContain("pick");
      expect(ids).toContain("build");
      expect(ids).toContain("play");
    });

    it("TC4: toolsGrid is re-titled away from the toolkit", () => {
      expect(defaultWelcomeConfig.toolsGrid.title).not.toBe("Tools that grow with you");
      expect(defaultWelcomeConfig.toolsGrid.eyebrow).not.toBe("the toolkit");
    });

    it("TC6: Anki content is preserved in a feature section", () => {
      const allBody = defaultWelcomeConfig.features.sections
        .flatMap((s) => s.body)
        .join(" ")
        .toLowerCase();
      expect(allBody).toContain("anki");
    });

    it("TC6: companion deck downloads are still in the config", () => {
      expect(defaultWelcomeConfig.decks.items.length).toBe(2);
      expect(defaultWelcomeConfig.decks.items[0].href).toContain("chord-symbols");
    });
  });
});
