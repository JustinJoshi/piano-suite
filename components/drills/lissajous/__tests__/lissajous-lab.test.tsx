import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LissajousLab } from "../lissajous-lab";

vi.mock("@/components/drills/lissajous/lissajous-visualization", () => ({
  LissajousVisualization: () => (
    <div data-testid="lissajous-visualization" />
  ),
}));

describe("LissajousLab", () => {
  it("renders the parameter controls and presets", () => {
    render(<LissajousLab />);

    expect(screen.getByText("Parameters")).toBeInTheDocument();
    expect(screen.getByTestId("lissajous-visualization")).toBeInTheDocument();

    for (const label of [
      "Unison",
      "Octave",
      "Fifth",
      "Fourth",
      "Major 3rd",
      "Minor 3rd",
      "Minor 6th",
      "Tritone-ish",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: /Random/i })).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Pause morph/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/3:2 — Perfect fifth/)).toBeInTheDocument();
    expect(screen.getByLabelText("Morph", { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText("Sweep speed")).toBeInTheDocument();
    expect(screen.getByLabelText("Trail length")).toBeInTheDocument();
    expect(screen.getByLabelText("Line thickness")).toBeInTheDocument();
    expect(screen.getByLabelText("Zoom")).toBeInTheDocument();
    expect(screen.getByLabelText("Color softness")).toBeInTheDocument();
  });
});
