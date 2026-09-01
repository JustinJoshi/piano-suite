"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { ArrowLeft, Blocks, Copy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureRenderer } from "@/components/feature-blocks/feature-renderer";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import { SaveCopyButton } from "@/components/workshop/save-copy-button";

export default function PublicDrillView() {
  const params = useParams();
  const drillId = params.id as string;

  const drill = useQuery(api.workshop.getPublicDrill, { drillId: drillId as never });

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
            href="/workshop"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to gallery
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/workshop"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Gallery
        </Link>
        <div className="flex items-center gap-2">
          {/* A URL is not a secret — copy works signed out. */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(window.location.href);
            }}
          >
            <Copy className="mr-2 h-3.5 w-3.5" />
            Copy link
          </Button>
          <SaveCopyButton
            drill={{
              _id: drill._id,
              title: drill.title,
              blocks: drill.blocks,
            }}
          />
        </div>
      </div>

      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {drill.title}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        by {drill.authorName}
        {drill.blockCount > 0 && (
          <>
            {" "}· {drill.blockCount}{" "}
            {drill.blockCount === 1 ? "block" : "blocks"}
          </>
        )}
      </p>
      {drill.forkedFrom && (
        <p className="mt-1 text-sm text-muted-foreground">
          Based on a{" "}
          <Link
            href={`/workshop/${drill.forkedFrom}`}
            className="text-primary underline-offset-4 hover:underline"
          >
            community drill
          </Link>
        </p>
      )}

      <div className="mt-8 space-y-6">
        <DrillRuntimeProvider pageId={drillId}>
          <FeatureRenderer blocks={drill.blocks} />
        </DrillRuntimeProvider>
      </div>
    </div>
  );
}
