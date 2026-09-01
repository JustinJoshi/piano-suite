import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DoorChooser } from "@/components/welcome/door-chooser";
import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";

function renderChooser() {
  return render(
    <WelcomeConfigProvider>
      <DoorChooser />
    </WelcomeConfigProvider>
  );
}

describe("DoorChooser (three doors)", () => {
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
    expect(play).toHaveAttribute("href", "/routes");
    expect(play).toHaveTextContent(/just let me do something/i);

    const build = screen.getByTestId("door-build");
    expect(build).toHaveAttribute("href", "/tools/workshop");
    expect(build).toHaveTextContent(/make my own/i);

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
});
