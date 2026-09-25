"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Blocks,
  Check,
  Copy,
  Hammer,
  LayoutGrid,
  Play,
} from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { RollChordStrip } from "@/components/roll/chord-strip";
import { RollPageHead, RollRuleLabel } from "@/components/roll/page-head";
import { PageThumbnail } from "@/components/workshop-grid/page-thumbnail";
import { marketplaceSeeds } from "@/lib/marketplace-seeds";
import { featureRegistry } from "@/lib/feature-blocks/registry";
import {
  forkPageIntoStoreWithEvent,
  getPracticePageStore,
  setPracticePageStore,
} from "@/lib/custom-practice-storage";
import { capturePending } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function relativeTime(updatedAt: number): string {
  const diff = Date.now() - updatedAt;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function blockLabels(blocks: Array<{ type: string }>): string[] {
  return blocks
    .map((b) => featureRegistry[b.type as keyof typeof featureRegistry]?.label)
    .filter((label): label is string => Boolean(label));
}

/** Light a pseudo-random but stable chord per card so the strip has life. */
function chordFor(seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const root = hash % 12;
  const shapes = [
    [0, 4, 7],
    [0, 3, 7],
    [0, 4, 7, 11],
    [0, 3, 7, 10],
    [0, 4, 7, 10],
  ];
  // Unsigned shift: `>>` on a uint32 can go negative and index nothing.
  const shape = shapes[(hash >>> 4) % shapes.length] ?? shapes[0];
  return shape.map((interval) => root + interval);
}

/**
 * What's on the page: a miniature of its grid for sighted visitors, and the
 * same block names as a plain list for screen readers (the sketch itself is
 * decorative).
 */
function PageContents({ blocks }: { blocks: Array<{ type: string }> }) {
  return (
    <>
      <PageThumbnail blocks={blocks} rows={3} />
      <ul className="sr-only">
        {blockLabels(blocks).map((label, index) => (
          <li key={`${label}-${index}`}>{label}</li>
        ))}
      </ul>
    </>
  );
}

/** Placeholder cards while community pages load; the sheen rests under reduced motion. */
function CommunitySkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      role="status"
      aria-label="Loading community pages"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          aria-hidden
          className="roll-card-paper overflow-hidden"
        >
          <div className="skeleton h-7 rounded-none" />
          <div className="space-y-3 p-5">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SeedCard({
  id,
  title,
  authorName,
  authorNote,
  blocks,
}: {
  id: string;
  title: string;
  authorName: string;
  authorNote: string;
  blocks: Array<{ type: string }>;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  function copyToWorkshop() {
    // Compute before the setter; the event fires once, outside the updater.
    const { result, event } = forkPageIntoStoreWithEvent(
      getPracticePageStore(),
      { title, blocks }
    );
    setPracticePageStore(result);
    capturePending(event);
    setCopied(true);
    router.push("/tools/workshop");
  }

  return (
    <article className="roll-card-paper group relative flex flex-col overflow-hidden">
      <RollChordStrip notes={chordFor(id).map((n) => n + 60)} />
      <span className="roll-stamp-chip absolute right-3 top-9">Featured</span>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <span className="shrink-0 text-xs text-muted-foreground">
            by {authorName}
          </span>
        </div>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {authorNote}
        </p>

        <div className="mt-4">
          <PageContents blocks={blocks} />
        </div>

        <div className="mt-5 flex w-full gap-2">
          <Link
            href={`/marketplace/${id}`}
            aria-label={`Try it: ${title}`}
            className={cn(
              buttonVariants({ size: "sm" }),
              "flex-1"
            )}
          >
            <Play className="h-3.5 w-3.5" />
            Try it
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={copyToWorkshop}
            className="flex-1"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Copy to my workshop
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function MarketplacePage() {
  const drills = useQuery(api.workshop.listPublicDrills, {});

  return (
    <div className="relative">
      <RollPageHead
        label="The shelf"
        note="It’s new, so there’s room."
        eyebrow="Practice pages to borrow"
        title="Marketplace"
        lede={
          <p>
            Practice pages built and shared by fellow learners. Try one, copy it into your own workshop, and make it
            yours. No sign-up needed to borrow.
          </p>
        }
      >
        <Link href="/tools/workshop" className="roll-btn roll-btn-ink mt-2">
          <Hammer className="h-4 w-4" />
          Build your own
        </Link>
      </RollPageHead>

      <div className="roll-page-end">
        <section className="mb-16" aria-label="Featured pages">
          <RollRuleLabel>Featured</RollRuleLabel>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {marketplaceSeeds.map((seed) => (
              <SeedCard key={seed.id} {...seed} />
            ))}
          </div>
        </section>

        <section aria-label="Community pages">
          <RollRuleLabel>From the community</RollRuleLabel>
          {drills === undefined ? (
            <CommunitySkeleton />
          ) : drills.length === 0 ? (
            <div className="rounded-md border border-dashed border-rule bg-paper-bright/60 p-12 text-center">
              <LayoutGrid className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">
                No community pages yet — yours could be the very first. Publish
                one from the Workshop and it appears here.
              </p>
              <Link
                href="/tools/workshop"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Open the Workshop
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {drills.map((drill) => (
                <Link
                  key={drill._id}
                  href={`/marketplace/${drill._id}`}
                  className="roll-card-paper group flex flex-col overflow-hidden"
                >
                  <RollChordStrip notes={chordFor(drill._id).map((n) => n + 60)} />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
                        {drill.title}
                      </h3>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/70 px-2 py-0.5 font-medium text-foreground/80">
                        <Blocks className="h-3 w-3" />
                        {drill.blockCount}{" "}
                        {drill.blockCount === 1 ? "block" : "blocks"}
                      </span>
                      <span>by {drill.authorName}</span>
                      <span aria-hidden>·</span>
                      <span>{relativeTime(drill.updatedAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
