import Link from "next/link";
import { Play } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <Link
          href="/tools"
          className={cn(
            buttonVariants({ size: "lg" }),
            "rounded-full bg-primary px-8 text-lg text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Play className="mr-2 h-5 w-5 fill-current" />
          Enter the drill
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          Needs Anki running with AnkiConnect, and a MIDI keyboard connected.
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
