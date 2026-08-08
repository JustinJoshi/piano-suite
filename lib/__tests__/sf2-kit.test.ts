import { describe, it, expect, vi } from "vitest";
import { parseSf2Instruments, createSf2Sampler } from "@/lib/sf2-kit";

const instrumentNames = ["Grand Piano", "Bright Piano", ""];

vi.mock("soundfont2", () => ({
  SoundFont2: function SoundFont2Mock() {
    return {
      presets: instrumentNames.map((name) => ({
        header: { name },
      })),
    };
  },
}));

const loadInstrumentMock = vi.fn().mockResolvedValue(undefined);
const mockSampler = {
  ready: Promise.resolve(),
  output: { volume: 100 },
  loadInstrument: loadInstrumentMock,
};

vi.mock("smplr", () => ({
  Soundfont2: vi.fn(() => mockSampler),
}));

describe("parseSf2Instruments", () => {
  it("extracts preset names from an sf2 buffer and filters empty names", async () => {
    const names = await parseSf2Instruments(new ArrayBuffer(8));
    expect(names).toEqual(["Grand Piano", "Bright Piano"]);
  });
});

describe("createSf2Sampler", () => {
  it("creates a sampler and loads the selected instrument", async () => {
    const context = {} as AudioContext;
    const sampler = await createSf2Sampler(context, "blob:url", "Grand Piano");
    expect(sampler).toBe(mockSampler);
    expect(loadInstrumentMock).toHaveBeenCalledWith("Grand Piano");
  });
});
