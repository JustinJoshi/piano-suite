import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DoorChooser } from "@/components/welcome/door-chooser";
import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";

const captureEvent = vi.fn();

vi.mock("@/lib/analytics", () => ({
  captureEvent: (...args: unknown[]) => captureEvent(...args),
}));

function renderChooser() {
  return render(
    <WelcomeConfigProvider>
      <DoorChooser />
    </WelcomeConfigProvider>
  );
}

describe("DoorChooser (three doors)", () => {
  beforeEach(() => {
    captureEvent.mockClear();
  });

  it("emits door_clicked with the door id for a primary door", () => {
    renderChooser();
    fireEvent.click(screen.getByTestId("door-play"));
    expect(captureEvent).toHaveBeenCalledWith("door_clicked", { doorId: "play" });
  });

  it("emits door_clicked with the door id for the secondary door", () => {
    renderChooser();
    fireEvent.click(screen.getByTestId("door-learn"));
    expect(captureEvent).toHaveBeenCalledWith("door_clicked", { doorId: "learn" });
  });

  it("renders exactly three doors", () => {
    renderChooser();
    for (const id of ["door-play", "door-build", "door-learn"]) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
    expect(
      document.querySelectorAll("[data-testid^='door-']")
    ).toHaveLength(3);
  });

  it("each door has a label, one line of copy, and a working href", () => {
    renderChooser();

    const play = screen.getByTestId("door-play");
    expect(play).toHaveAttribute("href", "/tools/chord-drill");
    expect(play).toHaveTextContent(/just want to play/i);

    const build = screen.getByTestId("door-build");
    expect(build).toHaveAttribute("href", "/tools/workshop");
    expect(build).toHaveTextContent(/snap a few blocks together/i);

    const learn = screen.getByTestId("door-learn");
    expect(learn).toHaveAttribute("href", "/articles");
    expect(learn).toHaveTextContent(/read first/i);
  });

  it("renders an icon per door", () => {
    renderChooser();
    for (const id of ["play", "build", "learn"]) {
      expect(screen.getByTestId(`door-${id}`).querySelector("svg")).toBeTruthy();
    }
  });

  it("weights Play and Build above Learn", () => {
    renderChooser();
    expect(screen.getByTestId("door-play")).toHaveAttribute(
      "data-emphasis",
      "primary"
    );
    expect(screen.getByTestId("door-build")).toHaveAttribute(
      "data-emphasis",
      "primary"
    );
    expect(screen.getByTestId("door-learn")).toHaveAttribute(
      "data-emphasis",
      "secondary"
    );
  });
});
