import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SongPlayerBlock } from "../song-player-block";

const mockLoadFile = vi.fn();
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockStop = vi.fn();
const mockSetVolume = vi.fn();

// Controllable player context so each test can shape the playback state.
let mockPlayerState: {
  file: { name: string; kind: string; src: string; duration: number } | null;
  state: string;
  isPlaying: boolean;
  duration: number;
  volume: number;
  error: string | null;
} = {
  file: null,
  state: "idle",
  isPlaying: false,
  duration: 0,
  volume: 0.8,
  error: null,
};

vi.mock("@/hooks/useMusicPlayer", () => ({
  useMusicPlayer: () => ({
    ...mockPlayerState,
    loadFile: mockLoadFile,
    play: mockPlay,
    pause: mockPause,
    stop: mockStop,
    setVolume: mockSetVolume,
  }),
  useMusicPlayerProgress: () => 0,
}));

const mockSetMusicEnabled = vi.fn();

vi.mock("@/hooks/useAudioSettings", () => ({
  useAudioSettings: () => ({
    settings: {
      enabled: true,
      musicEnabled: true,
      volume: 0.7,
      preset: "splendid-grand-piano",
      sustain: false,
      customKit: null,
    },
    setMusicEnabled: mockSetMusicEnabled,
  }),
}));

describe("SongPlayerBlock", () => {
  beforeEach(() => {
    mockLoadFile.mockClear();
    mockPlay.mockClear();
    mockPause.mockClear();
    mockStop.mockClear();
    mockSetVolume.mockClear();
    mockSetMusicEnabled.mockClear();
    mockPlayerState = {
      file: null,
      state: "idle",
      isPlaying: false,
      duration: 0,
      volume: 0.8,
      error: null,
    };
  });

  it("renders the music player inside block chrome", () => {
    render(<SongPlayerBlock />);
    expect(screen.getByTestId("song-player-block")).toBeInTheDocument();
    expect(screen.getByTestId("music-upload-btn")).toBeInTheDocument();
  });

  it("startPaused does not auto-play when a file becomes ready", () => {
    mockPlayerState = {
      ...mockPlayerState,
      file: { name: "song.mid", kind: "midi", src: "blob:x", duration: 12 },
      state: "ready",
      isPlaying: false,
      duration: 12,
    };
    render(<SongPlayerBlock startPaused />);
    expect(mockPlay).not.toHaveBeenCalled();
    expect(screen.getByTestId("music-play-pause-btn")).toBeInTheDocument();
  });

  it("renders its empty state rather than crashing when no file is loaded", () => {
    mockPlayerState = {
      ...mockPlayerState,
      file: null,
      state: "idle",
      isPlaying: false,
      duration: 0,
    };
    render(<SongPlayerBlock />);
    expect(screen.getByTestId("song-player-block")).toBeInTheDocument();
    expect(screen.queryByTestId("music-file-name")).not.toBeInTheDocument();
  });

  it("hides the upload button when showUpload is false", () => {
    render(<SongPlayerBlock showUpload={false} />);
    expect(screen.queryByTestId("music-upload-btn")).not.toBeInTheDocument();
  });
});
