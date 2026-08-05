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
            buttonVariants({ variant: variant === "solid" ? "default" : variant }),
            "w-full justify-center rounded-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary sm:w-auto",
            variant === "solid" &&
              "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
            variant === "ghost" &&
              "border-transparent bg-transparent text-primary hover:bg-primary/10"
          )}
        >
          <Download className="mr-2 h-4 w-4" />
          {deck.label}
        </a>
      ))}
    </div>
  );
}
