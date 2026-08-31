"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getRouteProgressSnapshot,
  getServerRouteProgressSnapshot,
  isStepDone,
  learningRoutes,
  subscribeRouteProgress,
} from "@/lib/routes";

// Card status: untouched routes invite, started routes show progress,
// finished routes celebrate. One line, color-coded.
function routeStatus(doneCount: number, total: number) {
  if (doneCount === 0) {
    return { label: "Start the route", complete: false };
  }
  if (doneCount === total) {
    return { label: "Completed · review the steps", complete: true };
  }
  return {
    label: `${doneCount} of ${total} steps done · continue`,
    complete: false,
  };
}

/**
 * Compact guided-route cards for the Workshop starter picker.
 * Same registry + progress store as the public /routes page.
 */
export function RouteCards() {
  const progress = useSyncExternalStore(
    subscribeRouteProgress,
    getRouteProgressSnapshot,
    getServerRouteProgressSnapshot
  );

  return (
    <div data-testid="route-cards" className="grid gap-2 sm:grid-cols-2">
      {learningRoutes.map((route) => {
        const Icon = route.icon;
        const doneCount = route.steps.filter((step) =>
          isStepDone(progress, route.id, step.id)
        ).length;
        const status = routeStatus(doneCount, route.steps.length);

        return (
          <Link
            key={route.id}
            href={`/routes/${route.id}`}
            data-testid={`picker-route-${route.id}`}
            className="group flex flex-col rounded-xl border border-border p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <span className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {route.title}
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {route.tagline}
                </span>
              </span>
            </span>
            <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
              {route.description}
            </span>
            <span
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 text-xs font-semibold",
                status.complete ? "text-success" : "text-primary"
              )}
            >
              {status.complete ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              )}
              {status.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
