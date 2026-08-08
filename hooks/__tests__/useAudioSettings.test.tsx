import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  AudioSettingsProvider,
  useAudioSettings,
} from "@/hooks/useAudioSettings";
import { AUDIO_SETTINGS_LOCAL_STORAGE_KEY } from "@/lib/audio-settings";

const useAuthAccessMock = vi.fn(() => ({
  authDisabled: false,
  isSignedIn: false,
  canAccess: false,
  canPersist: false,
  canUseFloatPanel: false,
}));

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: () => useAuthAccessMock(),
}));

vi.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => vi.fn(),
}));

vi.mock("@/lib/audio-engine", () => ({
  createAudioEngine: () => ({
    load: () => Promise.resolve(),
    dispose: () => {},
    state: "ready",
  }),
}));

function Reader({ label }: { label: string }) {
  const { settings } = useAudioSettings();
  return (
    <div data-testid={label}>
      {settings.preset}-{settings.enabled ? "on" : "off"}-
      {settings.sustain ? "sus" : "nosus"}
    </div>
  );
}

function PresetSetter() {
  const { setPreset } = useAudioSettings();
  return (
    <button
      data-testid="set-preset"
      onClick={() => setPreset("fluidr3-acoustic-grand-piano")}
    >
      Change preset
    </button>
  );
}

function SustainSetter() {
  const { setSustain } = useAudioSettings();
  return (
    <button data-testid="set-sustain" onClick={() => setSustain(true)}>
      Enable sustain
    </button>
  );
}

function EngineStateReader({ label }: { label: string }) {
  const { engineState } = useAudioSettings();
  return <div data-testid={label}>{engineState}</div>;
}

function EngineStateSetter() {
  const { setEngineState } = useAudioSettings();
  return (
    <button data-testid="set-loading" onClick={() => setEngineState("loading")}>
      Set loading
    </button>
  );
}

describe("AudioSettingsProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shares preset changes immediately across consumers", () => {
    render(
      <AudioSettingsProvider>
        <Reader label="reader-a" />
        <Reader label="reader-b" />
        <PresetSetter />
      </AudioSettingsProvider>
    );

    expect(screen.getByTestId("reader-a")).toHaveTextContent(
      "splendid-grand-piano-on-nosus"
    );
    expect(screen.getByTestId("reader-b")).toHaveTextContent(
      "splendid-grand-piano-on-nosus"
    );

    fireEvent.click(screen.getByTestId("set-preset"));

    expect(screen.getByTestId("reader-a")).toHaveTextContent(
      "fluidr3-acoustic-grand-piano-on-nosus"
    );
    expect(screen.getByTestId("reader-b")).toHaveTextContent(
      "fluidr3-acoustic-grand-piano-on-nosus"
    );
    expect(localStorage.getItem(AUDIO_SETTINGS_LOCAL_STORAGE_KEY)).toContain(
      "fluidr3-acoustic-grand-piano"
    );
  });

  it("shares sustain changes immediately across consumers", () => {
    render(
      <AudioSettingsProvider>
        <Reader label="reader-a" />
        <Reader label="reader-b" />
        <SustainSetter />
      </AudioSettingsProvider>
    );

    fireEvent.click(screen.getByTestId("set-sustain"));

    expect(screen.getByTestId("reader-a")).toHaveTextContent(
      "splendid-grand-piano-on-sus"
    );
    expect(screen.getByTestId("reader-b")).toHaveTextContent(
      "splendid-grand-piano-on-sus"
    );
  });

  it("shares engine state changes across consumers", () => {
    render(
      <AudioSettingsProvider>
        <EngineStateReader label="engine-a" />
        <EngineStateReader label="engine-b" />
        <EngineStateSetter />
      </AudioSettingsProvider>
    );

    expect(screen.getByTestId("engine-a")).toHaveTextContent("idle");
    expect(screen.getByTestId("engine-b")).toHaveTextContent("idle");

    fireEvent.click(screen.getByTestId("set-loading"));

    expect(screen.getByTestId("engine-a")).toHaveTextContent("loading");
    expect(screen.getByTestId("engine-b")).toHaveTextContent("loading");
  });
});
