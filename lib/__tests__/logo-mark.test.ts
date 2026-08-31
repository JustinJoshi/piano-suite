import { describe, it, expect } from "vitest";
import {
  buildLogoMarkGeometry,
  gridToRects,
  rectsToPathD,
  settingsToSvgString,
  settingsToDataUrl,
  defaultLogoMarkSvg,
  LOGO_MARK_RESOLUTION,
} from "@/lib/logo-mark";
import {
  DEFAULT_LOGO_MARK_SETTINGS,
  isShippingLogoMark,
  normalizeLogoMarkSettings,
} from "@/lib/logo-mark-settings";

describe("normalizeLogoMarkSettings", () => {
  it("returns defaults for empty input", () => {
    expect(normalizeLogoMarkSettings({})).toEqual(DEFAULT_LOGO_MARK_SETTINGS);
    expect(normalizeLogoMarkSettings(null)).toEqual(DEFAULT_LOGO_MARK_SETTINGS);
  });

  it("clamps mode and numeric fields", () => {
    const n = normalizeLogoMarkSettings({
      mode: [99, -3],
      threshold: 2,
      padding: -5,
      zoom: 0.1,
    });
    expect(n.mode).toEqual([16, 1]);
    expect(n.threshold).toBe(0.45);
    expect(n.padding).toBe(0);
    expect(n.zoom).toBe(0.6);
  });
});

describe("isShippingLogoMark", () => {
  it("is true for the untouched default regardless of generation", () => {
    expect(isShippingLogoMark(DEFAULT_LOGO_MARK_SETTINGS)).toBe(true);
    expect(
      isShippingLogoMark({ ...DEFAULT_LOGO_MARK_SETTINGS, generation: 7 })
    ).toBe(true);
  });

  it("is false once any appearance field changes", () => {
    const custom = normalizeLogoMarkSettings({
      ...DEFAULT_LOGO_MARK_SETTINGS,
      mode: [2, 3],
    });
    expect(isShippingLogoMark(custom)).toBe(false);
  });
});

describe("buildLogoMarkGeometry", () => {
  it("produces a non-empty symmetric path for the default mark", () => {
    const geo = buildLogoMarkGeometry(DEFAULT_LOGO_MARK_SETTINGS);
    expect(geo.pathD.length).toBeGreaterThan(20);
    expect(geo.rects.length).toBeGreaterThan(10);
    expect(geo.plate).not.toBeNull();
  });

  it("is 4-fold rotationally symmetric for mode (3,5)", () => {
    const geo = buildLogoMarkGeometry(DEFAULT_LOGO_MARK_SETTINGS, 32);
    const res = 32;
    const cell = (100 - DEFAULT_LOGO_MARK_SETTINGS.padding * 2) / res;
    const pad = DEFAULT_LOGO_MARK_SETTINGS.padding;

    const occupied = new Set<string>();
    for (const r of geo.rects) {
      const i0 = Math.round((r.x - pad) / cell);
      const j0 = Math.round((r.y - pad) / cell);
      const i1 = Math.round((r.x + r.w - pad) / cell);
      for (let i = i0; i < i1; i++) {
        occupied.add(`${i},${j0}`);
      }
    }

    for (const key of occupied) {
      const [is, js] = key.split(",");
      const i = Number(is);
      const j = Number(js);
      // 180° rotational symmetry of the Chladni nodal set on a square plate
      const ri = res - 1 - i;
      const rj = res - 1 - j;
      expect(occupied.has(`${ri},${rj}`)).toBe(true);
    }
  });

  it("omits the plate when showPlate is false", () => {
    const geo = buildLogoMarkGeometry({
      ...DEFAULT_LOGO_MARK_SETTINGS,
      showPlate: false,
    });
    expect(geo.plate).toBeNull();
  });

  it("strokeOnly reduces filled cell count", () => {
    const filled = buildLogoMarkGeometry({
      ...DEFAULT_LOGO_MARK_SETTINGS,
      strokeOnly: false,
    });
    const outline = buildLogoMarkGeometry({
      ...DEFAULT_LOGO_MARK_SETTINGS,
      strokeOnly: true,
    });
    const fillCells = filled.rects.reduce((n, r) => n + r.w / (r.h || 1), 0);
    const outlineCells = outline.rects.reduce(
      (n, r) => n + r.w / (r.h || 1),
      0
    );
    expect(outlineCells).toBeLessThan(fillCells);
  });
});

describe("gridToRects / rectsToPathD", () => {
  it("merges horizontal runs", () => {
    const grid = [
      [true, true, false, true],
      [false, false, false, false],
    ];
    const rects = gridToRects(grid, 0, 4);
    expect(rects).toHaveLength(2);
    expect(rects[0]).toMatchObject({ x: 0, y: 0, w: 2, h: 2 });
    expect(rects[1]).toMatchObject({ x: 3, y: 0, w: 1, h: 2 });
    expect(rectsToPathD(rects)).toContain("M0 0");
  });
});

describe("settingsToSvgString / data URL", () => {
  it("emits a standalone baked SVG for favicons", () => {
    const svg = settingsToSvgString(DEFAULT_LOGO_MARK_SETTINGS, {
      baked: true,
      standalone: true,
    });
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain("#c9a227");
    expect(svg).toContain("#0c0a08");
    expect(svg).toContain("<path");
  });

  it("uses currentColor when not baked and no override", () => {
    const svg = settingsToSvgString(DEFAULT_LOGO_MARK_SETTINGS, {
      baked: false,
    });
    expect(svg).toContain('fill="currentColor"');
  });

  it("builds a data URL", () => {
    const url = settingsToDataUrl(DEFAULT_LOGO_MARK_SETTINGS);
    expect(url.startsWith("data:image/svg+xml")).toBe(true);
  });

  it("defaultLogoMarkSvg is deterministic", () => {
    expect(defaultLogoMarkSvg()).toBe(defaultLogoMarkSvg());
    expect(defaultLogoMarkSvg()).toContain(`viewBox="0 0 100 100"`);
  });

  it("uses LOGO_MARK_RESOLUTION by default", () => {
    const a = buildLogoMarkGeometry(
      DEFAULT_LOGO_MARK_SETTINGS,
      LOGO_MARK_RESOLUTION
    );
    const b = buildLogoMarkGeometry(DEFAULT_LOGO_MARK_SETTINGS);
    expect(a.pathD).toBe(b.pathD);
  });
});
