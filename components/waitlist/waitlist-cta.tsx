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
    <section className="relative overflow-hidden rounded-3xl border border-primary/25 bg-card p-6 text-card-foreground shadow-raised sm:p-8">
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-0 opacity-50" />
      <span className="relative text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        founding members
      </span>
      <h2 className="relative mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
        {foundingProHeadline()}
      </h2>
      <p className="relative mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
        {foundingProSubcopy()}
      </p>

      {state === "joined" || state === "alreadyJoined" ? (
        <p
          className="relative mt-5 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
          role="status"
        >
          {state === "alreadyJoined" ? "You're already on the list — " : "You're in — "}
          you&apos;re <strong>#{position}</strong>. We&apos;ll email you when
          Pro launches.
        </p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="relative mt-5 flex flex-col gap-3">
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
              className="h-11 w-full flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/40"
            />
            <button
              type="submit"
              disabled={state === "submitting"}
              className="key-press h-11 rounded-full bg-action px-5 text-sm font-medium text-action-foreground shadow-key hover:bg-action-hover disabled:opacity-50"
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
