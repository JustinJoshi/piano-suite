import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChladniRippleLab } from "../chladni-ripple-lab";
import { floatPanelUpgradeCopy } from "@/lib/billing";

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

const applyRippleBackground = vi.fn();
const setRouteBackground = vi.fn();
const openFloat = vi.fn();
const setDefaultBackground = vi.fn();
const setApplyEverywhere = vi.fn();
const useAuthAccessMock = vi.fn(() => ({
  authDisabled: false,
  isSignedIn: true,
  canAccess: true,
  canPersist: true,
  canUseFloatPanel: true,
}));

const defaultRippleSettings = {
  defaultBackground: "chladni" as const,
  applyEverywhere: false,
  routeBackgrounds: { "/": "chladni" as const },
  float: {
    enabled: false,
    kind: "chladni-ripple" as const,
    routes: [],
    rect: { x: 0.62, y: 0.55, w: 0.32, h: 0.32 },
  },
  scrimDarkness: 0.55,
  ripple: {
    decayMs: 1200,
    octaveComplexity: 0.35,
    baseLineThickness: 28,
    baseIntensity: 0.45,
    zoom: 2.2,
    secondaryOffset: [1, 2] as [number, number],
    secondaryBlend: 0.15,
    secondarySpeed: 1,
    secondaryMotion: 1.5,
    colorSoftness: 0.15,
    timeScale: 1,
  },
};

vi.mock("@/hooks/useAmbientEffects", () => ({
  useAmbientEffects: () => ({
    settings: defaultRippleSettings,
    applyRippleBackground,
    setRouteBackground,
    openFloat,
    setDefaultBackground,
    setApplyEverywhere,
  }),
}));

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: () => useAuthAccessMock(),
}));

vi.mock("@/hooks/useAudioSettings", () => ({
  useAudioSettings: () => ({
    settings: {
      enabled: true,
      volume: 0.7,
      preset: "splendid-grand-piano",
      sustain: false,
      customKit: null,
    },
    setEnabled: vi.fn(),
    setVolume: vi.fn(),
    setPreset: vi.fn(),
    setSustain: vi.fn(),
    setCustomKit: vi.fn(),
    loaded: true,
    engineState: "ready",
    setEngineState: vi.fn(),
  }),
}));

vi.mock("@/components/music-player/music-player", () => ({
  MusicPlayer: () => null,
}));

describe("ChladniRippleLab", () => {
  beforeEach(() => {
    applyRippleBackground.mockClear();
    setRouteBackground.mockClear();
    openFloat.mockClear();
    setDefaultBackground.mockClear();
    setApplyEverywhere.mockClear();
    useAuthAccessMock.mockReturnValue({
      authDisabled: false,
      isSignedIn: true,
      canAccess: true,
      canPersist: true,
      canUseFloatPanel: true,
    });
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

  it("exposes ambient actions for Pro float", () => {
    render(<ChladniRippleLab />);

    fireEvent.click(screen.getByTestId("ripple-use-on-home"));
    expect(applyRippleBackground).toHaveBeenCalledWith(
      defaultRippleSettings.ripple,
      "home"
    );

    fireEvent.click(screen.getByTestId("ripple-use-everywhere"));
    expect(applyRippleBackground).toHaveBeenCalledWith(
      defaultRippleSettings.ripple,
      "everywhere"
    );

    fireEvent.click(screen.getByTestId("ripple-open-float"));
    expect(openFloat).toHaveBeenCalledWith("chladni-ripple");
  });

  it("soft-gates float pop-out for Free users", () => {
    useAuthAccessMock.mockReturnValue({
      authDisabled: false,
      isSignedIn: true,
      canAccess: true,
      canPersist: false,
      canUseFloatPanel: false,
    });

    render(<ChladniRippleLab />);

    fireEvent.click(screen.getByTestId("ripple-open-float"));
    expect(openFloat).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      floatPanelUpgradeCopy("ripple-lab")
    );
    expect(screen.getByTestId("ripple-float-upgrade-link")).toHaveAttribute(
      "href",
      "/pricing"
    );
  });

  it("persists ripple params when applying to ambient", () => {
    render(<ChladniRippleLab />);

    fireEvent.click(screen.getByTestId("ripple-use-on-home"));
    expect(applyRippleBackground).toHaveBeenCalledWith(
      defaultRippleSettings.ripple,
      "home"
    );

    fireEvent.click(screen.getByTestId("ripple-use-everywhere"));
    expect(applyRippleBackground).toHaveBeenCalledWith(
      defaultRippleSettings.ripple,
      "everywhere"
    );
  });

  it("turns off the ripple background", () => {
    render(<ChladniRippleLab />);

    fireEvent.click(screen.getByTestId("ripple-disable-background"));
    expect(setRouteBackground).toHaveBeenCalledWith("/", "none");
    expect(setDefaultBackground).toHaveBeenCalledWith("chladni");
    expect(setApplyEverywhere).toHaveBeenCalledWith(false);
  });

  it("applies presets and shows background status", () => {
    render(<ChladniRippleLab />);

    expect(screen.getByTestId("ripple-background-status")).toHaveTextContent(
      /Off/i
    );
    expect(screen.getByLabelText("Decay")).toHaveValue("1200");

    fireEvent.click(screen.getByTestId("ripple-preset-ambient"));
    expect(screen.getByLabelText("Decay")).toHaveValue("1400");

    fireEvent.click(screen.getByTestId("ripple-reset-params"));
    expect(screen.getByLabelText("Decay")).toHaveValue("1200");
  });
});
