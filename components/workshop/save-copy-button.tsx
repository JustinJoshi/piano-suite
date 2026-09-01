"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BookmarkPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import {
  getPracticePageStore,
  setPracticePageStore,
  importPublicPage,
} from "@/lib/custom-practice-storage";
import type { FeatureBlock } from "@/lib/feature-blocks/types";

const GONE_MESSAGE = "This page is no longer available.";
const ERROR_MESSAGE = "Could not save a copy — try again.";

type PublicDrillPayload = {
  _id: string;
  title: string;
  blocks: FeatureBlock[];
};

/**
 * "Save a copy to my Workshop" on the public drill view. Unsigned visitors
 * copy the already-fetched public payload straight into localStorage;
 * signed-in users run `forkCustomDrill` first and import using the
 * returned `clientPageId` (so a later Pro sync matches the server row —
 * Free sync never pulls, a mutation without a local write is a black
 * hole). Either way the visitor lands in the editor on their copy.
 */
export function SaveCopyButton({ drill }: { drill: PublicDrillPayload }) {
  const router = useRouter();
  const { isSignedIn } = useAuthAccess();
  const forkDrill = useMutation(api.workshop.forkCustomDrill);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveCopy() {
    setError(null);
    setPending(true);

    try {
      // Unsigned (and AUTH_DISABLED local mode — no Clerk session): the
      // public payload is already on the client; no mutation needed.
      if (!isSignedIn) {
        setPracticePageStore(
          importPublicPage(getPracticePageStore(), {
            title: drill.title,
            blocks: drill.blocks,
          })
        );
        router.push("/tools/workshop");
        return;
      }

      const forked = await forkDrill({ drillId: drill._id as never });
      if (forked === null) {
        setError(GONE_MESSAGE);
        return;
      }

      setPracticePageStore(
        importPublicPage(getPracticePageStore(), {
          id: forked.clientPageId,
          title: forked.title,
          blocks: forked.blocks,
        })
      );
      router.push("/tools/workshop");
    } catch {
      setError(ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={saveCopy} disabled={pending}>
        {pending ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <BookmarkPlus className="mr-2 h-3.5 w-3.5" />
        )}
        Save a copy to my Workshop
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
