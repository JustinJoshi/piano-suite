"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { useToolUserReady } from "@/hooks/useToolUserReady";
import {
  defaultPatternName,
  type LabPatternTool,
} from "@/lib/lab-patterns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookmarkPlus, Trash2 } from "lucide-react";

type SavedPatternsPanelProps = {
  tool: LabPatternTool;
  /** Capture the current lab controls as a JSON-serializable snapshot. */
  getParams: () => unknown;
  /** Apply a saved snapshot back into the lab controls. */
  onLoad: (params: unknown) => void;
};

export function SavedPatternsPanel({
  tool,
  getParams,
  onLoad,
}: SavedPatternsPanelProps) {
  const { canPersist } = useAuthAccess();
  const { userReady } = useToolUserReady();
  const patterns = useQuery(
    api.savedPatterns.listSavedPatterns,
    canPersist && userReady ? { tool } : "skip"
  );
  const savePattern = useMutation(api.savedPatterns.savePattern);
  const deletePattern = useMutation(api.savedPatterns.deletePattern);

  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<Id<"savedPatterns"> | null>(
    null
  );

  async function handleSave() {
    if (!canPersist || !userReady) return;
    setSaving(true);
    setStatus(null);
    try {
      const resolvedName = name.trim() || defaultPatternName();
      await savePattern({
        tool,
        name: resolvedName,
        params: getParams(),
      });
      setName("");
      setStatus(`Saved “${resolvedName}”.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Failed to save pattern.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(patternId: Id<"savedPatterns">, label: string) {
    if (!canPersist) return;
    if (!window.confirm(`Delete saved pattern “${label}”?`)) return;
    setDeletingId(patternId);
    setStatus(null);
    try {
      await deletePattern({ patternId });
      setStatus(`Deleted “${label}”.`);
    } catch (err) {
      setStatus(
        err instanceof Error ? err.message : "Failed to delete pattern."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="border-border bg-card" data-testid="saved-patterns-panel">
      <CardHeader className="pb-4">
        <CardTitle className="font-heading text-base font-semibold text-foreground">
          Saved patterns
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Store the current controls and reload them later.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canPersist ? (
          <p className="text-sm text-muted-foreground">
            Sign in to save and sync patterns across devices.{" "}
            <SignInButton mode="modal">
              <button
                type="button"
                className="text-primary underline-offset-2 hover:underline"
              >
                Sign in
              </button>
            </SignInButton>
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pattern name (optional)"
              aria-label="Pattern name"
              maxLength={80}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring sm:flex-1"
            />
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={saving || !userReady}
              data-testid="save-pattern"
            >
              <BookmarkPlus className="mr-1 h-3.5 w-3.5" />
              {saving ? "Saving…" : "Save pattern"}
            </Button>
          </div>
        )}

        {status ? (
          <p className="text-xs text-muted-foreground" role="status">
            {status}
          </p>
        ) : null}

        {canPersist && patterns === undefined ? (
          <p className="text-sm text-muted-foreground">Loading saved patterns…</p>
        ) : null}

        {canPersist && patterns && patterns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No saved patterns yet. Dial in a look you like, then save it.
          </p>
        ) : null}

        {canPersist && patterns && patterns.length > 0 ? (
          <ul
            className="divide-y divide-border rounded-lg border border-border"
            data-testid="saved-patterns-list"
          >
            {patterns.map((pattern) => (
              <li
                key={pattern._id}
                className="flex items-center gap-2 px-3 py-2"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-sm font-medium text-foreground hover:text-primary"
                  onClick={() => {
                    onLoad(pattern.params);
                    setStatus(`Loaded “${pattern.name}”.`);
                  }}
                  data-testid={`load-pattern-${pattern._id}`}
                >
                  {pattern.name}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  aria-label={`Delete ${pattern.name}`}
                  disabled={deletingId === pattern._id}
                  onClick={() => void handleDelete(pattern._id, pattern.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
