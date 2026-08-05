"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface OnboardingShellProps {
  children: React.ReactNode;
  visible: boolean;
  isInstant: boolean;
  onExited?: () => void;
  /**
   * `fixed` covers the whole viewport (production). `inline` is positioned
   * absolutely inside its nearest positioned ancestor (dev lab preview).
   */
  mode?: "fixed" | "inline";
}

export const OnboardingShell = forwardRef<HTMLDivElement, OnboardingShellProps>(
  function OnboardingShell(
    { children, visible, isInstant, onExited, mode = "fixed" },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "z-50 flex items-start justify-center overflow-y-auto bg-background",
          mode === "fixed" ? "fixed inset-0" : "absolute inset-0",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
          !isInstant && "transition-opacity duration-1000 ease-out"
        )}
        onTransitionEnd={(e) => {
          if (e.propertyName === "opacity" && !visible) {
            onExited?.();
          }
        }}
      >
        <div className="relative z-10 w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </div>
      </div>
    );
  }
);
