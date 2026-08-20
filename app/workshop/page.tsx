"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { LayoutGrid, ExternalLink } from "lucide-react";

function relativeTime(updatedAt: number): string {
  const diff = Date.now() - updatedAt;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function WorkshopGalleryPage() {
  const drills = useQuery(api.workshop.listPublicDrills, {});

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Workshop Gallery
        </h1>
        <p className="mt-2 text-muted-foreground">
          Community-built practice pages you can try and duplicate into your own
          workshop.
        </p>
      </div>

      {drills === undefined ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : drills.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <LayoutGrid className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            No practice pages have been published yet. Be the first to share
            one!
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
              href={`/workshop/${drill._id}`}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30 hover:bg-card/80"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground group-hover:text-primary">
                  {drill.title}
                </h2>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="mb-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {drill.blockCount}{" "}
                  {drill.blockCount === 1 ? "block" : "blocks"}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  by {drill.authorName}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {relativeTime(drill.updatedAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
