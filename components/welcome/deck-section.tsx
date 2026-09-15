import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWelcomeConfig } from "@/hooks/useWelcomeConfig";

export function DeckSection() {
  const { config } = useWelcomeConfig();
  const { items, variant } = config.decks;

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {items.map((deck) => (
        <a
          key={deck.href}
          href={deck.href}
          download
          className={cn(
            buttonVariants({
              variant: variant === "solid" ? "default" : variant,
            }),
            "w-full justify-center rounded-full sm:w-auto",
            variant === "outline" &&
              "border-primary/30 bg-primary/8 text-primary hover:border-primary/50 hover:bg-primary/14 hover:text-primary",
            variant === "ghost" &&
              "border-transparent bg-transparent text-primary hover:bg-primary/10"
          )}
        >
          <Download className="h-4 w-4" />
          {deck.label}
        </a>
      ))}
    </div>
  );
}
