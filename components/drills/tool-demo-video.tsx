"use client";

import { toolDemoVideoFor } from "@/lib/demo-videos";

/**
 * Collapsed demo-video section for a tool page ("Watch the demo").
 *
 * Expands to a native-controls video — no autoplay, so no reduced-motion
 * path is needed (WCAG 2.2.2). The drill stays the primary content; this
 * sits below the main card.
 */
export function ToolDemoVideo({ href }: { href: string }) {
  const demo = toolDemoVideoFor(href);
  if (!demo) return null;

  return (
    <details className="mt-6 rounded-xl border border-border bg-card">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-foreground">
        {demo.title}
      </summary>
      <div className="px-4 pb-4">
        <video
          className="aspect-[16/10] w-full rounded-xl border border-border bg-background"
          src={demo.mp4}
          controls
          muted
          playsInline
          preload="metadata"
          aria-label={demo.ariaLabel}
        />
      </div>
    </details>
  );
}
