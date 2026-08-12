import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChladniLab } from "../chladni-lab";
import { DEFAULT_HERO_CHLADNI_SETTINGS } from "@/lib/chladni-hero-settings";

const applyFromLab = vi.fn();
const updateSettings = vi.fn();
const resetSettings = vi.fn();

vi.mock("@/components/welcome/chladni-visualization", () => ({
  ChladniVisualization: () => <div data-testid="chladni-visualization" />,
}));

vi.mock("@/components/drills/saved-patterns-panel", () => ({
  SavedPatternsPanel: () => <div data-testid="saved-patterns-panel" />,
}));

const setKind = vi.fn();

vi.mock("@/hooks/useHeroChladniSettings", () => ({
  useHeroChladniSettings: () => ({
    settings: DEFAULT_HERO_CHLADNI_SETTINGS,
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

describe("ChladniLab", () => {
  beforeEach(() => {
    applyFromLab.mockClear();
    updateSettings.mockClear();
    resetSettings.mockClear();
    setKind.mockClear();
    setRouteBackground.mockClear();
  });

  it("renders the parameter controls and presets", async () => {
    render(<ChladniLab />);

    expect(screen.getByText("Parameters")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("chladni-visualization")).toBeInTheDocument()
    );

    for (const label of ["Star", "Flower", "Lattice", "Maze", "Web"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Random/i })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Pause morph/i })).toBeInTheDocument();

    expect(screen.getByLabelText("Morph", { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText("Line thickness")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom")).toBeInTheDocument();
  });

  it("applies the full lab pattern to home", () => {
    render(<ChladniLab />);

    fireEvent.click(screen.getByTestId("apply-to-home"));

    expect(applyFromLab).toHaveBeenCalledTimes(1);
    const snapshot = applyFromLab.mock.calls[0][0];
    expect(snapshot.mode).toEqual([5, 7]);
    expect(snapshot.lineIntensity).toBe(1);
    expect(snapshot.colorSoftness).toBe(0);
    expect(setKind).toHaveBeenCalledWith("chladni");
    expect(setRouteBackground).toHaveBeenCalledWith("/", "chladni");
    expect(screen.getByRole("status")).toHaveTextContent(/Applied to the welcome page/i);
  });

  it("resets home settings", () => {
    render(<ChladniLab />);

    fireEvent.click(screen.getByTestId("reset-home"));

    expect(resetSettings).toHaveBeenCalledTimes(1);
    expect(setKind).toHaveBeenCalledWith("chladni");
    expect(setRouteBackground).toHaveBeenCalledWith("/", "chladni");
    expect(screen.getByRole("status")).toHaveTextContent(/reset to the default/i);
  });

  it("can clear pattern color back to theme", () => {
    render(<ChladniLab />);

    fireEvent.click(screen.getByTestId("use-theme-color"));

    expect(updateSettings).toHaveBeenCalledWith({ patternColor: null });
  });
});
