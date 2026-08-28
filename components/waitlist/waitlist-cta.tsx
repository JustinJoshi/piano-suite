"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { captureEvent } from "@/lib/analytics";
import {
  foundingProHeadline,
  foundingProSubcopy,
} from "@/lib/billing";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type JoinState =
  | "idle"
  | "submitting"
  | "joined"
  | "alreadyJoined"
  | "error";

export function WaitlistCta({ source = "pricing-page" }: { source?: string }) {
  const joinWaitlist = useMutation(api.waitlist.joinWaitlist);

  const [email, setEmail] = useState("");
  const [state, setState] = useState<JoinState>("idle");
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setState("submitting");
    captureEvent("pro_waitlist_click", { source });

    try {
      const result = await joinWaitlist({
        email: email.trim(),
        source,
      });
      setPosition(result.position);
      setState(result.status === "joined" ? "joined" : "alreadyJoined");
    } catch {
      setError("Something went wrong. Please try again.");
      setState("error");
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 text-card-foreground">
      <h2 className="text-xl font-semibold">{foundingProHeadline()}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {foundingProSubcopy()}
      </p>

      {state === "joined" || state === "alreadyJoined" ? (
        <p
          className="mt-4 rounded-lg bg-success/10 px-4 py-3 text-sm text-success"
          role="status"
        >
          {state === "alreadyJoined" ? "You're already on the list — " : "You're in — "}
          you&apos;re <strong>#{position}</strong>. We&apos;ll email you when
          Pro launches.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="waitlist-email" className="sr-only">
              Email
            </label>
            <input
              id="waitlist-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
            />
            <button
              type="submit"
              disabled={state === "submitting"}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {state === "submitting" ? "Joining…" : "Join waitlist"}
            </button>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </section>
  );
}
