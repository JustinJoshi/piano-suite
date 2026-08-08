"use client";

import { FileAudio, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCustomKit } from "@/lib/audio-upload";
import type { CustomKit } from "@/lib/audio-settings";

 type CustomKitCardProps = {
  kit: CustomKit;
  isActive: boolean;
  onUse: () => void;
  onDelete: () => void;
};

export function CustomKitCard({
  kit,
  isActive,
  onUse,
  onDelete,
}: CustomKitCardProps) {
  async function handleDelete() {
    await deleteCustomKit(kit);
    onDelete();
  }

  const detail =
    kit.kind === "sf2"
      ? `SF2 • ${kit.preset}`
      : `Samples • ${Object.keys(kit.map).length} notes`;

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
        isActive
          ? "border-primary/50 bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card"
      }`}
      data-testid="active-custom-kit"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
          <FileAudio className="h-5 w-5" />
        </div>
        <div>
          <div className="font-medium text-foreground">{kit.name}</div>
          <div className="text-xs text-muted-foreground">{detail}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isActive && (
          <Button variant="outline" size="sm" onClick={onUse} data-testid="use-custom-kit">
            Use this kit
          </Button>
        )}
        {isActive && (
          <span className="inline-flex items-center gap-1 text-xs text-primary">
            <Check className="h-3.5 w-3.5" />
            Active
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void handleDelete()}
          aria-label="Delete custom kit"
          data-testid="delete-custom-kit"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
