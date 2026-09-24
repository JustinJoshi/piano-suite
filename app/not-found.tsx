import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page does not exist — head back to Piano Suite.",
};

/**
 * One empty bar: a staff, a whole rest hanging from the fourth line, and a
 * fermata over it — "hold this silence". Drawn from theme tokens.
 */
function EmptyBar() {
  const top = 34;
  const gap = 12;
  const line = (index: number) => top + index * gap;
  return (
    <svg
      aria-hidden
      viewBox="0 0 280 120"
      className="mx-auto h-auto w-full max-w-[18rem]"
    >
      {[0, 1, 2, 3, 4].map((index) => (
        <line
          key={index}
          x1={8}
          x2={272}
          y1={line(index)}
          y2={line(index)}
          stroke="var(--color-foreground)"
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      ))}
      {/* Opening bar line, final double bar. */}
      <line x1={8} x2={8} y1={line(0)} y2={line(4)} stroke="var(--color-foreground)" strokeOpacity={0.5} />
      <line x1={262} x2={262} y1={line(0)} y2={line(4)} stroke="var(--color-foreground)" strokeOpacity={0.6} />
      <rect x={266} y={line(0)} width={4} height={gap * 4} fill="var(--color-foreground)" fillOpacity={0.7} />
      {/* Whole rest: hangs beneath the fourth line from the bottom. */}
      <rect x={126} y={line(1)} width={24} height={gap / 2} rx={0.5} fill="var(--color-primary)" />
      {/* Fermata: an arc with a dot, held over the rest. */}
      <path
        d="M122 22 A 16 13 0 0 1 154 22"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <circle cx={138} cy={19} r={2.6} fill="var(--color-primary)" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex flex-1 items-center justify-center px-4 py-24 outline-none"
      >
        <div className="max-w-md text-center">
          <EmptyBar />
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Error 404 · tacet
          </p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            This bar is empty — the page you were after isn’t on the staff.
            Head back and pick a door; your practice is right where you left it.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-6")}
            >
              Back to the home page
            </Link>
            <Link
              href="/tools/workshop"
              className={cn(
                buttonVariants({ variant: "ghost", size: "lg" }),
                "group rounded-full px-5"
              )}
            >
              Open the Workshop
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
