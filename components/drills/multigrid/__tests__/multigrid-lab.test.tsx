import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MultigridLab } from "../multigrid-lab";
import { DEFAULT_HERO_MULTIGRID_SETTINGS } from "@/lib/multigrid-hero-settings";

const applyFromLab = vi.fn();
const updateSettings = vi.fn();
const resetSettings = vi.fn();
const setKind = vi.fn();

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

describe("MultigridLab", () => {
  beforeEach(() => {
    applyFromLab.mockClear();
    updateSettings.mockClear();
    resetSettings.mockClear();
    setKind.mockClear();
  });

  it("renders presets and view modes", () => {
    render(<MultigridLab />);
    expect(screen.getByText("Parameters")).toBeInTheDocument();
    expect(screen.getByTestId("multigrid-visualization")).toBeInTheDocument();
    for (const label of ["Penrose", "Ammann", "Socolar", "Dense"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Both" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tiling" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Grid" })).toBeInTheDocument();
  });

  it("applies to home and sets atmosphere kind", () => {
    render(<MultigridLab />);
    fireEvent.click(screen.getByTestId("apply-to-home"));
    expect(applyFromLab).toHaveBeenCalledTimes(1);
    expect(setKind).toHaveBeenCalledWith("multigrid");
    expect(screen.getByRole("status")).toHaveTextContent(/Applied/i);
  });

  it("resets home", () => {
    render(<MultigridLab />);
    fireEvent.click(screen.getByTestId("reset-home"));
    expect(resetSettings).toHaveBeenCalled();
    expect(setKind).toHaveBeenCalledWith("multigrid");
  });
});
