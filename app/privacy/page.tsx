import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Privacy Policy · Piano Suite",
  description: "What Piano Suite collects, and why.",
};

export default function PrivacyRoute() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <article className="mx-auto max-w-2xl px-4 pb-20 pt-12 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: August 31, 2026
          </p>

          <div className="mt-8 space-y-6 text-sm leading-6 text-foreground/90">
            <section>
              <h2 className="font-semibold text-foreground">The short version</h2>
              <p className="mt-2">
                We collect as little as possible: what you sign in with, what
                you choose to sync, and anonymous usage counts that tell us
                which tools help people practice. We never sell data, and we
                don&apos;t run ads.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">
                What we collect
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>Account data</strong> via Clerk (authentication):
                  your email and profile name if you sign in.
                </li>
                <li>
                  <strong>Practice data</strong> via Convex (database): drill
                  events, settings, and custom practice pages — for Pro members
                  this syncs across devices; on Free it stays in your browser.
                </li>
                <li>
                  <strong>Anonymous analytics</strong> via PostHog: tool usage
                  events such as starting or completing a drill. No note
                  content, no keypresses, no recordings.
                </li>
                <li>
                  <strong>Error logs</strong> via Sentry: technical details
                  when something breaks, so we can fix it.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">
                MIDI keyboard data
              </h2>
              <p className="mt-2">
                Notes you play go straight from your keyboard to your browser.
                They are processed locally to score your drills and never leave
                your device.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">
                Children&apos;s privacy
              </h2>
              <p className="mt-2">
                Piano Suite is intended for people 13 and older. We do not
                knowingly collect personal information from children under 13.
                If you believe a child under 13 has used Piano Suite, contact
                us and we will delete any analytics or error data collected
                during their visits.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">
                Data retention &amp; deletion
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Free-tier practice history lives in your browser only and
                  stays until you clear it.
                </li>
                <li>
                  Synced data (Pro) is retained while your account is active.
                </li>
                <li>
                  Email us and we will delete your account and all synced data
                  within 30 days.
                </li>
                <li>
                  Error logs sent to Sentry are stripped of identity fields
                  (account identifiers, cookies) before they leave your
                  browser.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">Your choices</h2>
              <p className="mt-2">
                You can clear local practice history from your browser at any
                time, and email us to delete your account and synced data.
                Analytics can be blocked with any standard tracker blocker
                without breaking the app.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">Contact</h2>
              <p className="mt-2">
                Questions about privacy? Reach out through the community
                channels linked from the homepage.
              </p>
            </section>

            <p className="pt-4">
              See also our{" "}
              <Link
                href="/terms"
                className="text-primary underline-offset-2 hover:underline"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
