"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PracticePage, FeatureBlock } from "@/lib/feature-blocks/types";
import { resizeBlocks } from "@/lib/workshop-grid";
import { buildTemplatePage, starterTemplates, type StarterTemplate } from "@/lib/starter-templates";
import { ShareMenu } from "@/components/custom-practice/share-menu";
import { PagesMenu } from "@/components/custom-practice/pages-menu";
import { WorkshopSyncBadge } from "@/components/custom-practice/workshop-sync-badge";
import { EditorHints } from "@/components/custom-practice/editor-hints";
import { StarterPicker } from "@/components/custom-practice/starter-picker";
import { WorkshopGrid } from "@/components/workshop-grid/workshop-grid";
import { useWorkshopSync } from "@/hooks/useWorkshopSync";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import {
  getPracticePageStore,
  setPracticePageStore,
  subscribePracticePageStore,
  getServerPracticePageStore,
  getActivePage,
  setActivePageId,
  upsertPracticePage,
  deletePracticePage,
  duplicatePracticePage,
  createPracticePageInStore,
  isStarterPage,
  generateId,
} from "@/lib/custom-practice-storage";

const MARKETPLACE_HREF = "/tools/workshop/marketplace";
const STARTER_PICKER_KEY = "piano-suite:starter-picker-dismissed-v1";
const STARTER_PICKER_EVENT = "piano-suite:starter-picker-change";

function readStarterPickerDismissed(): boolean {
  try {
    return window.localStorage.getItem(STARTER_PICKER_KEY) === "true";
  } catch {
    return false;
  }
}

function subscribeToStarterPicker(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STARTER_PICKER_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STARTER_PICKER_EVENT, callback);
  };
}

export function PracticePageEditor() {
  const syncStatus = useWorkshopSync(true);
  const router = useRouter();

  const store = useSyncExternalStore(
    subscribePracticePageStore,
    getPracticePageStore,
    getServerPracticePageStore
  );

  const page = useMemo(() => getActivePage(store), [store]);

  const [shareOpen, setShareOpen] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const starterPickerDismissed = useSyncExternalStore(
    subscribeToStarterPicker,
    readStarterPickerDismissed,
    () => true
  );
  const showStarterPicker =
    store.pages.length === 1 &&
    isStarterPage(page) &&
    !starterPickerDismissed;
  const showTemplates = showStarterPicker || showTemplateLibrary;

  function updatePage(updater: (prev: PracticePage) => PracticePage) {
    setPracticePageStore(upsertPracticePage(store, updater(page)));
  }

  function switchPage(pageId: string) {
    setPracticePageStore(setActivePageId(store, pageId));
  }

  function createPage() {
    setPracticePageStore(createPracticePageInStore(store));
  }

  function duplicatePage() {
    setPracticePageStore(duplicatePracticePage(store, page.id));
  }

  function removePage() {
    if (store.pages.length <= 1) return;
    const confirmed = window.confirm(
      `Delete "${page.title.trim() === "" ? "Untitled" : page.title}"? Its practice history is kept.`
    );
    if (!confirmed) return;
    setPracticePageStore(deletePracticePage(store, page.id));
  }

  function dismissStarterPicker() {
    try {
      window.localStorage.setItem(STARTER_PICKER_KEY, "true");
    } catch {
      // Storage may be disabled; the current session can still dismiss it.
    }
    window.dispatchEvent(new Event(STARTER_PICKER_EVENT));
    setShowTemplateLibrary(false);
  }

  function applyTemplate(template: StarterTemplate) {
    const templatePage = buildTemplatePage(template);
    const current = getPracticePageStore();
    const currentPage = getActivePage(current);
    const pageToStore =
      isStarterPage(currentPage) && current.pages.length === 1
        ? { ...templatePage, id: currentPage.id }
        : templatePage;
    setPracticePageStore(upsertPracticePage(current, pageToStore));
    setShowTemplateLibrary(false);
  }

  function selectStarterTemplate(template: StarterTemplate) {
    applyTemplate(template);
  }

  // Landing starter cards deep-link with ?template=<id> — apply it once on
  // mount (Phase 1.6: the click must land on that template, not a generic
  // page), then clean the URL so a reload does not re-apply it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get("template");
    if (!templateId) return;

    params.delete("template");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${qs ? `?${qs}` : ""}`
    );

    const template = starterTemplates.find((t) => t.id === templateId);
    // Mount-once URL-param handler: the store write is not React state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (template) applyTemplate(template);
  }, []);

  function duplicateBlock(id: string) {
    const block = page.blocks.find((b) => b.id === id);
    if (!block) return;

    const index = page.blocks.indexOf(block);
    const newBlock: FeatureBlock = {
      ...block,
      id: generateId(),
      config: { ...block.config },
    };

    updatePage((prev) => ({
      ...prev,
      blocks: [
        ...prev.blocks.slice(0, index + 1),
        newBlock,
        ...prev.blocks.slice(index + 1),
      ],
    }));
  }

  function removeBlock(id: string) {
    updatePage((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
  }

  function handleReorder(blocks: FeatureBlock[]) {
    updatePage((prev) => ({ ...prev, blocks }));
  }

  function handleResize(id: string, size: { w?: number; h?: number }) {
    updatePage((prev) => ({
      ...prev,
      blocks: resizeBlocks(prev.blocks, id, size),
    }));
  }

  function handleConfigChange(id: string, config: Record<string, unknown>) {
    updatePage((prev) => ({
      ...prev,
      blocks: prev.blocks.map((b) => (b.id === id ? { ...b, config } : b)),
    }));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/") return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        const tagName = target.tagName.toLowerCase();
        const isEditable =
          tagName === "input" ||
          tagName === "textarea" ||
          target.isContentEditable;

        if (isEditable) return;
      }

      event.preventDefault();
      router.push(MARKETPLACE_HREF);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <DrillRuntimeProvider pageId={page.id}>
      <div className="flex min-h-full flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <PagesMenu
            store={store}
            shareOpen={shareOpen}
            onSelect={switchPage}
            onCreate={createPage}
            onDuplicate={duplicatePage}
            onDelete={removePage}
            onToggleShare={() => setShareOpen((open) => !open)}
            onTemplates={() => setShowTemplateLibrary(true)}
          />

          <input
            type="text"
            value={page.title}
            onChange={(e) =>
              updatePage((prev) => ({ ...prev, title: e.target.value }))
            }
            className="min-w-0 flex-1 basis-48 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-lg font-semibold tracking-tight text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-border focus:border-primary/50"
            placeholder="Untitled practice page"
            aria-label="Practice page title"
          />

          <WorkshopSyncBadge status={syncStatus} />

          <Link
            href={MARKETPLACE_HREF}
            aria-label="Open the shelf"
            className={cn(buttonVariants({ size: "sm" }), "gap-2")}
          >
            Shelf
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <EditorHints visible={showStarterPicker} />

        {shareOpen ? (
          <ShareMenu
            clientPageId={page.id}
            title={page.title}
            blocks={page.blocks}
            updatedAt={page.updatedAt}
          />
        ) : null}

        {showTemplates ? (
          <StarterPicker
            onSelect={selectStarterTemplate}
            onDismiss={dismissStarterPicker}
            canClose={!showStarterPicker}
          />
        ) : (
          <>
            <WorkshopGrid
              blocks={page.blocks}
              onReorder={handleReorder}
              onResize={handleResize}
              onDuplicate={duplicateBlock}
              onRemove={removeBlock}
              onConfigChange={handleConfigChange}
              showGuides={page.blocks.length === 0}
              fill
            />

            {page.blocks.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                Your workshop is empty. Browse the{" "}
                <Link
                  href={MARKETPLACE_HREF}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  shelf
                </Link>{" "}
                to add features.
              </p>
            ) : null}
          </>
        )}
      </div>
    </DrillRuntimeProvider>
  );
}
