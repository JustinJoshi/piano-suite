"use client";

import Link from "next/link";
import { Check, CloudOff, Loader2, TriangleAlert } from "lucide-react";
import type { WorkshopSyncStatus } from "@/hooks/useWorkshopSync";
import { useAuthAccess } from "@/hooks/useAuthAccess";

const STATUS_META: Record<
  WorkshopSyncStatus,
  { icon: typeof Check; label: string; className: string }
> = {
  local: {
    icon: CloudOff,
    label: "Saved locally",
    className: "text-muted-foreground",
  },
  syncing: {
    icon: Loader2,
    label: "Syncing…",
    className: "text-muted-foreground",
  },
  synced: {
    icon: Check,
    label: "Synced",
    className: "text-success",
  },
  error: {
    icon: TriangleAlert,
    label: "Sync error",
    className: "text-destructive",
  },
};

export function WorkshopSyncBadge({ status }: { status: WorkshopSyncStatus }) {
  const { isSignedIn, authDisabled } = useAuthAccess();

  // Quiet affordance for the public workshop: pages work without an
  // account; sign-in is the upgrade, not the gate.
  if (status === "local") {
    if (isSignedIn || authDisabled) return null;
    return (
      <span
        data-testid="workshop-sync-badge"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <CloudOff className="h-3.5 w-3.5" />
        Saved in this browser ·{" "}
        <Link
          href="/sign-in"
          className="underline underline-offset-2 hover:text-foreground"
        >
          Sign in to sync
        </Link>
      </span>
    );
  }

  const meta = STATUS_META[status];
  const Icon = meta.icon;

  return (
    <span
      data-testid="workshop-sync-badge"
      className={`inline-flex items-center gap-1.5 text-xs ${meta.className}`}
    >
      <Icon className={`h-3.5 w-3.5 ${status === "syncing" ? "animate-spin" : ""}`} />
      {meta.label}
    </span>
  );
}
