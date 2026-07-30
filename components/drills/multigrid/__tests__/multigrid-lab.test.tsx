import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MultigridLab } from "../multigrid-lab";
import { DEFAULT_HERO_MULTIGRID_SETTINGS } from "@/lib/multigrid-hero-settings";

const applyFromLab = vi.fn();
const updateSettings = vi.fn();
const resetSettings = vi.fn();
const setKind = vi.fn();
const setRouteBackground = vi.fn();

vi.mock("@/components/drills/multigrid/multigrid-visualization", () => ({
  MultigridVisualization: () => (
    <div data-testid="multigrid-visualization" />
  ),
}));

vi.mock("@/hooks/useHeroMultigridSettings", () => ({
  useHeroMultigridSettings: () => ({
    settings: DEFAULT_HERO_MULTIGRID_SETTINGS,
    applyFromLab,
    updateSettings,
    resetSettings,
  }),
}));

vi.mock("@/hooks/useHeroAtmosphereKind", () => ({
  useHeroAtmosphereKind: () => ({
    kind: "chladni",
    setKind,
  }),
}));

vi.mock("@/hooks/useAmbientEffects", () => ({
  useAmbientEffects: () => ({
    setRouteBackground,
  }),
}));

describe("MultigridLab", () => {
  beforeEach(() => {
    applyFromLab.mockClear();
    updateSettings.mockClear();
    resetSettings.mockClear();
    setKind.mockClear();
    setRouteBackground.mockClear();
  });

  it("renders presets without tiling view mode controls", () => {
    render(<MultigridLab />);
    expect(screen.getByText("Parameters")).toBeInTheDocument();
    expect(screen.getByTestId("multigrid-visualization")).toBeInTheDocument();
    for (const label of ["Penrose", "Ammann", "Socolar", "Dense"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    // Tiling / Both marked for deletion — not exposed in the Lab UI.
    expect(screen.queryByRole("button", { name: "Both" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Tiling" })
    ).not.toBeInTheDocument();
  });

  it("applies to home and sets atmosphere kind", () => {
    render(<MultigridLab />);
    fireEvent.click(screen.getByTestId("apply-to-home"));
    expect(applyFromLab).toHaveBeenCalledTimes(1);
    expect(setKind).toHaveBeenCalledWith("multigrid");
    expect(setRouteBackground).toHaveBeenCalledWith("/", "multigrid");
    expect(screen.getByRole("status")).toHaveTextContent(/Applied/i);
  });

  it("resets home", () => {
    render(<MultigridLab />);
    fireEvent.click(screen.getByTestId("reset-home"));
    expect(resetSettings).toHaveBeenCalled();
    expect(setKind).toHaveBeenCalledWith("multigrid");
    expect(setRouteBackground).toHaveBeenCalledWith("/", "multigrid");
  });
});
