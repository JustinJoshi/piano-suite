"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Globe,
  LayoutTemplate,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PracticePageStore } from "@/lib/custom-practice-storage";

type PagesMenuProps = {
  store: PracticePageStore;
  shareOpen: boolean;
  onSelect: (pageId: string) => void;
  onCreate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleShare: () => void;
  onTemplates: () => void;
};

function pageTitle(store: PracticePageStore): string {
  const page =
    store.pages.find((p) => p.id === store.activePageId) ?? store.pages[0];
  if (!page) return "Pages";
  const title = page.title.trim();
  return title === "" ? "Untitled" : title;
}

/** Dropdown for switching between custom pages and page-level actions. */
export function PagesMenu({
  store,
  shareOpen,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  onToggleShare,
  onTemplates,
}: PagesMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const canDelete = store.pages.length > 1;

  function close(): void {
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        type="button"
        variant="outline"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="max-w-52 gap-2"
      >
        <span className="truncate">{pageTitle(store)}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </Button>

      {open ? (
        <div className="absolute left-0 top-full z-40 mt-2 w-full min-w-56 rounded-xl border border-border bg-card p-1.5 shadow-lg">
          <div className="max-h-64 overflow-y-auto">
            {store.pages.map((page) => {
              const isActive = page.id === store.activePageId;
              const title = page.title.trim() || "Untitled";
              return (
                <button
                  key={page.id}
                  type="button"
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Switch to ${title}`}
                  onClick={() => {
                    onSelect(page.id);
                    close();
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/50",
                    isActive ? "text-primary" : "text-foreground"
                  )}
                >
                  <span className="truncate">
                    Switch to {title}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({page.blocks.length})
                    </span>
                  </span>
                  {isActive ? <Check className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>

          <div className="my-1.5 border-t border-border" />

          <MenuAction icon={Plus} label="New page" onClick={() => { onCreate(); close(); }} />
          <MenuAction
            icon={LayoutTemplate}
            label="Templates…"
            onClick={() => { onTemplates(); close(); }}
          />
          <MenuAction icon={Copy} label="Duplicate page" onClick={() => { onDuplicate(); close(); }} />
          <MenuAction
            icon={Trash2}
            label="Delete page"
            disabled={!canDelete}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => { onDelete(); close(); }}
          />
          <MenuAction
            icon={Globe}
            label="Share page…"
            className={cn(shareOpen && "text-primary")}
            onClick={() => { onToggleShare(); close(); }}
          />
        </div>
      ) : null}
    </div>
  );
}

function MenuAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}
