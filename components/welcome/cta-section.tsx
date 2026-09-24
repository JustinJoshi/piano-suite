import Link from "next/link";
import { Play } from "lucide-react";
import { KeybedStrip } from "@/components/brand/keybed-strip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

/**
 * Closing band. Flips the stage (ivory on dark themes) so the page ends on
 * a distinct beat, with the keybed running underneath the CTA.
 */
export function CtaSection() {
  const { config } = useWelcomeConfig();
  const { hero, closingCta } = config;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="tone-inverse grain relative overflow-hidden rounded-[2rem] border border-border shadow-raised">
          <div className="staff-lines staff-lines-edges absolute inset-0" aria-hidden />
          <div className="relative flex flex-col items-center px-6 pb-10 pt-14 text-center sm:px-12 sm:pt-20">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {closingCta.eyebrow}
            </span>
            <h2 className="mt-4 max-w-2xl font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {closingCta.title}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {closingCta.subtitle}
            </p>

            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                href={hero.ctaHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-full px-8 text-base"
                )}
              >
                <Play className="h-5 w-5 fill-current" />
                {hero.ctaText}
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "rounded-full text-foreground/80 hover:bg-foreground/[0.06]"
                )}
              >
                See plans
              </Link>
            </div>

            <p className="mt-6 max-w-md text-xs leading-relaxed text-muted-foreground">
              Have a MIDI keyboard? Wonderful — drills shine with{" "}
              <Link
                href="/articles/anki-ankiconnect-setup"
                className="text-primary underline-offset-2 hover:underline"
              >
                Anki + AnkiConnect
              </Link>
              . Don’t have one yet? No worries — every drill plays happily
              on the on-screen keys too.
            </p>
          </div>
          <KeybedStrip keyWidth={22} className="relative h-12 sm:h-16" />
        </div>
      </div>
    </section>
  );
}
