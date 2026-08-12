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
        data-testid="onboarding-shell"
        className={cn(
          "z-50 overflow-hidden bg-background",
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
        {/* Ambient background layer — fixed so it always covers the viewport */}
        <div
          className={cn(
            "pointer-events-none fixed inset-0 onboarding-ambient",
            !isInstant && "transition-opacity duration-1000 ease-out",
            visible ? "opacity-60" : "opacity-0"
          )}
          aria-hidden="true"
        />
        <div
          className="onboarding-orb pointer-events-none fixed -left-24 top-1/4 h-72 w-72 rounded-full opacity-30"
          aria-hidden="true"
        />
        <div
          className="onboarding-orb pointer-events-none fixed -right-24 bottom-1/4 h-96 w-96 rounded-full opacity-25"
          style={{ animationDelay: "4s" }}
          aria-hidden="true"
        />
        <div
          className="onboarding-orb pointer-events-none fixed -right-24 top-1/3 h-80 w-80 rounded-full opacity-25"
          style={{ animationDelay: "2s" }}
          aria-hidden="true"
        />

        {/* Scrollable content area */}
        <div
          ref={ref}
          className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden"
        >
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col px-4 sm:px-6">
            {children}
          </div>
        </div>
      </div>
    );
  }
);
