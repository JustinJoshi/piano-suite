"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { DrillShell } from "@/components/drills/drill-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Marketplace } from "@/components/workshop-marketplace/marketplace";
import { useExperimentalFeatures } from "@/hooks/useExperimentalFeatures";
import { isExperimentalToolHref } from "@/lib/experimental-features";
import { labTools } from "@/lib/tools";
import {
  getPracticePageStore,
  setPracticePageStore,
  subscribePracticePageStore,
  getServerPracticePageStore,
  getActivePage,
  upsertPracticePage,
  appendBlockToPage,
  removeFirstBlockOfType,
} from "@/lib/custom-practice-storage";

/** Public like the workshop itself: add/remove writes localStorage. */
export default function WorkshopMarketplacePage() {
  const { enabled: experimentalEnabled } = useExperimentalFeatures();

  const store = useSyncExternalStore(
    subscribePracticePageStore,
    getPracticePageStore,
    getServerPracticePageStore
  );

  const page = useMemo(() => getActivePage(store), [store]);

  // Labs are not sidebar entries anymore (Phase 1.5) — they are reachable
  // from the shelf until Phase 2 turns them into blocks. Multigrid stays
  // experimental-gated.
  const labs = labTools.filter(
    (lab) => experimentalEnabled || !isExperimentalToolHref(lab.href)
  );

  function addBlock(type: string) {
    setPracticePageStore(
      upsertPracticePage(store, appendBlockToPage(page, type))
    );
  }

  function removeBlockType(type: string) {
    setPracticePageStore(
      upsertPracticePage(store, removeFirstBlockOfType(page, type))
    );
  }

  return (
    <DrillShell
      title="Shelf"
      subtitle="The official block library — preview one and add it to your workshop."
      right={
        <Link
          href="/tools/workshop"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workshop
        </Link>
      }
    >
      <Marketplace
        pageBlocks={page.blocks}
        onAddBlock={addBlock}
        onRemoveBlockType={removeBlockType}
      />

      <section className="mt-10 border-t border-border/50 pt-6">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <FlaskConical className="h-3.5 w-3.5" />
          Labs — standalone explorers
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab) => (
            <Link
              key={lab.href}
              href={lab.href}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex items-center gap-2">
                <lab.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {lab.title}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {lab.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </DrillShell>
  );
}
