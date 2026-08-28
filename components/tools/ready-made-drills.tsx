"use client";

import Link from "next/link";
import { drillTools } from "@/lib/tools";

/**
 * Compact shortcuts from the Workshop to the ready-made drills, framed as
 * templates: start practicing immediately, or build your own page above.
 */
export function ReadyMadeDrills() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">
        In a hurry? Jump into a ready-made drill:
      </span>
      {drillTools.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          title={tool.description}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <tool.icon className="h-3.5 w-3.5" />
          {tool.title}
        </Link>
      ))}
    </div>
  );
}
