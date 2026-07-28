import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChladniLab } from "../chladni-lab";

vi.mock("@/components/welcome/chladni-visualization", () => ({
  ChladniVisualization: () => <div data-testid="chladni-visualization" />,
}));

describe("ChladniLab", () => {
  it("renders the parameter controls and presets", () => {
    render(<ChladniLab />);

    expect(screen.getByText("Parameters")).toBeInTheDocument();
    expect(screen.getByTestId("chladni-visualization")).toBeInTheDocument();

    // Preset buttons.
    for (const label of ["Star", "Flower", "Lattice", "Maze", "Web"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Random/i })).toBeInTheDocument();

    // Play/pause morph toggle.
    expect(screen.getByRole("button", { name: /Pause morph/i })).toBeInTheDocument();

    // Range inputs for continuous parameters.
    expect(screen.getByLabelText("Morph", { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText("Line thickness")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom")).toBeInTheDocument();
  });
});
