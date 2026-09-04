"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getManifest, validatePageWiring } from "@/lib/feature-blocks/manifest";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import type { RequirementId } from "@/lib/feature-blocks/manifest-types";

/**
 * Plain-language sentence for each manifest requirement, per the phase plan.
 */
export const REQUIREMENT_SENTENCES: Record<RequirementId, string> = {
  transport: "Needs a transport",
  practiceNotes: "Needs a source of notes",
  midiInput: "Needs a way to play notes",
};

export type RequirementLine = { id: RequirementId; met: boolean };

// validatePageWiring formats unmet requirements as "Requires: <id>".
const UNMET_DETAIL_PREFIX = "Requires: ";

// Mirrors NOTE_INPUT_TYPES in lib/feature-blocks/manifest.ts (the manifest
// module's own comment: "Blocks whose presence gives a page note input").
// Needed because a probe of the entry's type satisfies a midiInput
// requirement through its own presence — see the comment below.
const NOTE_INPUT_TYPES = new Set(["keyboardDisplay", "midiConnectionBar"]);

/**
 * Resolve one entry's requirements against the current page by delegating to
 * validatePageWiring: adding this entry to the page is satisfied when the
 * hypothetical page produces no unmet_requirement issue for it. The matching
 * semantics (midiInput capability vs. practiceNotes stream) stay in the
 * manifest module — this only reads its output.
 *
 * One correction on top: validatePageWiring counts every note-input block on
 * the page, including the probe itself, so a midiConnectionBar entry would
 * satisfy its own midiInput requirement on an empty page. The library line
 * answers "will this work on the page as it stands?", so the entry is
 * excluded from satisfying itself and midiInput is judged against
 * pageBlocks alone (reporting to the phase lead, not silently re-scoped).
 */
export function requirementLinesFor(
  type: string,
  pageBlocks: FeatureBlock[]
): RequirementLine[] {
  const manifest = getManifest(type);
  if (!manifest || manifest.requires.length === 0) return [];

  const probe: FeatureBlock = {
    id: `about-probe-${type}`,
    type,
    version: 1,
    config: {},
  };
  const issues = validatePageWiring([...pageBlocks, probe]).filter(
    (issue) => issue.issue === "unmet_requirement" && issue.blockId === probe.id
  );

  // Parse "Requires: <id>" back into requirement ids. If the detail format
  // ever changes, fail safe: report every requirement as unmet rather than
  // claiming a page works when it might not.
  const parsed = issues.map((issue) => issue.detail.slice(UNMET_DETAIL_PREFIX.length));
  const known = new Set<string>(manifest.requires);
  const unknown = parsed.filter((id) => !known.has(id));
  const unmet = unknown.length > 0 ? manifest.requires : parsed;

  return manifest.requires.map((id) => ({
    id,
    met:
      id === "midiInput"
        ? pageBlocks.some((b) => NOTE_INPUT_TYPES.has(b.type))
        : !unmet.includes(id),
  }));
}

/**
 * Status marker shared by cards and rows: the manifest's experimental flag,
 * visible at a glance.
 */
export function ExperimentalBadge() {
  return (
    <span
      data-testid="experimental-marker"
      className="rounded-full border border-accent/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent"
    >
      Experimental
    </span>
  );
}

type AboutPanelProps = {
  type: string;
  label: string;
  summary: string;
  justification: string;
  requirements: RequirementLine[];
  experimental: boolean;
  /** Live preview for supplementary entries; cards show theirs in the body. */
  preview?: ReactNode;
};

/**
 * Disclosure shared by cards and rows: summary, the why-it-exists
 * justification, requirements, and what "experimental" means. No doc link —
 * docsPath values are repo-relative paths no app route serves.
 */
export function AboutPanel({
  type,
  label,
  summary,
  justification,
  requirements,
  experimental,
  preview,
}: AboutPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = `about-panel-${type}`;
  const triggerId = `about-trigger-${type}`;

  function toggleOnKey(event: KeyboardEvent<HTMLButtonElement>) {
    // Native buttons activate on Enter/Space, but jsdom does not synthesize
    // that from keyDown. preventDefault stops the browser's own activation
    // so the toggle fires exactly once in both environments.
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    setOpen((value) => !value);
  }

  return (
    <div className="min-w-0">
      <Button
        type="button"
        id={triggerId}
        variant="ghost"
        size="xs"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`About ${label}`}
        data-testid={`about-trigger-${type}`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={toggleOnKey}
        className="text-muted-foreground"
      >
        <ChevronDown
          className={cn("transition-transform", open && "rotate-180")}
        />
        About
      </Button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={triggerId}
          data-testid={panelId}
          className="mt-2 space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-xs"
        >
          <p className="text-foreground">{summary}</p>
          <p className="text-muted-foreground">{justification}</p>

          {requirements.length > 0 && (
            <ul className="space-y-1">
              {requirements.map((req) => (
                <li
                  key={req.id}
                  data-testid={`requirement-${req.id}`}
                  className="flex items-center gap-2"
                >
                  <span
                    aria-label={
                      req.met ? "requirement satisfied" : "requirement unsatisfied"
                    }
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      req.met ? "bg-success" : "bg-destructive"
                    )}
                  />
                  <span className="text-muted-foreground">
                    {REQUIREMENT_SENTENCES[req.id]}
                  </span>
                  <span
                    className={cn(
                      "ml-auto font-medium uppercase tracking-wide",
                      req.met ? "text-success" : "text-destructive"
                    )}
                  >
                    {req.met ? "Satisfied" : "Missing"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {experimental && (
            <p className="text-accent">
              <span className="font-medium">Experimental:</span> works, but its
              behaviour may still change.
            </p>
          )}

          {preview && (
            <div
              data-testid={`about-preview-${type}`}
              className="rounded-lg border border-border bg-card p-2"
            >
              {preview}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
