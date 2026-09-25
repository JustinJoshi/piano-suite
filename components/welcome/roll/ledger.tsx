"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import {
  ROLL_LEDGER_EVENT,
  ROLL_LEDGER_KEY,
  clearRuns,
  describeWhen,
  loadRuns,
  runTotal,
  streakDays,
  type RollRun,
} from "@/lib/roll-ledger";

const seconds = (ms: number) => (ms / 1000).toFixed(1);

/** This page's own practice history: runs of the hero drill, in this browser. */
export function RollLedger() {
  const { config } = useWelcomeConfig();
  const copy = config.roll.progress;
  const [runs, setRuns] = useState<RollRun[] | null | undefined>(undefined);
  const [freshAt, setFreshAt] = useState<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

  const refresh = useCallback((fresh = false) => {
    const next = loadRuns();
    setRuns(next);
    if (fresh && next?.length) setFreshAt(next[next.length - 1].at);
  }, []);

  useEffect(() => {
    // Storage is only readable in the browser, after hydration.
    const initial = setTimeout(() => refresh(), 0);
    const onRun = () => refresh(true);
    const onStorage = (e: StorageEvent) => e.key === ROLL_LEDGER_KEY && refresh();
    window.addEventListener(ROLL_LEDGER_EVENT, onRun);
    window.addEventListener("storage", onStorage);
    return () => {
      clearTimeout(initial);
      window.removeEventListener(ROLL_LEDGER_EVENT, onRun);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const rows = runs ? runs.slice(-6).reverse() : [];
  const best = runs && runs.length > 1 ? Math.min(...runs.map(runTotal)) : null;
  const days = runs ? streakDays(runs) : 0;

  return (
    <section className="roll-section" id="progress" aria-labelledby="progress-title">
      <div className="roll-row">
        <div className="roll-margin" data-roll-reveal="">
          <p className="roll-label">{copy.label}</p>
          <p className="roll-note">{copy.note}</p>
        </div>
        <div className="grid gap-8">
          <div className="roll-prose" data-roll-reveal="">
            <h2 id="progress-title" className="roll-h2" tabIndex={-1} ref={titleRef}>
              {copy.title}
            </h2>
            <p className="roll-lede">{copy.lede}</p>
          </div>
          <div className="roll-ledger" data-roll-reveal="">
            {runs === undefined ? null : runs === null ? (
              <p className="roll-ledger-empty">{copy.blocked}</p>
            ) : rows.length === 0 ? (
              <p className="roll-ledger-empty">{copy.empty}</p>
            ) : (
              <>
                <table>
                  <caption className="roll-label">Four chords, I–V–vi–IV</caption>
                  <thead>
                    <tr>
                      <th scope="col">When</th>
                      <th scope="col">Time</th>
                      <th scope="col">Misses</th>
                      <th scope="col" className="roll-ledger-chords">
                        Each chord
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((run) => {
                      const total = runTotal(run);
                      return (
                        <tr key={run.at} data-new={run.at === freshAt ? "" : undefined}>
                          <td>{describeWhen(run.at)}</td>
                          <td data-numeric="">
                            {seconds(total)} s
                            {best === total ? (
                              <>
                                <span className="sr-only"> (best)</span>
                                <span aria-hidden="true" title="Best so far">
                                  {" "}
                                  *
                                </span>
                              </>
                            ) : null}
                          </td>
                          <td data-numeric="">{run.results.reduce((a, r) => a + r.misses, 0)}</td>
                          <td className="roll-ledger-chords">{run.results.map((r) => `${r.name} ${seconds(r.ms)}`).join(" · ")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="roll-ledger-foot">
                  <p className="roll-ledger-streak">
                    {days === 0 ? "No streak running at the moment." : days === 1 ? "One day so far." : `${days} days in a row.`}
                    {best !== null ? " The asterisk marks your best." : ""}
                  </p>
                  <button
                    type="button"
                    className="roll-link-btn roll-ledger-clear"
                    onClick={() => {
                      clearRuns();
                      refresh();
                      titleRef.current?.focus({ preventScroll: true });
                    }}
                  >
                    Forget these
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
