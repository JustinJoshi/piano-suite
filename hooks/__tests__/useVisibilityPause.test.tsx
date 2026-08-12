import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useVisibilityPause } from "../useVisibilityPause";

function TestComponent() {
  const [ref, visible] = useVisibilityPause<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="target">
      {visible ? "visible" : "hidden"}
    </div>
  );
}

describe("useVisibilityPause", () => {
  let callback: IntersectionObserverCallback | undefined;
  const observe = vi.fn();
  const disconnect = vi.fn();
  const unobserve = vi.fn();

  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(function (this: unknown, cb: IntersectionObserverCallback) {
        callback = cb;
        return { observe, disconnect, unobserve };
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    observe.mockClear();
    disconnect.mockClear();
    unobserve.mockClear();
    callback = undefined;
  });

  it("returns visible=true initially", () => {
    render(<TestComponent />);
    expect(screen.getByTestId("target")).toHaveTextContent("visible");
    expect(observe).toHaveBeenCalled();
  });

  it("updates to false when the observer reports the element is off-screen", () => {
    render(<TestComponent />);

    expect(callback).toBeDefined();
    act(() => {
      callback!(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(screen.getByTestId("target")).toHaveTextContent("hidden");
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(<TestComponent />);
    disconnect.mockClear();
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
