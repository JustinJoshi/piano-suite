"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Blocks, Copy, Flag, GitFork } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureRenderer } from "@/components/feature-blocks/feature-renderer";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import {
  forkPageIntoStoreWithEvent,
  getPracticePageStore,
  setPracticePageStore,
} from "@/lib/custom-practice-storage";
import { capturePending } from "@/lib/analytics";

type ForkState = "idle" | "forking" | "error";

export default function PublicDrillView() {
  const params = useParams();
  const router = useRouter();
  const { canAccess, isSignedIn } = useAuthAccess();
  const drillId = params.id as string;

  const drill = useQuery(api.workshop.getPublicDrill, { drillId: drillId as never });
  const forkDrill = useMutation(api.workshop.forkCustomDrill);
  const reportDrill = useMutation(api.workshop.reportPublicDrill);

  const [forkState, setForkState] = useState<ForkState>("idle");
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportError, setReportError] = useState(false);

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

      // Compute before the setter; the event fires once, outside the updater.
      const { result, event } = forkPageIntoStoreWithEvent(
        getPracticePageStore(),
        drill,
        linkedId
      );
      setPracticePageStore(result);
      capturePending(event);
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

  async function handleReport() {
    if (!drill || reported) return;
    try {
      await reportDrill({ drillId: drillId as never });
      setReported(true);
    } catch {
      setReportError(true);
    }
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
          {reported ? (
            <span className="text-sm text-muted-foreground">
              Thanks &mdash; we&apos;ll take a look.
            </span>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void handleReport()}
              disabled={reportError}
              aria-label="Report this page"
            >
              <Flag className="h-3.5 w-3.5" />
              Report
            </Button>
          )}
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
