"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <span
        aria-hidden
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 font-heading text-xl italic text-destructive ring-1 ring-destructive/25"
      >
        ♭
      </span>
      <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        Something went wrong
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        This page hit an unexpected error. You can try again, or sign out and
        back in if the problem continues.
      </p>
      {error.digest ? (
        <p className="font-mono text-[0.68rem] text-muted-foreground/80">
          Reference {error.digest}
        </p>
      ) : null}
      <Button type="button" className="rounded-full px-5" onClick={() => reset()}>
        <RotateCcw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
