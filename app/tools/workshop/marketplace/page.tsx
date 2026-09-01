"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DrillShell } from "@/components/drills/drill-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Marketplace } from "@/components/workshop-marketplace/marketplace";
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
  const store = useSyncExternalStore(
    subscribePracticePageStore,
    getPracticePageStore,
    getServerPracticePageStore
  );

  const page = useMemo(() => getActivePage(store), [store]);

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
      title="Marketplace"
      subtitle="Preview features and add them to your workshop."
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
    </DrillShell>
  );
}
