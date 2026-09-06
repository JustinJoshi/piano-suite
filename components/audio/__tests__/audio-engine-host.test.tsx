import { afterEach, describe, expect, it, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { AudioEngineHost } from "@/components/audio/audio-engine-host";
import {
  pressVirtualNote,
  releaseVirtualNote,
  releaseAllVirtualNotes,
  __resetMidiSessionForTests,
} from "@/lib/midi-session";
import type { AudioSettings } from "@/lib/audio-settings";

const play = vi.fn();
const stop = vi.fn();

vi.mock("@/lib/audio-engine", () => ({
  createAudioEngine: vi.fn(() => ({
    state: "ready",
    load: vi.fn(() => Promise.resolve()),
    setVolume: vi.fn(),
    play,
    stop,
    stopAll: vi.fn(),
    resumeFromUserGesture: vi.fn(),
    dispose: vi.fn(),
  })),
}));

const settings: AudioSettings = {
  enabled: true,
  musicEnabled: true,
  volume: 0.7,
  preset: "splendid-grand-piano",
  sustain: false,
  customKit: null,
};

vi.mock("@/hooks/useAudioSettings", () => ({
  useAudioSettings: () => ({
    settings,
    setEngineState: vi.fn(),
  }),
}));

describe("AudioEngineHost", () => {
  afterEach(() => {
    releaseAllVirtualNotes();
    __resetMidiSessionForTests();
    play.mockClear();
    stop.mockClear();
  });

  it("plays the very first on-screen note pressed from a fully-released state", () => {
    render(<AudioEngineHost />);

    act(() => {
      pressVirtualNote(60, 90);
    });

    expect(play).toHaveBeenCalledWith(60, 90);
  });

  it("stops the last held note on release", () => {
    render(<AudioEngineHost />);

    act(() => {
      pressVirtualNote(60, 90);
    });
    act(() => {
      releaseVirtualNote(60);
    });

    expect(stop).toHaveBeenCalledWith(60);
  });
});
