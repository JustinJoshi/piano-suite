import type { CSSProperties, ReactNode } from "react";

/**
 * The top of a public page on the roll: a label and a marginal note in the
 * left margin, then the page's one heading and its lede in the main column.
 */
export function RollPageHead({
  label,
  note,
  eyebrow,
  title,
  lede,
  titleId = "page-title",
  children,
}: {
  label: string;
  note?: string;
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  titleId?: string;
  children?: ReactNode;
}) {
  const intro = (ms: number) => ({ "--intro-delay": `${ms}ms` }) as CSSProperties;
  return (
    <header className="roll-row roll-page-head">
      <div className="roll-margin" data-roll-intro="" style={intro(60)}>
        <p className="roll-label">{label}</p>
        {note ? <p className="roll-note">{note}</p> : null}
      </div>
      <div data-roll-intro="" style={intro(140)}>
        {eyebrow ? <p className="roll-eyebrow">{eyebrow}</p> : null}
        <h1 id={titleId} className="roll-h1 roll-h1-page">
          {title}
        </h1>
        {lede ? <div className="roll-lede">{lede}</div> : null}
        {children}
      </div>
    </header>
  );
}

/** Content that sits in the main column, under the margin. */
export function RollMain({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={["roll-row", className].filter(Boolean).join(" ")}>
      <div aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** A small caption with a rule running out to the right: "Featured ———". */
export function RollRuleLabel({ children, as: Tag = "h2" }: { children: ReactNode; as?: "h2" | "h3" | "p" }) {
  return (
    <div className="roll-rule-label">
      <Tag className="roll-label">{children}</Tag>
      <span aria-hidden="true" />
    </div>
  );
}
