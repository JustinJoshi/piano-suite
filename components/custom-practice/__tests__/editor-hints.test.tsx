import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorHints } from "@/components/custom-practice/editor-hints";

const HINTS_KEY = "piano-suite:editor-hints-dismissed-v1";

describe("EditorHints", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows three one-line hints on first run", () => {
    render(<EditorHints visible />);
    expect(screen.getByText(/save automatically/i)).toBeInTheDocument();
    expect(screen.getByText(/press \/ anywhere/i)).toBeInTheDocument();
    expect(screen.getByText(/blocks are live/i)).toBeInTheDocument();
  });

  it("dismisses all hints at once and persists the dismissal", () => {
    render(<EditorHints visible />);

    fireEvent.click(screen.getByRole("button", { name: /dismiss hints/i }));

    expect(screen.queryByText(/save automatically/i)).not.toBeInTheDocument();
    expect(localStorage.getItem(HINTS_KEY)).toBe("true");
  });

  it("renders nothing once dismissed", () => {
    localStorage.setItem(HINTS_KEY, "true");
    render(<EditorHints visible />);
    expect(
      screen.queryByText(/save automatically/i)
    ).not.toBeInTheDocument();
  });

  it("renders nothing when not on a first-run page", () => {
    render(<EditorHints visible={false} />);
    expect(
      screen.queryByText(/save automatically/i)
    ).not.toBeInTheDocument();
  });
});
