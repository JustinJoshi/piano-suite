"use client";

import { useState, useReducer, useSyncExternalStore } from "react";
import {
  MIN_AGE_YEARS,
  readAgeGateStatus,
  saveAgeGateStatus,
  statusForBirthdate,
  type AgeGateStatus,
} from "@/lib/age-gate";
import { initAnalytics } from "@/lib/analytics";
import { initClientSentry } from "@/lib/sentry";

// Storage never notifies; refresh() re-reads it after the gate is answered.
const subscribeStorage = () => () => {};
const serverStatus = () => "loading" as const;

// Neutral COPPA gate: asks age before the app (and any tracking) mounts.
// Deliberately plain — no branding, no inducement — per FTC guidance.
export function AgeGate({ children }: { children: React.ReactNode }) {
  const status = useSyncExternalStore(
    subscribeStorage,
    readAgeGateStatus,
    serverStatus
  ) as AgeGateStatus | "loading";
  const [, refresh] = useReducer((count: number) => count + 1, 0);
  const [birthdate, setBirthdate] = useState("");

  if (status === "loading") {
    return null;
  }

  if (status === "eligible") {
    return <>{children}</>;
  }

  if (status === "underage") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Piano Suite
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Piano Suite is available for visitors {MIN_AGE_YEARS} or older. No
            information from this visit was saved or shared.
          </p>
        </div>
      </div>
    );
  }

  const submit = () => {
    const next = statusForBirthdate(birthdate, new Date());
    if (next === "unknown") {
      return;
    }
    saveAgeGateStatus(next);
    refresh();

    // Tracking may only start once the gate has been passed.
    if (next === "eligible") {
      initAnalytics();
      initClientSentry();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <form
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Before you continue
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Piano Suite is intended for people {MIN_AGE_YEARS} and older. When is
          your birthday?
        </p>
        <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="age-gate-birthdate">
          Birthday
        </label>
        <input
          id="age-gate-birthdate"
          type="date"
          value={birthdate}
          onChange={(event) => setBirthdate(event.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
