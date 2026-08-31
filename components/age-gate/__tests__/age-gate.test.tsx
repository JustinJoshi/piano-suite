import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AgeGate } from "@/components/age-gate/age-gate";
import { AGE_GATE_STORAGE_KEY } from "@/lib/age-gate";

const initAnalytics = vi.fn();
const initClientSentry = vi.fn();

vi.mock("@/lib/analytics", () => ({
  initAnalytics: () => initAnalytics(),
}));

vi.mock("@/lib/sentry", () => ({
  initClientSentry: () => initClientSentry(),
}));

function answerAge(value: string) {
  fireEvent.change(screen.getByLabelText(/birthday/i), {
    target: { value },
  });
  fireEvent.click(screen.getByRole("button", { name: /continue/i }));
}

describe("AgeGate", () => {
  afterEach(() => {
    window.localStorage.clear();
    initAnalytics.mockClear();
    initClientSentry.mockClear();
  });

  it("renders children when the gate is already passed", () => {
    window.localStorage.setItem(AGE_GATE_STORAGE_KEY, "eligible");
    render(<AgeGate><p>app content</p></AgeGate>);
    expect(screen.getByText("app content")).toBeTruthy();
  });

  it("asks for age first and hides the app while unanswered", () => {
    render(<AgeGate><p>app content</p></AgeGate>);
    expect(screen.queryByText("app content")).toBeNull();
    expect(screen.getByLabelText(/birthday/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /continue/i })).toBeTruthy();
  });

  it("unlocks for an adult, saves the decision, and starts tracking", () => {
    render(<AgeGate><p>app content</p></AgeGate>);

    answerAge("2000-01-01");

    expect(screen.getByText("app content")).toBeTruthy();
    expect(window.localStorage.getItem(AGE_GATE_STORAGE_KEY)).toBe("eligible");
    expect(initAnalytics).toHaveBeenCalledTimes(1);
    expect(initClientSentry).toHaveBeenCalledTimes(1);
  });

  it("blocks under-13 without rendering the app or tracking", () => {
    render(<AgeGate><p>app content</p></AgeGate>);

    answerAge("2020-01-01");

    expect(screen.queryByText("app content")).toBeNull();
    expect(window.localStorage.getItem(AGE_GATE_STORAGE_KEY)).toBe("underage");
    expect(initAnalytics).not.toHaveBeenCalled();
    expect(initClientSentry).not.toHaveBeenCalled();
  });

  it("keeps blocking on later visits once marked underage", () => {
    window.localStorage.setItem(AGE_GATE_STORAGE_KEY, "underage");
    render(<AgeGate><p>app content</p></AgeGate>);
    expect(screen.queryByText("app content")).toBeNull();
    expect(screen.getByText(/13 or older/i)).toBeTruthy();
  });

  it("rejects an empty birthday without unlocking", () => {
    render(<AgeGate><p>app content</p></AgeGate>);
    answerAge("");
    expect(screen.queryByText("app content")).toBeNull();
    expect(initAnalytics).not.toHaveBeenCalled();
  });
});
