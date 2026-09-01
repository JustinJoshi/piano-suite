"use client";

import Link from "next/link";
import { PricingTable, useUser } from "@clerk/nextjs";
import { BILLING_ENABLED, PRO_PLAN_SLUG } from "@/lib/billing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BillingSettingsSection() {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <div className="p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Billing
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your Piano Suite plan. Pro unlocks Convex sync for tracking,
            personal bests, and cross-device preferences.
          </p>
        </div>

        {!isLoaded ? (
          <p className="text-sm text-muted-foreground">Loading billing…</p>
        ) : !isSignedIn ? (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">
                Sign in to manage billing
              </CardTitle>
              <CardDescription>
                Browse plans on the public pricing page, then sign in to
                subscribe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/pricing"
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                See plans
              </Link>
            </CardContent>
          </Card>
        ) : !BILLING_ENABLED ? (
          // Pre-launch: Clerk billing is off, and mounting <PricingTable>
          // while it is off makes Clerk throw ("cannot_render_billing_
          // disabled"). Show the waitlist path instead.
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">
                Pro is on the way
              </CardTitle>
              <CardDescription>
                Cloud sync, personal bests, and the float panel ship with the
                Pro plan. Join the Founding Pro waitlist meanwhile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href="/pricing"
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                See Pro plans and join the waitlist
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-base">Your plan</CardTitle>
              <CardDescription>
                Upgrade, switch monthly/annual, or manage your subscription
                below. Payment methods also appear in your account Billing panel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingTable
                for="user"
                highlightedPlan={PRO_PLAN_SLUG}
                newSubscriptionRedirectUrl="/settings/billing"
              />
            </CardContent>
          </Card>
        )}

        <p className="text-sm text-muted-foreground">
          Prefer the marketing page?{" "}
          <Link
            href="/pricing"
            className="text-primary underline-offset-2 hover:underline"
          >
            Open Pricing
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
