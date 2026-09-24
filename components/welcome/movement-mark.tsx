import { movementNumeral } from "./feature-section";

/**
 * The small movement heading used by landing bands that aren't full
 * `FeatureSection`s (the deck card, the demo): the Roman numeral in the
 * programme italic, a short rule, and the label — so bands V and VI read
 * as the same piece as I–IV.
 */
export function MovementMark({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  const numeral = movementNumeral(number);
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="movement-numeral text-3xl">
        {numeral}
      </span>
      <span aria-hidden className="h-px w-6 bg-primary/50" />
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
        <span className="sr-only">{`Part ${numeral}: `}</span>
        {label}
      </span>
    </div>
  );
}
