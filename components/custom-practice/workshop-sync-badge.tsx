"use client";

import { Check, CloudOff, Loader2, TriangleAlert } from "lucide-react";
import type { WorkshopSyncStatus } from "@/hooks/useWorkshopSync";

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
  if (status === "local") return null;

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
