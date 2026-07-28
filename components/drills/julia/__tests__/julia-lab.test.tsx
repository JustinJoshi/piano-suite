import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { JuliaLab } from "../julia-lab";

vi.mock("@/components/drills/julia/julia-visualization", () => ({
  JuliaVisualization: () => <div data-testid="julia-visualization" />,
}));

describe("JuliaLab", () => {
  it("renders the parameter controls and presets", () => {
    render(<JuliaLab />);

    expect(screen.getByText("Parameters")).toBeInTheDocument();
    expect(screen.getByTestId("julia-visualization")).toBeInTheDocument();

    for (const label of ["Seahorse", "Dendrite", "Spiral", "Dragon", "Dust"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Random/i })).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Pause morph/i })).toBeInTheDocument();

    expect(screen.getByLabelText("Morph", { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom")).toBeInTheDocument();
    expect(screen.getByLabelText("Max iterations")).toBeInTheDocument();
    expect(screen.getByLabelText("Escape radius")).toBeInTheDocument();
    expect(screen.getByLabelText("Color softness")).toBeInTheDocument();
  });
});
