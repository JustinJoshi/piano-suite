"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Globe, Link as LinkIcon, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { captureEvent } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ShareMenuProps = {
  clientPageId: string;
  title: string;
  blocks: unknown[];
  updatedAt: number;
};

export function ShareMenu({
  clientPageId,
  title,
  blocks,
  updatedAt,
}: ShareMenuProps) {
  // canPersist gates Convex sync/prefs, not publishing — publishing is free
  // for any signed-in user; only the signed-in distinction matters here.
  const { isSignedIn } = useAuthAccess();
  const publishDrill = useMutation(api.workshop.publishCustomDrill);
  const unpublishDrill = useMutation(api.workshop.unpublishCustomDrill);
  const publishState = useQuery(
    api.workshop.getPublishState,
    isSignedIn ? { clientPageId } : "skip"
  );

  const isPublic = publishState?.isPublic ?? false;
  const drillId = publishState?.drillId;

  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      await publishDrill({ clientPageId, title, blocks, updatedAt });
      captureEvent("page_published", { pageId: clientPageId });
    } catch (err) {
      setPublishError(
        err instanceof Error ? err.message : "Failed to publish"
      );
    } finally {
      setPublishing(false);
    }
  }, [publishDrill, clientPageId, title, blocks, updatedAt]);

  const handleUnpublish = useCallback(async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      await unpublishDrill({ clientPageId });
    } catch (err) {
      setPublishError(
        err instanceof Error ? err.message : "Failed to unpublish"
      );
    } finally {
      setPublishing(false);
    }
  }, [unpublishDrill, clientPageId]);

  const handleCopyLink = useCallback(() => {
    if (!drillId) return;
    const url = `${window.location.origin}/marketplace/${drillId}`;
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [drillId]);

  const publicUrl = drillId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/marketplace/${drillId}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4" />
          Share
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSignedIn ? (
          <p className="text-sm text-muted-foreground">
            <Link href="/sign-in" className="underline hover:text-foreground">
              Sign in
            </Link>{" "}
            to publish this page to the community.
          </p>
        ) : isPublic ? (
          <>
            <p className="text-sm text-success">This page is published.</p>
            {publicUrl && (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={publicUrl}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <LinkIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnpublish}
              disabled={publishing}
              className="w-full"
            >
              <Lock className="mr-2 h-3.5 w-3.5" />
              Unpublish
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePublish}
            disabled={publishing}
            className="w-full"
          >
            <Globe className="mr-2 h-3.5 w-3.5" />
            {publishing ? "Publishing…" : "Publish to gallery"}
          </Button>
        )}
        {publishError && (
          <p className="text-xs text-destructive">{publishError}</p>
        )}
      </CardContent>
    </Card>
  );
}
