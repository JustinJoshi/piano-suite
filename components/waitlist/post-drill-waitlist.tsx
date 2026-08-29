"use client";

import { useState } from "react";
import { useDrillRuntime } from "@/lib/drill-runtime";
import { WaitlistCta } from "@/components/waitlist/waitlist-cta";

const DISMISS_KEY = "waitlist.postDrillDismissed";

function readDismissed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(DISMISS_KEY) === "true";
}

export function PostDrillWaitlist() {
  const runtime = useDrillRuntime();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (dismissed || runtime?.phase !== "finished") {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, "true");
            setDismissed(true);
          }}
          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Maybe later
        </button>
      </div>
      <WaitlistCta source="post-drill" />
    </div>
  );
}
