import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuasiperiodicLab } from "../quasiperiodic-lab";
import { DEFAULT_HERO_QUASIPERIODIC_SETTINGS } from "@/lib/quasiperiodic-hero-settings";

const applyFromLab = vi.fn();
const updateSettings = vi.fn();
const resetSettings = vi.fn();
const setKind = vi.fn();

vi.mock("@/components/drills/quasiperiodic/quasiperiodic-visualization", () => ({
  QuasiperiodicVisualization: () => (
    <div data-testid="quasiperiodic-visualization" />
  ),
}));

vi.mock("@/hooks/useHeroQuasiperiodicSettings", () => ({
  useHeroQuasiperiodicSettings: () => ({
    settings: DEFAULT_HERO_QUASIPERIODIC_SETTINGS,
    applyFromLab,
    updateSettings,
    resetSettings,
    setSettings: vi.fn(),
  }),
}));

vi.mock("@/hooks/useHeroAtmosphereKind", () => ({
  useHeroAtmosphereKind: () => ({
    kind: "chladni",
    setKind,
  }),
}));

const setRouteBackground = vi.fn();

vi.mock("@/hooks/useAmbientEffects", () => ({
  useAmbientEffects: () => ({
    setRouteBackground,
  }),
}));

describe("QuasiperiodicLab", () => {
  beforeEach(() => {
    applyFromLab.mockClear();
    updateSettings.mockClear();
    resetSettings.mockClear();
    setKind.mockClear();
    setRouteBackground.mockClear();
  });

  it("renders the parameter controls and presets", () => {
    render(<QuasiperiodicLab />);

    expect(screen.getByText("Parameters")).toBeInTheDocument();
    expect(
      screen.getByTestId("quasiperiodic-visualization")
    ).toBeInTheDocument();

    for (const label of [
      "Lattice",
      "Snowflake",
      "Pentagrid",
      "Hept",
      "Starburst",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Random/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Pause morph/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Morph", { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText("Line thickness")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom")).toBeInTheDocument();
  });

  it("applies the full lab pattern to home and sets atmosphere kind", () => {
    render(<QuasiperiodicLab />);

    fireEvent.click(screen.getByTestId("apply-to-home"));

    expect(applyFromLab).toHaveBeenCalledTimes(1);
    const snapshot = applyFromLab.mock.calls[0][0];
    expect(snapshot.recipe.folds).toBe(5);
    expect(snapshot.lineIntensity).toBe(1);
    expect(snapshot.colorSoftness).toBe(0);
    expect(setKind).toHaveBeenCalledWith("quasiperiodic");
    expect(setRouteBackground).toHaveBeenCalledWith("/", "quasiperiodic");
    expect(screen.getByRole("status")).toHaveTextContent(
      /Applied to the welcome page/i
    );
  });

  it("resets home settings and sets atmosphere kind", () => {
    render(<QuasiperiodicLab />);

    fireEvent.click(screen.getByTestId("reset-home"));

    expect(resetSettings).toHaveBeenCalledTimes(1);
    expect(setKind).toHaveBeenCalledWith("quasiperiodic");
    expect(setRouteBackground).toHaveBeenCalledWith("/", "quasiperiodic");
    expect(screen.getByRole("status")).toHaveTextContent(/reset to the default/i);
  });

  it("can clear pattern color back to theme", () => {
    render(<QuasiperiodicLab />);

    fireEvent.click(screen.getByTestId("use-theme-color"));

    expect(updateSettings).toHaveBeenCalledWith({ patternColor: null });
  });
});
