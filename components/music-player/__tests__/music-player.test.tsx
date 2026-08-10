import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MusicPlayer } from "../music-player";

const mockLoadFile = vi.fn();
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockStop = vi.fn();
const mockSetVolume = vi.fn();

vi.mock("@/hooks/useMusicPlayer", () => ({
  useMusicPlayer: () => ({
    file: null,
    state: "idle",
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 0.8,
    error: null,
    loadFile: mockLoadFile,
    play: mockPlay,
    pause: mockPause,
    stop: mockStop,
    setVolume: mockSetVolume,
  }),
}));

describe("MusicPlayer", () => {
  beforeEach(() => {
    mockLoadFile.mockClear();
    mockPlay.mockClear();
    mockPause.mockClear();
    mockStop.mockClear();
    mockSetVolume.mockClear();
  });

  it("renders upload prompt when no file is loaded", () => {
    render(<MusicPlayer />);
    expect(screen.getByTestId("music-upload-btn")).toBeInTheDocument();
  });

  it("loads a file when selected", () => {
    render(<MusicPlayer />);
    const file = new File(["midi"], "song.mid", { type: "audio/midi" });
    const input = screen.getByTestId("music-file-input");
    fireEvent.change(input, { target: { files: [file] } });
    expect(mockLoadFile).toHaveBeenCalledWith(file);
  });
});
