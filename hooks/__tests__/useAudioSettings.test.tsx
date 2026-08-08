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

function Reader({ label }: { label: string }) {
  const { settings } = useAudioSettings();
  return (
    <div data-testid={label}>
      {settings.preset}-{settings.enabled ? "on" : "off"}
    </div>
  );
}

function Setter() {
  const { setPreset } = useAudioSettings();
  return (
    <button
      data-testid="set-preset"
      onClick={() => setPreset("fluidr3-piano")}
    >
      Change preset
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
        <Setter />
      </AudioSettingsProvider>
    );

    expect(screen.getByTestId("reader-a")).toHaveTextContent(
      "splendid-grand-piano-on"
    );
    expect(screen.getByTestId("reader-b")).toHaveTextContent(
      "splendid-grand-piano-on"
    );

    fireEvent.click(screen.getByTestId("set-preset"));

    expect(screen.getByTestId("reader-a")).toHaveTextContent(
      "fluidr3-piano-on"
    );
    expect(screen.getByTestId("reader-b")).toHaveTextContent(
      "fluidr3-piano-on"
    );
    expect(localStorage.getItem(AUDIO_SETTINGS_LOCAL_STORAGE_KEY)).toContain(
      "fluidr3-piano"
    );
  });
});
