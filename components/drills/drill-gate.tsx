"use client";

import Link from "next/link";
import { ArrowRight, Piano } from "lucide-react";
import { SignInButton } from "@clerk/nextjs";
import { Keybed } from "@/components/brand/keybed";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Signed-out / loading state shared by the four ready-made drill pages.
 * A quiet stage instead of a bare sentence: the message, a sign-in key,
 * and a pointer to the Workshop, which runs without an account.
 */
export function DrillGate({
  message,
  state,
}: {
  /** The exact signed-out sentence (kept stable for tests). */
  message: string;
  state: "signed-out" | "loading";
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-surface"
      role={state === "loading" ? "status" : undefined}
    >
      <div
        aria-hidden="true"
        className="staff-lines staff-lines-faded pointer-events-none absolute inset-0"
      />
      <div className="relative flex flex-col items-center gap-4 px-6 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
          <Piano className="h-5 w-5" />
        </span>
        <p className="max-w-md text-sm text-muted-foreground">
          {state === "loading" ? "Loading your settings…" : message}
        </p>
        {state === "signed-out" ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <SignInButton>
              <Button size="sm" className="rounded-full px-4">
                Sign in
              </Button>
            </SignInButton>
            <Link
              href="/tools/workshop"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "text-muted-foreground hover:text-foreground"
              )}
            >
              Practice free in the Workshop
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
      <Keybed
        octaves={5}
        lit={[0, 4, 7]}
        className="relative h-6 w-full opacity-80"
      />
    </div>
  );
}
