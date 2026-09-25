"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";
import { learningRoutes } from "@/lib/routes";
import { RollSectionHead } from "@/components/roll/section-head";

/**
 * The guided routes, read from the route registry: each step a punched hole,
 * joined by a chain of perforations that lights up as you trace it; the last
 * step, where the route builds your practice page, is ringed in felt.
 */
export function RollRoutes() {
  const { config } = useWelcomeConfig();
  const copy = config.roll.routes;
  return (
    <section className="roll-section" id="routes" aria-labelledby="routes-title">
      <RollSectionHead copy={copy} titleId="routes-title" />
      <div className="roll-row">
        <div />
        <div className="roll-routes">
          {learningRoutes.map((route) => {
            let n = 0;
            return (
              <article key={route.id} className="roll-route" data-roll-reveal="">
                <h3 className="roll-route-name">
                  <span className="roll-label">Route</span>
                  <Link href={`/routes/${route.id}`}>{route.title.replace(/\s+route$/i, "")}</Link>
                </h3>
                <ol className="roll-steps">
                  {route.steps.map((step, i) => {
                    const end = step.kind === "seed-workshop";
                    if (!end) n += 1;
                    return (
                      <li key={step.id} className={end ? "roll-step-end" : undefined} style={{ "--s": i } as CSSProperties}>
                        <span className="roll-stop" aria-hidden="true">
                          {end ? null : n}
                        </span>
                        {step.title}
                      </li>
                    );
                  })}
                </ol>
              </article>
            );
          })}
          <p className="m-0 text-lg" style={{ gridColumn: "1 / -1" }} data-roll-reveal="">
            <Link className="roll-link roll-link-arrow" href="/routes">
              {copy.go}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
