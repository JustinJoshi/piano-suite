import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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

const setRouteBackground = vi.fn();
const applyAsAmbientBackground = vi.fn();
const openFloat = vi.fn();

vi.mock("@/hooks/useAmbientEffects", () => ({
  useAmbientEffects: () => ({
    setRouteBackground,
    applyAsAmbientBackground,
    openFloat,
  }),
}));

describe("ChladniRippleLab", () => {
  beforeEach(() => {
    setRouteBackground.mockClear();
    applyAsAmbientBackground.mockClear();
    openFloat.mockClear();
  });

  it("renders MIDI bar, viz, and ripple controls", () => {
    render(<ChladniRippleLab />);

    expect(screen.getByTestId("chladni-visualization")).toBeInTheDocument();
    expect(screen.getByTestId("connect-midi-btn")).toBeInTheDocument();
    expect(screen.getByLabelText("Decay")).toBeInTheDocument();
    expect(screen.getByLabelText("Octave complexity")).toBeInTheDocument();
    expect(screen.getByTestId("active-mode")).toHaveTextContent(/Idle/i);
    expect(screen.getByText("Pitch-class map")).toBeInTheDocument();
  });

  it("exposes ambient actions", () => {
    render(<ChladniRippleLab />);

    fireEvent.click(screen.getByTestId("ripple-use-on-home"));
    expect(setRouteBackground).toHaveBeenCalledWith("/", "chladni-ripple");

    fireEvent.click(screen.getByTestId("ripple-use-everywhere"));
    expect(applyAsAmbientBackground).toHaveBeenCalledWith("chladni-ripple");

    fireEvent.click(screen.getByTestId("ripple-open-float"));
    expect(openFloat).toHaveBeenCalledWith("chladni-ripple");
  });
});
