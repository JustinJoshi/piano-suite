import type { Metadata } from "next";
import Link from "next/link";
import { RollFrame } from "@/components/roll/roll-frame";
import { RollMain } from "@/components/roll/page-head";
import { RollArrow } from "@/components/roll/ticket";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page does not exist — head back to Piano Suite.",
};

/**
 * A blank stretch of roll: the lanes are there, nothing is punched. Tacet —
 * the part is silent here.
 */
export default function NotFound() {
  return (
    <RollFrame compactFooter>
      <RollMain className="roll-page-end pt-12">
        <div className="roll-blank" aria-hidden="true" />
        <p className="roll-label mt-8" style={{ color: "var(--felt)" }}>
          Error 404 · tacet
        </p>
        <h1 className="roll-h1 roll-h1-page mt-3">Page not found</h1>
        <p className="roll-lede">
          This stretch of the roll is blank: the page you were after isn’t punched into it. Your practice is right where
          you left it.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link href="/" className="roll-btn roll-btn-ink">
            Back to the home page
            <RollArrow />
          </Link>
          <Link href="/tools/workshop" className="roll-link roll-link-arrow text-lg">
            Open the Workshop
          </Link>
        </div>
      </RollMain>
    </RollFrame>
  );
}
