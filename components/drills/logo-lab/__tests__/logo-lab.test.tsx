import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LogoLab } from "@/components/drills/logo-lab/logo-lab";
import { DEFAULT_LOGO_MARK_SETTINGS } from "@/lib/logo-mark-settings";

const applySettings = vi.fn();
const resetSettings = vi.fn();

vi.mock("@/hooks/useLogoMarkSettings", () => ({
  useLogoMarkSettings: () => ({
    settings: DEFAULT_LOGO_MARK_SETTINGS,
    applySettings,
    resetSettings,
  }),
}));

describe("LogoLab", () => {
  beforeEach(() => {
    applySettings.mockClear();
    resetSettings.mockClear();
  });

  it("renders preview and apply controls", () => {
    render(<LogoLab />);
    expect(screen.getByTestId("logo-lab-hero-preview")).toBeInTheDocument();
    expect(screen.getByTestId("apply-logo")).toBeInTheDocument();
    expect(screen.getByTestId("reset-logo")).toBeInTheDocument();
  });

  it("calls applySettings with the draft on Apply logo", () => {
    render(<LogoLab />);
    fireEvent.click(screen.getByTestId("apply-logo"));
    expect(applySettings).toHaveBeenCalledTimes(1);
    const arg = applySettings.mock.calls[0]![0];
    expect(arg.mode).toEqual(DEFAULT_LOGO_MARK_SETTINGS.mode);
  });

  it("loads a preset into the draft without applying", () => {
    render(<LogoLab />);
    fireEvent.click(screen.getByTestId("logo-preset-star"));
    expect(applySettings).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("apply-logo"));
    expect(applySettings.mock.calls[0]![0].mode).toEqual([2, 3]);
  });

  it("resets applied logo and draft", () => {
    render(<LogoLab />);
    fireEvent.click(screen.getByTestId("reset-logo"));
    expect(resetSettings).toHaveBeenCalledTimes(1);
  });
});
