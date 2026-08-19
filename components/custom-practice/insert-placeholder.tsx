"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InsertPlaceholderProps = {
  onClick: () => void;
  className?: string;
};

export function InsertPlaceholder({ onClick, className }: InsertPlaceholderProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full border-dashed border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      onClick={onClick}
    >
      <Plus className="mr-2 h-4 w-4" />
      Add feature
    </Button>
  );
}
