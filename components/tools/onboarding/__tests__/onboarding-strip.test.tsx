import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { OnboardingStrip } from "@/components/tools/onboarding/onboarding-strip";
import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

function renderStrip() {
  return render(
    <WelcomeConfigProvider>
      <OnboardingStrip />
    </WelcomeConfigProvider>
  );
}

describe("OnboardingStrip", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("renders when the storage key is absent", () => {
    renderStrip();
    expect(screen.getByTestId("onboarding-strip")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /take the tour/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
  });

  it("does not render when the tour is already completed", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    const { container } = renderStrip();
    expect(container).toBeEmptyDOMElement();
  });

  it("Dismiss writes the storage key and unmounts the strip", () => {
    renderStrip();
    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("true");
    expect(screen.queryByTestId("onboarding-strip")).not.toBeInTheDocument();
  });

  it("Take the tour mounts the onboarding overlay", () => {
    renderStrip();
    expect(
      screen.queryByTestId("onboarding-shell")
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /take the tour/i }));
    expect(screen.getByTestId("onboarding-shell")).toBeInTheDocument();
    // Strip stays in flow behind the overlay.
    expect(screen.getByTestId("onboarding-strip")).toBeInTheDocument();
  });

  it("the strip is in normal flow, never fixed", () => {
    const { container } = renderStrip();
    const strip = container.querySelector('[data-testid="onboarding-strip"]');
    expect(strip).not.toBeNull();
    expect(strip).not.toHaveClass("fixed");
  });
});
