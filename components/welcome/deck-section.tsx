import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const decks = [
  {
    label: "Chord Symbols — 7ths & dim7 (.txt)",
    href: "/chord-symbols-CGDAEno11.txt",
  },
  {
    label: "Chord Symbols — 9/11/13 (.txt)",
    href: "/chord-symbols-CGDAE.txt",
  },
];

export function DeckSection() {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {decks.map((deck) => (
        <a
          key={deck.href}
          href={deck.href}
          download
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
          )}
        >
          <Download className="mr-2 h-4 w-4" />
          {deck.label}
        </a>
      ))}
    </div>
  );
}
