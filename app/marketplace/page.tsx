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
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Keybed } from "@/components/brand/keybed";
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

function BlockChips({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-md border border-border bg-muted/70 px-2 py-0.5 text-[0.7rem] font-medium text-foreground/80"
        >
          {label}
        </span>
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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-surface transition-all hover:-translate-y-0.5 hover:border-door-explore/40 hover:shadow-raised">
      <div className="relative">
        <Keybed
          octaves={3}
          lit={chordFor(id)}
          litColor="var(--color-door-explore)"
          className="h-9 w-full"
        />
        <span className="absolute right-3 top-2 inline-flex items-center gap-1 rounded-full bg-door-explore px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-ebony shadow-key">
          <Sparkles className="h-3 w-3" />
          Featured
        </span>
      </div>
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
          <BlockChips labels={blockLabels(blocks)} />
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={copyToWorkshop}
          className="mt-5 w-full"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          Copy to my workshop
        </Button>
      </div>
    </article>
  );
}

export default function MarketplacePage() {
  const drills = useQuery(api.workshop.listPublicDrills, {});

  return (
    <div className="relative">
      {/* Header band */}
      <section className="relative overflow-hidden border-b border-border bg-card/50">
        <div
          aria-hidden
          className="staff-lines staff-lines-faded pointer-events-none absolute inset-0"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-door-explore/12 to-transparent"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-door-explore">
              <Users className="h-3.5 w-3.5" />
              explore
            </span>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Marketplace
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Practice pages built and shared by fellow learners — try one,
              copy it, make it yours. No sign-up needed, ever.
            </p>
          </div>
          <Link
            href="/tools/workshop"
            className={cn(buttonVariants({ size: "lg" }), "shrink-0 rounded-full px-6")}
          >
            <Hammer className="h-4 w-4" />
            Build your own
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="mb-16" aria-label="Featured pages">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-door-explore" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Featured
            </h2>
            <span className="bar-line flex-1" aria-hidden />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {marketplaceSeeds.map((seed) => (
              <SeedCard key={seed.id} {...seed} />
            ))}
          </div>
        </section>

        <section aria-label="Community pages">
          <div className="mb-6 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              From the community
            </h2>
            <span className="bar-line flex-1" aria-hidden />
          </div>
          {drills === undefined ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-surface">
              Loading…
            </div>
          ) : drills.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {drills.map((drill) => (
                <Link
                  key={drill._id}
                  href={`/marketplace/${drill._id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-surface transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-raised"
                >
                  <Keybed
                    octaves={3}
                    lit={chordFor(drill._id)}
                    litColor="var(--color-door-explore)"
                    className="h-7 w-full opacity-90"
                  />
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
