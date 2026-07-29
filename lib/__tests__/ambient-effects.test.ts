import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  DEFAULT_AMBIENT_EFFECTS,
  heroKindToAmbient,
  normalizeAmbientEffects,
  resolveBackgroundKind,
  resolveFloatVisible,
  type AmbientEffectsSettings,
} from "@/lib/ambient-effects";

describe("normalizeAmbientEffects", () => {
  it("returns defaults for empty input", () => {
    expect(normalizeAmbientEffects({})).toEqual(DEFAULT_AMBIENT_EFFECTS);
    expect(normalizeAmbientEffects(null)).toEqual(DEFAULT_AMBIENT_EFFECTS);
  });

  it("clamps scrim and float rect", () => {
    const next = normalizeAmbientEffects({
      scrimDarkness: 2,
      float: {
        enabled: true,
        kind: "julia",
        routes: ["/tools/chord-drill"],
        rect: { x: -1, y: 2, w: 2, h: 0.01 },
      },
    });
    expect(next.scrimDarkness).toBe(1);
    expect(next.float.enabled).toBe(true);
    expect(next.float.kind).toBe("julia");
    expect(next.float.routes).toEqual(["/tools/chord-drill"]);
    expect(next.float.rect.w).toBeLessThanOrEqual(0.9);
    expect(next.float.rect.h).toBeGreaterThanOrEqual(0.12);
    expect(next.float.rect.x).toBeGreaterThanOrEqual(0);
    expect(next.float.rect.y).toBeLessThanOrEqual(1 - next.float.rect.h);
  });

  it("drops invalid route kinds", () => {
    const next = normalizeAmbientEffects({
      routeBackgrounds: {
        "/": "chladni",
        "/tools/tracking": "bogus" as never,
        "/tools/arpeggios": "lissajous",
      },
    });
    expect(next.routeBackgrounds["/"]).toBe("chladni");
    expect(next.routeBackgrounds["/tools/arpeggios"]).toBe("lissajous");
    expect(next.routeBackgrounds["/tools/tracking"]).toBeUndefined();
  });

  it("rejects float kind none", () => {
    const next = normalizeAmbientEffects({
      float: {
        enabled: true,
        kind: "none" as never,
        routes: [],
        rect: DEFAULT_AMBIENT_EFFECTS.float.rect,
      },
    });
    expect(next.float.kind).toBe(DEFAULT_AMBIENT_EFFECTS.float.kind);
  });
});

describe("resolveBackgroundKind", () => {
  const base: AmbientEffectsSettings = {
    ...DEFAULT_AMBIENT_EFFECTS,
    defaultBackground: "chladni",
    applyEverywhere: false,
    routeBackgrounds: {
      "/": "chladni",
      "/tools/chord-drill": "chladni-ripple",
      "/tools/tracking": "none",
    },
  };

  it("uses explicit route override", () => {
    expect(resolveBackgroundKind("/tools/chord-drill", base)).toBe(
      "chladni-ripple"
    );
    expect(resolveBackgroundKind("/tools/tracking", base)).toBe("none");
  });

  it("falls back to none when no override and not applyEverywhere", () => {
    expect(resolveBackgroundKind("/tools/arpeggios", base)).toBe("none");
  });

  it("uses defaultBackground when applyEverywhere", () => {
    const everywhere = { ...base, applyEverywhere: true, routeBackgrounds: {} };
    expect(resolveBackgroundKind("/tools/arpeggios", everywhere)).toBe(
      "chladni"
    );
  });

  it("explicit none wins over applyEverywhere", () => {
    const everywhere = {
      ...base,
      applyEverywhere: true,
      routeBackgrounds: { "/tools/tracking": "none" as const },
    };
    expect(resolveBackgroundKind("/tools/tracking", everywhere)).toBe("none");
  });

  it("home falls back to defaultBackground without override", () => {
    const noHome = {
      ...base,
      defaultBackground: "quasiperiodic" as const,
      routeBackgrounds: {},
    };
    expect(resolveBackgroundKind("/", noHome)).toBe("quasiperiodic");
  });
});

describe("resolveFloatVisible", () => {
  it("is false when disabled", () => {
    expect(
      resolveFloatVisible("/", {
        ...DEFAULT_AMBIENT_EFFECTS,
        float: { ...DEFAULT_AMBIENT_EFFECTS.float, enabled: false },
      })
    ).toBe(false);
  });

  it("shows on all routes when routes list is empty", () => {
    expect(
      resolveFloatVisible("/tools/arpeggios", {
        ...DEFAULT_AMBIENT_EFFECTS,
        float: {
          ...DEFAULT_AMBIENT_EFFECTS.float,
          enabled: true,
          routes: [],
        },
      })
    ).toBe(true);
  });

  it("filters by routes list", () => {
    const settings: AmbientEffectsSettings = {
      ...DEFAULT_AMBIENT_EFFECTS,
      float: {
        ...DEFAULT_AMBIENT_EFFECTS.float,
        enabled: true,
        routes: ["/tools/arpeggios"],
      },
    };
    expect(resolveFloatVisible("/tools/arpeggios", settings)).toBe(true);
    expect(resolveFloatVisible("/tools/chord-drill", settings)).toBe(false);
  });
});

describe("heroKindToAmbient", () => {
  it("maps hero kinds", () => {
    expect(heroKindToAmbient("chladni")).toBe("chladni");
    expect(heroKindToAmbient("quasiperiodic")).toBe("quasiperiodic");
  });
});

describe("localStorage helpers", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("round-trips settings", async () => {
    const {
      writeAmbientEffectsToLocalStorage,
      readAmbientEffectsFromLocalStorage,
    } = await import("@/lib/ambient-effects");
    const value = normalizeAmbientEffects({
      defaultBackground: "julia",
      applyEverywhere: true,
    });
    writeAmbientEffectsToLocalStorage(value);
    expect(readAmbientEffectsFromLocalStorage()).toEqual(value);
  });
});
