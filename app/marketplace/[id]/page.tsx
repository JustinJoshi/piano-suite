"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Blocks, Copy, GitFork } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureRenderer } from "@/components/feature-blocks/feature-renderer";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import {
  forkPageIntoStore,
  getPracticePageStore,
  setPracticePageStore,
} from "@/lib/custom-practice-storage";

type ForkState = "idle" | "forking" | "error";

export default function PublicDrillView() {
  const params = useParams();
  const router = useRouter();
  const { canAccess, isSignedIn } = useAuthAccess();
  const drillId = params.id as string;

  const drill = useQuery(api.workshop.getPublicDrill, { drillId: drillId as never });
  const forkDrill = useMutation(api.workshop.forkCustomDrill);

  const [forkState, setForkState] = useState<ForkState>("idle");
  const [copied, setCopied] = useState(false);

  if (drill === undefined) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  if (drill === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Blocks className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            This practice page is not available.
          </p>
          <Link
            href="/marketplace"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to marketplace
          </Link>
        </div>
      </div>
    );
  }

  async function handleFork() {
    if (!drill) return;
    setForkState("forking");

    try {
      // Signed in: the mutation records lineage (forkedFrom) and returns the
      // Convex clientPageId so the local copy syncs later. Signed out: the
      // fork lands in localStorage and opens after sign-in.
      let linkedId: string | undefined;
      if (canAccess) {
        const result = await forkDrill({ drillId: drillId as never });
        linkedId = result?.clientPageId;
      }

      setPracticePageStore(
        forkPageIntoStore(getPracticePageStore(), drill, linkedId)
      );
      router.push("/tools/workshop");
    } catch {
      setForkState("error");
    }
  }

  function handleCopyLink() {
    void navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Marketplace
      </Link>

      <header className="mt-6 flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-surface sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-door-explore">
            community page
          </span>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {drill.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            by {drill.authorName}
            {drill.blockCount > 0 && (
              <>
                {" "}· {drill.blockCount}{" "}
                {drill.blockCount === 1 ? "block" : "blocks"}
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleCopyLink}>
            {copied ? (
              <Copy className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button
            size="sm"
            onClick={() => void handleFork()}
            disabled={forkState === "forking"}
          >
            <GitFork className="h-3.5 w-3.5" />
            {forkState === "forking" ? "Forking…" : "Fork to my workshop"}
          </Button>
        </div>
      </header>

      {!isSignedIn && (
        <p className="mt-3 text-sm text-muted-foreground">
          Forking copies this page into this browser. Sign in afterwards to
          open it in your workshop.
        </p>
      )}
      {forkState === "error" && (
        <p className="mt-3 text-sm text-destructive">
          Forking failed — try again.
        </p>
      )}

      <div className="mt-8 space-y-6">
        <DrillRuntimeProvider pageId={drillId} blocks={drill.blocks}>
          <FeatureRenderer blocks={drill.blocks} />
        </DrillRuntimeProvider>
      </div>
    </div>
  );
}
