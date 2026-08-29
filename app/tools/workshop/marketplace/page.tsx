"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DrillShell } from "@/components/drills/drill-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Marketplace } from "@/components/workshop-marketplace/marketplace";
import { useToolUserReady } from "@/hooks/useToolUserReady";
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

export default function WorkshopMarketplacePage() {
  const { canAccess, userReady } = useToolUserReady();

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
      {!canAccess ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Sign in to build your workshop.
        </div>
      ) : !userReady ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading your account…
        </div>
      ) : (
        <Marketplace
          pageBlocks={page.blocks}
          onAddBlock={addBlock}
          onRemoveBlockType={removeBlockType}
        />
      )}
    </DrillShell>
  );
}
