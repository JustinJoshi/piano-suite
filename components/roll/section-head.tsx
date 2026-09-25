import type { ReactNode } from "react";
import type { WelcomeRollSectionCopy } from "@/lib/welcome-config";
import { RollInline } from "./inline";

/**
 * A section's opening: a label and a marginal note in the roll's left
 * margin, then the eyebrow, heading and lede in the main column.
 */
export function RollSectionHead({
  copy,
  titleId,
  children,
  className = "roll-row roll-section-head",
}: {
  copy: Pick<WelcomeRollSectionCopy, "label" | "note" | "eyebrow" | "title" | "lede">;
  titleId: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="roll-margin" data-roll-reveal="">
        <p className="roll-label">{copy.label}</p>
        {copy.note ? <p className="roll-note">{copy.note}</p> : null}
      </div>
      <div data-roll-reveal="">
        {copy.eyebrow ? <p className="roll-eyebrow">{copy.eyebrow}</p> : null}
        <h2 id={titleId} className="roll-h2">
          {copy.title}
        </h2>
        {copy.lede ? (
          <p className="roll-lede">
            <RollInline text={copy.lede} />
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
