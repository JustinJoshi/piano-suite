import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MidiConnectionBar } from "../midi-connection-bar";

const setEnabled = vi.fn();

vi.mock("@/hooks/useAudioSettings", () => ({
  useAudioSettings: () => ({
    settings: {
      enabled: true,
      volume: 0.7,
      preset: "splendid-grand-piano",
      customKit: null,
    },
    setEnabled,
    setVolume: vi.fn(),
    setPreset: vi.fn(),
    setCustomKit: vi.fn(),
    loaded: true,
  }),
}));

describe("MidiConnectionBar", () => {
  it("shows a connect button when disconnected", () => {
    render(
      <MidiConnectionBar
        supported
        connected={false}
        error={null}
        inputs={[]}
        selectedInputId={null}
        onSelectInput={vi.fn()}
        onConnect={vi.fn()}
      />
    );

    expect(screen.getByTestId("connect-midi-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("midi-sound-toggle")).not.toBeInTheDocument();
  });

  it("shows the MIDI sound toggle and audio settings link when connected", () => {
    render(
      <MidiConnectionBar
        supported
        connected
        error={null}
        inputs={[{ id: "input-1", name: "Piano Keyboard" }]}
        selectedInputId="input-1"
        onSelectInput={vi.fn()}
        onConnect={vi.fn()}
      />
    );

    expect(screen.getByTestId("midi-sound-toggle")).toBeChecked();
    expect(screen.getByTestId("midi-audio-settings-link")).toHaveAttribute(
      "href",
      "/settings/audio"
    );
  });

  it("toggles MIDI sounds through the settings hook", () => {
    setEnabled.mockClear();

    render(
      <MidiConnectionBar
        supported
        connected
        error={null}
        inputs={[{ id: "input-1", name: "Piano Keyboard" }]}
        selectedInputId="input-1"
        onSelectInput={vi.fn()}
        onConnect={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("midi-sound-toggle"));
    expect(setEnabled).toHaveBeenCalledWith(false);
  });
});
