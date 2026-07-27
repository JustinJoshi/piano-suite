import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDrillTimer } from "@/hooks/useDrillTimer";

describe("useDrillTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle phase", () => {
    const { result } = renderHook(() => useDrillTimer());
    expect(result.current.phase).toBe("idle");
    expect(result.current.liveMs).toBe(0);
  });

  it("moves directly to armed when no countdown", () => {
    const { result } = renderHook(() => useDrillTimer());

    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("armed");
  });

  it("counts down before arming", () => {
    const onCountdownComplete = vi.fn();
    const { result } = renderHook(() =>
      useDrillTimer({ countdownSeconds: 3, onCountdownComplete })
    );

    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("countdown");
    expect(result.current.countdownValue).toBe(3);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.countdownValue).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.phase).toBe("armed");
    expect(onCountdownComplete).toHaveBeenCalled();
  });

  it("starts timing when armed", () => {
    const onStartTiming = vi.fn();
    const { result } = renderHook(() => useDrillTimer({ onStartTiming }));

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.arm();
    });

    expect(result.current.phase).toBe("timing");
    expect(onStartTiming).toHaveBeenCalled();
  });

  it("marks success and reports elapsed time", () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDrillTimer({ onSuccess }));

    act(() => {
      result.current.start();
    });

    act(() => {
      result.current.arm();
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    act(() => {
      result.current.markSuccess();
    });

    expect(result.current.phase).toBe("finished");
    expect(onSuccess).toHaveBeenCalledWith(expect.closeTo(500, 50));
  });

  it("waits for break before grading", () => {
    const onBreakComplete = vi.fn();
    const { result } = renderHook(() =>
      useDrillTimer({ breakSeconds: 3, onBreakComplete })
    );

    act(() => {
      result.current.start();
      result.current.arm();
      result.current.markSuccess();
    });

    expect(result.current.phase).toBe("break-before-grade");
    expect(result.current.breakRemaining).toBe(3);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.phase).toBe("finished");
    expect(onBreakComplete).toHaveBeenCalled();
  });

  it("cancels back to idle", () => {
    const { result } = renderHook(() => useDrillTimer({ countdownSeconds: 5 }));

    act(() => {
      result.current.start();
    });

    expect(result.current.phase).toBe("countdown");

    act(() => {
      result.current.cancel();
    });

    expect(result.current.phase).toBe("idle");
    expect(result.current.countdownValue).toBe(0);
  });

  it("calls onFinish when completed without break", () => {
    const onFinish = vi.fn();
    const { result } = renderHook(() => useDrillTimer({ onFinish }));

    act(() => {
      result.current.start();
      result.current.arm();
      result.current.markSuccess();
    });

    expect(result.current.phase).toBe("finished");
    expect(onFinish).toHaveBeenCalled();
  });

  it("pauses at success in multi-rep mode", () => {
    const onSuccess = vi.fn();
    const onFinish = vi.fn();
    const { result } = renderHook(() =>
      useDrillTimer({ multiRep: true, onSuccess, onFinish })
    );

    act(() => {
      result.current.start();
      result.current.arm();
      vi.advanceTimersByTime(300);
      result.current.markSuccess();
    });

    expect(result.current.phase).toBe("success");
    expect(onSuccess).toHaveBeenCalledWith(expect.closeTo(300, 50));
    expect(onFinish).not.toHaveBeenCalled();

    act(() => {
      result.current.nextRep();
    });

    expect(result.current.phase).toBe("armed");
  });

  it("finishes a multi-rep round through the break timer", () => {
    const onFinish = vi.fn();
    const onBreakComplete = vi.fn();
    const { result } = renderHook(() =>
      useDrillTimer({ multiRep: true, breakSeconds: 2, onFinish, onBreakComplete })
    );

    act(() => {
      result.current.start();
      result.current.arm();
      result.current.markSuccess();
    });

    expect(result.current.phase).toBe("success");

    act(() => {
      result.current.finishRound();
    });

    expect(result.current.phase).toBe("break-before-grade");
    expect(result.current.breakRemaining).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.phase).toBe("finished");
    expect(onBreakComplete).toHaveBeenCalled();
    expect(onFinish).toHaveBeenCalled();
  });
});
