import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AmbientEffectsHost } from "../ambient-effects-host";

vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<{ [key: string]: React.ComponentType }>
  ) => {
    const Comp = (props: Record<string, unknown>) => {
      const name = loader.toString().includes("ambient-float-panel")
        ? "ambient-float-panel"
        : "ambient-background";
      return <div data-testid={name} data-kind={String(props.kind ?? "")} />;
    };
    return Comp;
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/tools/chord-drill",
}));

const useAuthAccessMock = vi.fn(() => ({
  canUseFloatPanel: true,
}));

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: () => useAuthAccessMock(),
}));

vi.mock("@/hooks/useAmbientEffects", () => ({
  useAmbientEffects: () => ({
    settings: {
      float: {
        enabled: true,
        kind: "chladni-ripple",
        routes: [],
        rect: { x: 0.1, y: 0.1, w: 0.3, h: 0.3 },
      },
      scrimDarkness: 0.35,
    },
    backgroundFor: () => "none" as const,
    floatVisibleFor: () => true,
    setFloatEnabled: vi.fn(),
    setFloatRect: vi.fn(),
  }),
}));

describe("AmbientEffectsHost", () => {
  beforeEach(() => {
    useAuthAccessMock.mockReturnValue({ canUseFloatPanel: true });
  });

  it("renders float panel when Pro can use float", () => {
    render(<AmbientEffectsHost />);
    expect(screen.getByTestId("ambient-float-panel")).toBeInTheDocument();
  });

  it("hides float panel for Free even when settings enable it", () => {
    useAuthAccessMock.mockReturnValue({ canUseFloatPanel: false });
    render(<AmbientEffectsHost />);
    expect(screen.queryByTestId("ambient-float-panel")).not.toBeInTheDocument();
  });
});
