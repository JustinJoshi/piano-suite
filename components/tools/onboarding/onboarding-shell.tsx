"use client";

import { cn } from "@/lib/utils";

interface OnboardingShellProps {
  children: React.ReactNode;
  visible: boolean;
  isInstant: boolean;
  onExited?: () => void;
}

export function OnboardingShell({
  children,
  visible,
  isInstant,
  onExited,
}: OnboardingShellProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
        !isInstant && "transition-opacity duration-1000 ease-out"
      )}
      onTransitionEnd={(e) => {
        if (e.propertyName === "opacity" && !visible) {
          onExited?.();
        }
      }}
    >
      <div className="relative z-10 w-full max-w-3xl px-4 sm:px-6">
        {children}
      </div>
    </div>
  );
}
