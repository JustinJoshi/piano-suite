import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { Onboarding } from "@/components/tools/onboarding";
import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";
import { ONBOARDING_STORAGE_KEY } from "@/lib/onboarding";

function renderWithInstantSearch() {
  window.history.replaceState({}, "", "?onboarding=instant");
  return render(
    <WelcomeConfigProvider>
      <Onboarding />
    </WelcomeConfigProvider>
  );
}

describe("Onboarding", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, "", "?onboarding=instant");
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("renders the intro slide on first visit", () => {
    renderWithInstantSearch();
    expect(screen.getByText("Hi")).toBeInTheDocument();
    expect(screen.getByText("welcome to piano suite")).toBeInTheDocument();
  });

  it("advances to the pillars overview after clicking Next", () => {
    renderWithInstantSearch();
    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);
    expect(
      screen.getByText(/three most important pillars/i)
    ).toBeInTheDocument();
  });

  it("advances through all pillar slides and closes", () => {
    renderWithInstantSearch();

    // Intro -> overview
    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);

    // Overview -> pillar 1
    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);
    expect(
      screen.getByText("Active recall & spaced repetition")
    ).toBeInTheDocument();

    // Pillar 1 -> pillar 2
    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);
    expect(screen.getByText("Take care of yourself")).toBeInTheDocument();

    // Pillar 2 -> pillar 3
    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);
    expect(screen.getByText("Manage your frustrations")).toBeInTheDocument();

    // Pillar 3 -> closing
    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);
    expect(screen.getByText("Happy learning")).toBeInTheDocument();

    // Closing -> complete
    fireEvent.click(screen.getByRole("button", { name: /let's practice/i }));
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("true");
  });

  it("skips the flow and marks complete", () => {
    renderWithInstantSearch();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("true");
  });

  it("does not render when already completed", () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    const { container } = renderWithInstantSearch();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders resource cards with external links", () => {
    renderWithInstantSearch();
    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);

    expect(screen.getByText("Anki")).toBeInTheDocument();
    expect(screen.getByText("Dr. Barbara Oakley")).toBeInTheDocument();
    expect(screen.getByText("Active recall research")).toBeInTheDocument();

    const ankiLink = screen.getByText("Anki").closest("a");
    expect(ankiLink).toHaveAttribute("href", "https://apps.ankiweb.net/");
    expect(ankiLink).toHaveAttribute("target", "_blank");
  });
});
