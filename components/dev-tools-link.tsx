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
        "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary backdrop-blur-sm transition-colors hover:bg-primary/20",
        className
      )}
    >
      <Wrench className="h-3.5 w-3.5" />
      Dev lab
    </Link>
  );
}
