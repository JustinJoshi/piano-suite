"use client";

import Link from "next/link";
import { PricingTable } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";
import { WaitlistCta } from "@/components/waitlist/waitlist-cta";
import {
  BILLING_ENABLED,
  PRO_PLAN_SLUG,
  proAnnualLabel,
  proAnnualSavingsPercent,
  proMonthlyLabel,
} from "@/lib/billing";

const freeFaq = [
  {
    q: "What’s free forever?",
    a: "Local drills and Pattern Lab, including exploring Chladni Ripple with MIDI. You can practice without paying. Pro adds sync across devices — personal bests, tracking history, and preferences follow you — plus the float panel that pops live resonance beside Chord Drill.",
  },
  {
    q: "Can I see resonance while I practice chords?",
    a: "Yes with Pro. Open Chladni Ripple, then Pop out while practicing — a draggable float panel shows live MIDI resonance over Chord Drill and other tools. The Ripple lab itself stays free to explore.",
  },
  {
    q: "Do I need Anki and a MIDI keyboard?",
    a: "Drills still need AnkiConnect and a MIDI keyboard. Pattern Lab and browsing plans do not.",
  },
] as const;

const billingFaq = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from Settings → Billing (or your account Billing panel). You keep Free local practice after canceling Pro.",
  },
  {
    q: "Is there a free trial of Pro?",
    a: "Not right now. Free covers local practice for as long as you want, so you can take your time. Subscribe when you want sync and the practice float panel.",
  },
] as const;

const preLaunchFaq = [
  {
    q: "When does Pro launch?",
    a: "Soon. Founding Pro members get lock-in founding pricing and help decide what ships first. Join the waitlist above and we’ll email you the moment it opens.",
  },
] as const;

/**
 * Public marketing pricing surface — Navbar shell + Clerk PricingTable.
 * Hero stays compact so plan cards remain the interaction focus.
 */
export function PricingPage() {
  const faq = [
    ...freeFaq,
    ...(BILLING_ENABLED ? billingFaq : preLaunchFaq),
  ];

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
              {BILLING_ENABLED
                ? "Practice free. Pro when you're ready."
                : "Practice free. Pro is on the way."}
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {BILLING_ENABLED ? (
                <>
                  Free forever for local drills. Pro ({proMonthlyLabel()} or{" "}
                  {proAnnualLabel()}, save {proAnnualSavingsPercent()}%) syncs
                  personal bests across devices and lets you pop out live
                  Chladni resonance beside Chord Drill.
                </>
              ) : (
                <>
                  Free forever for local drills. Pro is launching soon — join
                  the Founding Pro waitlist to lock in founding-member pricing
                  and sync personal bests across devices.
                </>
              )}
            </p>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {BILLING_ENABLED ? (
              <div className="rounded-2xl border border-border bg-card/80 p-4 ring-1 ring-foreground/10 sm:p-6">
                <PricingTable
                  for="user"
                  highlightedPlan={PRO_PLAN_SLUG}
                  newSubscriptionRedirectUrl="/tools"
                />
              </div>
            ) : (
              <WaitlistCta />
            )}
            <footer className="mt-4 text-center text-sm text-muted-foreground">
              Cancel anytime · Works with your Anki deck · MIDI keyboard
              required for drills
              <div className="mt-2 space-x-4">
                <Link
                  href="/terms"
                  className="underline-offset-2 hover:underline"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="underline-offset-2 hover:underline"
                >
                  Privacy
                </Link>
              </div>
            </footer>
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
