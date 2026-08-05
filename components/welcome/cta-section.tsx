import Link from "next/link";
import { Play } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

export function CtaSection() {
  const { config } = useWelcomeConfig();
  const { hero } = config;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <Link
          href={hero.ctaHref}
          className={cn(
            buttonVariants({ size: "lg" }),
            "rounded-full bg-primary px-8 text-lg text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Play className="mr-2 h-5 w-5 fill-current" />
          {hero.ctaText}
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          Open the tools dashboard and try the onboarding. MIDI drills need{" "}
          <Link
            href="/articles/anki-ankiconnect-setup"
            className="text-primary underline-offset-2 hover:underline"
          >
            Anki + AnkiConnect
          </Link>{" "}
          and a keyboard.
        </p>
        <p className="mt-3">
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "link", size: "sm" }),
              "text-muted-foreground"
            )}
          >
            See plans
          </Link>
        </p>
      </div>
    </section>
  );
}
