"use client";

import Link from "next/link";
import { Wrench } from "lucide-react";
import { isDevToolsVisible } from "@/lib/dev-tools";
import { cn } from "@/lib/utils";

interface DevToolsLinkProps {
  className?: string;
}

export function DevToolsLink({ className }: DevToolsLinkProps) {
  if (!isDevToolsVisible()) {
    return null;
  }

  return (
    <Link
      href="/dev/welcome-lab"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary shadow-lg shadow-primary/10 backdrop-blur-sm transition-colors hover:bg-primary/20",
        className
      )}
    >
      <Wrench className="h-4 w-4" />
      Dev lab
    </Link>
  );
}
