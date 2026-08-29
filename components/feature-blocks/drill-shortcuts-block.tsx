"use client";

import Link from "next/link";
import { drillTools } from "@/lib/tools";

/**
 * Ready-made drills tile: the workshop's jump-into-practice shortcuts,
 * rendered as a movable, resizable grid tile instead of a fixed strip.
 */
export function DrillShortcutsBlock() {
  return (
    <div
      data-testid="drill-shortcuts"
      className="flex h-full flex-wrap items-center gap-2"
    >
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
