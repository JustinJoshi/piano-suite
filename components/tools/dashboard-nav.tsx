"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const DashboardNavContext = createContext<DashboardNavContextValue | null>(
  null
);

export function DashboardNavProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");

    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const toggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  return (
    <DashboardNavContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </DashboardNavContext.Provider>
  );
}

export function useDashboardNav(): DashboardNavContextValue {
  const context = useContext(DashboardNavContext);
  if (!context) {
    throw new Error("useDashboardNav must be used within DashboardNavProvider");
  }
  return context;
}

export function useDashboardNavOptional(): DashboardNavContextValue | null {
  return useContext(DashboardNavContext);
}

export function DashboardMenuButton({ className }: { className?: string }) {
  const nav = useDashboardNavOptional();
  if (!nav) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "md:hidden shrink-0 text-muted-foreground hover:text-foreground",
        className
      )}
      aria-expanded={nav.open}
      aria-controls="dashboard-sidebar"
      aria-label={nav.open ? "Close navigation menu" : "Open navigation menu"}
      onClick={nav.toggle}
      data-testid="dashboard-menu-button"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

/** Mobile-only sticky chrome for settings pages that lack DrillShell headers. */
export function DashboardMobileTopBar() {
  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/50 bg-background/95 px-4 backdrop-blur md:hidden"
      data-testid="dashboard-mobile-top-bar"
    >
      <DashboardMenuButton />
      <span className="font-heading text-base font-semibold tracking-tight text-foreground">
        Piano Suite
      </span>
    </header>
  );
}
