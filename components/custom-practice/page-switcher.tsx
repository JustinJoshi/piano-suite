"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PracticePageStore } from "@/lib/custom-practice-storage";

type PageSwitcherProps = {
  store: PracticePageStore;
  onSelect: (pageId: string) => void;
  onCreate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function PageSwitcher({
  store,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
}: PageSwitcherProps) {
  const activePage =
    store.pages.find((p) => p.id === store.activePageId) ?? store.pages[0];
  const canDelete = store.pages.length > 1;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={activePage?.id ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        aria-label="Practice page"
        className="min-w-0 max-w-full flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
      >
        {store.pages.map((page) => (
          <option key={page.id} value={page.id}>
            {page.title.trim() === "" ? "Untitled" : page.title}{" "}
            ({page.blocks.length} {page.blocks.length === 1 ? "block" : "blocks"})
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={onCreate}
          aria-label="New page"
          title="New page"
          className="h-9 w-9"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onDuplicate}
          aria-label="Duplicate page"
          title="Duplicate page"
          className="h-9 w-9"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onDelete}
          disabled={!canDelete}
          aria-label="Delete page"
          title={canDelete ? "Delete page" : "Cannot delete the last page"}
          className="h-9 w-9"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
