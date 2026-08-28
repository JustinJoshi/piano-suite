"use client";

import type { TextBlockConfig } from "@/lib/feature-blocks/text-block/config";

export function TextBlock(config: TextBlockConfig) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {config.text}
      </p>
    </div>
  );
}
