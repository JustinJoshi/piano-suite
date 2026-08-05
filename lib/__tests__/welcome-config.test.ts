import { describe, it, expect } from "vitest";
import {
  defaultWelcomeConfig,
  validateWelcomeConfig,
  type WelcomeConfig,
} from "@/lib/welcome-config";

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

  it("discards invalid feature sections and falls back to defaults", () => {
    const partial = {
      features: {
        sections: [
          { id: "valid", number: "01", label: "ok", title: "Ok", body: ["hello"] },
          { id: "invalid", number: "02", label: "bad", title: "Bad" },
        ],
      },
    } as unknown as WelcomeConfig;
    const validated = validateWelcomeConfig(partial);
    expect(validated.features.sections.length).toBe(
      defaultWelcomeConfig.features.sections.length
    );
    expect(validated.features.sections[0].id).toBe("valid");
    expect(validated.features.sections[0].body).toEqual(["hello"]);
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
});
