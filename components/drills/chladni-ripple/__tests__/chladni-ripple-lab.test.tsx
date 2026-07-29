import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChladniRippleLab } from "../chladni-ripple-lab";

vi.mock("@/components/welcome/chladni-visualization", () => ({
  ChladniVisualization: () => <div data-testid="chladni-visualization" />,
}));

vi.mock("@/hooks/useMidi", () => ({
  useMidi: () => ({
    supported: true,
    connected: false,
    error: null,
    inputs: [],
    selectedInputId: null,
    setSelectedInputId: vi.fn(),
    heldNotes: [],
    heldPcs: new Set(),
    connect: vi.fn(),
  }),
}));

vi.mock("@/hooks/useChladniRipple", () => ({
  useChladniRipple: () => ({
    viz: {
      mode: [5, 7] as [number, number],
      nextMode: [5, 7] as [number, number],
      morph: 0,
      secondaryBlend: 0.08,
      lineThickness: 28,
      lineIntensity: 0.45,
      breathe: 0.12,
      activePc: null,
      activeMode: [5, 7] as [number, number],
    },
    controls: {
      decayMs: 1200,
      octaveComplexity: 0.35,
      baseLineThickness: 28,
      baseIntensity: 0.45,
    },
  }),
}));

describe("ChladniRippleLab", () => {
  it("renders MIDI bar, viz, and ripple controls", () => {
    render(<ChladniRippleLab />);

    expect(screen.getByTestId("chladni-visualization")).toBeInTheDocument();
    expect(screen.getByTestId("connect-midi-btn")).toBeInTheDocument();
    expect(screen.getByLabelText("Decay")).toBeInTheDocument();
    expect(screen.getByLabelText("Octave complexity")).toBeInTheDocument();
    expect(screen.getByTestId("active-mode")).toHaveTextContent(/Idle/i);
    expect(screen.getByText("Pitch-class map")).toBeInTheDocument();
  });
});
