"use client";

import Link from "next/link";
import { PricingTable } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";
import {
  PRO_PLAN_SLUG,
  proAnnualLabel,
  proAnnualSavingsPercent,
  proMonthlyLabel,
} from "@/lib/billing";

const faq = [
  {
    q: "What’s free forever?",
    a: "Local drills and Pattern Lab. You can practice without paying. Pro unlocks Convex sync — personal bests, tracking history, and preferences across devices.",
  },
  {
    q: "Do I need Anki and a MIDI keyboard?",
    a: "Drills still need AnkiConnect and a MIDI keyboard. Pattern Lab and browsing plans do not.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from Settings → Billing (or your account Billing panel). You keep Free local practice after canceling Pro.",
  },
  {
    q: "Is there a free trial of Pro?",
    a: "Not for v1. Free forever covers local practice; subscribe when you want sync.",
  },
] as const;

/**
 * Public marketing pricing surface — Navbar shell + Clerk PricingTable.
 * Hero stays compact so plan cards remain the interaction focus.
 */
export function PricingPage() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="px-4 pb-10 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Plans
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Practice free. Sync when you&apos;re ready.
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Free forever for local drills. Pro ({proMonthlyLabel()} or{" "}
              {proAnnualLabel()}, save {proAnnualSavingsPercent()}%) keeps
              personal bests and history across devices.
            </p>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl border border-border bg-card/80 p-4 ring-1 ring-foreground/10 sm:p-6">
              <PricingTable
                for="user"
                highlightedPlan={PRO_PLAN_SLUG}
                newSubscriptionRedirectUrl="/tools"
              />
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Cancel anytime · Works with your Anki deck · MIDI keyboard required
              for drills
            </p>
          </div>
        </section>

        <section className="border-t border-border/50 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              FAQ
            </h2>
            <dl className="mt-8 space-y-6">
              {faq.map((item) => (
                <div key={item.q}>
                  <dt className="font-medium text-foreground">{item.q}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="px-4 pb-20 text-center sm:px-6 lg:px-8">
          <Link
            href="/tools"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Enter the drill
          </Link>
        </section>
      </main>
    </div>
  );
}
