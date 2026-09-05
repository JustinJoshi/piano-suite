"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeatureBlock } from "@/lib/feature-blocks/types";
import {
  featureCategories,
  featureRegistry,
} from "@/lib/feature-blocks/registry";
import { manifestsByKind } from "@/lib/feature-blocks/manifest";
import type { ComponentManifest } from "@/lib/feature-blocks/manifest-types";
import { MarketplaceCard } from "./marketplace-card";
import { SupplementaryRow } from "./supplementary-row";

const ALL = "all";

const KIND_OPTIONS: { value: string; label: string }[] = [
  { value: "interactive", label: "Interactive" },
  { value: "source", label: "Sources" },
  { value: "transform", label: "Transforms" },
];

type LibrarySectionsProps = {
  pageBlocks: FeatureBlock[];
  onAddBlock: (type: string) => void;
  onRemoveBlockType: (type: string) => void;
};

/**
 * The preview block mounted for one manifest: registry default config,
 * resolved through a per-type lookup (never a registry enumeration — the
 * section lists come from the manifests).
 */
function previewBlockFor(manifest: ComponentManifest): FeatureBlock {
  const def = featureRegistry[manifest.type as keyof typeof featureRegistry];
  return {
    id: `preview-${manifest.type}`,
    type: manifest.type,
    version: 1,
    config: def ? { ...def.defaultConfig } : {},
  };
}

function matchesQuery(manifest: ComponentManifest, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    manifest.label.toLowerCase().includes(q) ||
    manifest.summary.toLowerCase().includes(q)
  );
}

/**
 * Block library body: interactive components as prominent cards with live
 * previews, sources and transforms as quiet single-line rows in a collapsed
 * section. Sections derive from manifestsByKind(); search and filters apply
 * to both tiers.
 */
export function LibrarySections({
  pageBlocks,
  onAddBlock,
  onRemoveBlockType,
}: LibrarySectionsProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const [kind, setKind] = useState<string>(ALL);
  const [secondaryExpanded, setSecondaryExpanded] = useState(false);

  const byKind = useMemo(() => manifestsByKind(), []);
  const addedTypes = useMemo(
    () => new Set(pageBlocks.map((b) => b.type)),
    [pageBlocks]
  );

  const visible = useMemo(() => {
    function filter(manifests: ComponentManifest[]): ComponentManifest[] {
      return manifests.filter(
        (m) =>
          matchesQuery(m, query) &&
          (category === ALL || m.category === category) &&
          (kind === ALL || m.kind === kind)
      );
    }
    return {
      interactive: filter(byKind.interactive),
      secondary: filter([...byKind.source, ...byKind.transform]),
    };
  }, [byKind, query, category, kind]);

  const totalCount =
    byKind.interactive.length + byKind.source.length + byKind.transform.length;
  const visibleCount = visible.interactive.length + visible.secondary.length;
  const isEmpty = visibleCount === 0;
  // A search that matches only supplementary entries must not hide them
  // behind the collapsed section: auto-expand while that state holds.
  const secondaryOnly =
    visible.interactive.length === 0 && visible.secondary.length > 0;
  const isSecondaryExpanded = secondaryExpanded || secondaryOnly;
  const trimmedQuery = query.trim();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="block-library-search"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Search blocks
          </label>
          <input
            id="block-library-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. rhythm, chords, timer"
            data-testid="library-search"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="block-library-category"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Category
          </label>
          <select
            id="block-library-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            data-testid="library-category-filter"
            className="rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          >
            <option value={ALL}>All categories</option>
            {featureCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="block-library-kind"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Kind
          </label>
          <select
            id="block-library-kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            data-testid="library-kind-filter"
            className="rounded-lg border border-border bg-card px-2 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          >
            <option value={ALL}>All kinds</option>
            {KIND_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p
        data-testid="library-result-count"
        className="text-xs text-muted-foreground"
      >
        {isEmpty
          ? `No blocks match${trimmedQuery ? ` "${trimmedQuery}"` : " your filters"}`
          : visibleCount === totalCount
            ? `Showing all ${totalCount} blocks`
            : `Showing ${visibleCount} of ${totalCount} blocks`}
      </p>

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No blocks match{trimmedQuery ? ` "${trimmedQuery}"` : " your filters"}
          . Try a different search or clear the filters.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.interactive.map((manifest) => {
              const block = previewBlockFor(manifest);
              return (
                <MarketplaceCard
                  key={manifest.type}
                  block={block}
                  added={addedTypes.has(manifest.type)}
                  onAdd={() => onAddBlock(manifest.type)}
                  onRemove={() => onRemoveBlockType(manifest.type)}
                  pageBlocks={pageBlocks}
                />
              );
            })}
          </div>

          {visible.secondary.length > 0 && (
            <section
              aria-label="Sources and transforms"
              data-testid="supplementary-section"
              className="rounded-xl border border-border bg-card/50 p-3"
            >
              <button
                type="button"
                data-testid="supplementary-toggle"
                aria-expanded={isSecondaryExpanded}
                aria-controls="supplementary-list"
                onClick={() => setSecondaryExpanded((value) => !value)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-foreground"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isSecondaryExpanded && "rotate-180"
                  )}
                />
                Sources and transforms
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {visible.secondary.length}
                </span>
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {isSecondaryExpanded ? "Hide" : "Show"}
                </span>
              </button>

              {isSecondaryExpanded && (
                <div
                  id="supplementary-list"
                  data-testid="supplementary-list"
                  className="mt-2 space-y-1"
                >
                  {visible.secondary.map((manifest) => (
                    <SupplementaryRow
                      key={manifest.type}
                      manifest={manifest}
                      added={addedTypes.has(manifest.type)}
                      onAdd={() => onAddBlock(manifest.type)}
                      onRemove={() => onRemoveBlockType(manifest.type)}
                      pageBlocks={pageBlocks}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
