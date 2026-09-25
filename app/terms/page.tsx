import type { Metadata } from "next";
import Link from "next/link";
import { RollFrame } from "@/components/roll/roll-frame";
import { RollMain } from "@/components/roll/page-head";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The ground rules for using Piano Suite.",
};

export default function TermsRoute() {
  return (
    <RollFrame>
      <RollMain className="roll-page-end">
        <article className="roll-reading pt-10">
          <p className="roll-label" style={{ color: "var(--felt)" }}>
            The small print
          </p>
          <h1 className="roll-h1 roll-h1-page mt-3">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: August 28, 2026
          </p>

          <div className="mt-8 space-y-6">
            <section>
              <h2 className="font-semibold text-foreground">Welcome</h2>
              <p className="mt-2">
                Piano Suite is a free learning community for self-taught
                pianists. Practice tools stay free — you bring a MIDI keyboard
                and curiosity, we bring the drills.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">Accounts</h2>
              <p className="mt-2">
                You can explore most tools without an account. Sync features
                require signing in, and you are responsible for keeping your
                credentials safe. Do not use the service to harass anyone or
                break the law.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">Your practice data</h2>
              <p className="mt-2">
                Your drill history, settings, and custom practice pages belong
                to you. Free-tier history lives in your browser only. Pro
                members&apos; data syncs through our database and can be deleted
                on request.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">
                Content and ownership
              </h2>
              <p className="mt-2">
                Publicly shared practice pages stay yours, but you grant other
                community members permission to view, play, and fork them
                inside Piano Suite. Don&apos;t share content you have no right
                to share.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">
                No warranty
              </h2>
              <p className="mt-2">
                The service is provided &ldquo;as is.&rdquo; Practice data can
                be lost to browser resets or bugs — export what matters to you.
                We work hard on uptime but can&apos;t guarantee it.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-foreground">Changes</h2>
              <p className="mt-2">
                These terms may change as the product does. Material changes
                will be announced in the app.
              </p>
            </section>

            <p className="pt-4">
              See also our{" "}
              <Link
                href="/privacy"
                className="text-primary underline-offset-2 hover:underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </article>
      </RollMain>
    </RollFrame>
  );
}
