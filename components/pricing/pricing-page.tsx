"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PricingTable } from "@clerk/nextjs";
import { RollFrame } from "@/components/roll/roll-frame";
import { RollMain, RollPageHead, RollRuleLabel } from "@/components/roll/page-head";
import { RollTicket } from "@/components/roll/ticket";
import { WaitlistCta } from "@/components/waitlist/waitlist-cta";
import { buttonVariants } from "@/components/ui/button";
import {
  BILLING_ENABLED,
  PRO_PLAN_SLUG,
  proAnnualLabel,
  proAnnualSavingsPercent,
  proMonthlyLabel,
} from "@/lib/billing";
import { cn } from "@/lib/utils";

const freeFaq = [
  {
    q: "What’s free forever?",
    a: "Everything you need to learn: the drills, the Workshop, and Pattern Lab — including exploring Chladni Ripple with MIDI. You can practice for years without paying a cent. Pro simply adds sync across devices — personal bests, tracking history, and preferences follow you — plus the float panel that pops live resonance beside Chord Drill.",
  },
  {
    q: "Can I see resonance while I practice chords?",
    a: "Yes with Pro. Open Chladni Ripple, then Pop out while practicing — a draggable float panel shows live MIDI resonance over Chord Drill and other tools. The Ripple lab itself stays free to explore.",
  },
  {
    q: "Do I need Anki and a MIDI keyboard?",
    a: "Not to get started — every drill plays on the on-screen keyboard too. A MIDI keyboard and Anki make practice feel even better, and we'll help you set both up when you're ready.",
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

const freeIncludes = [
  "Every ready-made drill and the Workshop",
  "On-screen keyboard — no hardware needed",
  "Practice history saved in this browser",
  "Pattern Lab and Chladni Ripple",
];

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
    <RollFrame compactFooter>
      <RollPageHead
        label="What it costs"
        note="No card details. No trial clock."
        title={BILLING_ENABLED ? "Practice free. Pro when you’re ready." : "Practice free. Pro is on the way."}
        lede={
          <p>
              {BILLING_ENABLED ? (
                <>
                  Free forever for local drills. Pro ({proMonthlyLabel()} or{" "}
                  {proAnnualLabel()}, save {proAnnualSavingsPercent()}%) syncs
                  personal bests across devices and lets you pop out live
                  Chladni resonance beside Chord Drill.
                </>
              ) : (
                <>
                  Learning piano here is free, forever. Pro is launching soon —
                  join the Founding Pro waitlist to lock in founding-member
                  pricing and let your personal bests follow you across devices.
                </>
              )}
          </p>
        }
      />

        <RollMain className="pb-16">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_1fr] lg:items-start">
            <aside className="roll-card-paper p-6 sm:p-7">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Free
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-heading text-5xl font-semibold tracking-tight text-foreground">
                  <span className="align-super text-2xl text-muted-foreground">$</span>0
                </span>
                <span className="text-sm text-muted-foreground">forever</span>
              </div>
              <ul className="mt-6 space-y-3">
                {freeIncludes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-foreground/90"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                      <Check className="h-3 w-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/tools/workshop"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "mt-7 w-full rounded-full"
                )}
              >
                Open the Workshop
                <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>

            <div>
              {BILLING_ENABLED ? (
                <div className="rounded-3xl border border-primary/25 bg-card p-4 shadow-raised sm:p-6">
                  <PricingTable
                    for="user"
                    highlightedPlan={PRO_PLAN_SLUG}
                    newSubscriptionRedirectUrl="/tools"
                  />
                </div>
              ) : (
                <WaitlistCta />
              )}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Cancel anytime · Works with your Anki deck · On-screen keys
                included, MIDI welcome
              </p>
            </div>
          </div>
        </RollMain>

        <hr className="roll-crease" aria-hidden="true" />

        <RollMain className="py-16">
          <div className="max-w-2xl">
            <RollRuleLabel as="p">Questions</RollRuleLabel>
            <h2 className="roll-h2">FAQ</h2>
            <dl className="mt-6 divide-y divide-rule border-y border-rule">
              {faq.map((item) => (
                <div key={item.q} className="py-5">
                  <dt className="font-heading text-lg font-semibold tracking-tight text-foreground">
                    {item.q}
                  </dt>
                  <dd className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </RollMain>

        <RollMain className="roll-page-end">
          <RollTicket href="/tools">Back to the piano</RollTicket>
        </RollMain>
    </RollFrame>
  );
}
