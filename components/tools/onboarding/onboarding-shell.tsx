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
          "z-50 flex items-center justify-center overflow-y-auto bg-background",
          mode === "fixed" ? "fixed inset-0 min-h-dvh" : "absolute inset-0 min-h-full",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
          !isInstant && "transition-opacity duration-1000 ease-out"
        )}
        onTransitionEnd={(e) => {
          if (e.propertyName === "opacity" && !visible) {
            onExited?.();
          }
        }}
      >
        {/* Ambient background layer */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-60 onboarding-ambient",
            !isInstant && "transition-opacity duration-1000 ease-out",
            visible ? "opacity-60" : "opacity-0"
          )}
          aria-hidden="true"
        />
        <div
          className="onboarding-orb pointer-events-none absolute -left-32 top-1/4 h-64 w-64 rounded-full opacity-40"
          aria-hidden="true"
        />
        <div
          className="onboarding-orb pointer-events-none absolute -right-32 bottom-1/4 h-80 w-80 rounded-full opacity-30"
          style={{ animationDelay: "4s" }}
          aria-hidden="true"
        />

        <div className="relative z-10 w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          {children}
        </div>
      </div>
    );
  }
);
