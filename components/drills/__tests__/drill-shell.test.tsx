import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DrillShell } from "@/components/drills/drill-shell";

describe("DrillShell", () => {
  it("renders title and subtitle", () => {
    render(
      <DrillShell title="Chord Drill" subtitle="Practice chords">
        <div>Tool content</div>
      </DrillShell>
    );

    expect(screen.getByRole("heading", { name: "Chord Drill" })).toBeInTheDocument();
    expect(screen.getByText("Practice chords")).toBeInTheDocument();
    expect(screen.getByText("Tool content")).toBeInTheDocument();
  });

  it("renders right-side content", () => {
    render(
      <DrillShell title="Chord Drill" right={<button>Settings</button>}>
        <div>Tool content</div>
      </DrillShell>
    );

    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
  });

  it("exposes a test id", () => {
    render(
      <DrillShell title="Chord Drill" data-testid="custom-shell">
        <div>Tool content</div>
      </DrillShell>
    );

    expect(screen.getByTestId("custom-shell")).toBeInTheDocument();
  });
});
