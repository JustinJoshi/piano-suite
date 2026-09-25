import { Fragment, type ReactNode } from "react";
import Link from "next/link";

/**
 * Render a line of copy with a little inline markup: `*em*`, `**strong**`,
 * `` `kbd` `` and `[text](href)`. Internal hrefs become `next/link`s with the
 * roll's perforated underline. Anything else is plain text.
 */
const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

export function RollInline({ text, linkClassName = "roll-link" }: { text: string; linkClassName?: string }) {
  const parts = text.split(TOKEN).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>{renderPart(part, linkClassName)}</Fragment>
      ))}
    </>
  );
}

function renderPart(part: string, linkClassName: string): ReactNode {
  if (part.startsWith("**") && part.endsWith("**")) return <strong>{part.slice(2, -2)}</strong>;
  if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em>{part.slice(1, -1)}</em>;
  if (part.startsWith("`") && part.endsWith("`")) return <kbd className="roll-kbd">{part.slice(1, -1)}</kbd>;
  const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
  if (link) {
    const [, label, href] = link;
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={linkClassName}>
          {label}
        </Link>
      );
    }
    return (
      <a href={href} className={linkClassName} target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }
  return part;
}

/** Plain text for aria-labels and the like: markup stripped, link text kept. */
export function rollPlain(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}
