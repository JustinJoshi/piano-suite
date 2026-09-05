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
import { isAtBlockLimit } from "@/lib/feature-blocks/registry";
import { buildTemplatePage, type StarterTemplate } from "@/lib/starter-templates";
import { ShareMenu } from "@/components/custom-practice/share-menu";
import { PagesMenu } from "@/components/custom-practice/pages-menu";
import { WorkshopSyncBadge } from "@/components/custom-practice/workshop-sync-badge";
import { StarterPicker } from "@/components/custom-practice/starter-picker";
import { WorkshopGrid } from "@/components/workshop-grid/workshop-grid";
import { useWorkshopSync } from "@/hooks/useWorkshopSync";
import { useAuthAccess } from "@/hooks/useAuthAccess";
import { DrillRuntimeProvider } from "@/components/custom-practice/drill-runtime-provider";
import { CommandPalette } from "@/components/custom-practice/command-palette";
import { isEditableTarget } from "@/lib/keyboard";
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

const BLOCKS_HREF = "/tools/workshop/blocks";
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
  const { isSignedIn } = useAuthAccess();
  const router = useRouter();

  const store = useSyncExternalStore(
    subscribePracticePageStore,
    getPracticePageStore,
    getServerPracticePageStore
  );

  const page = useMemo(() => getActivePage(store), [store]);

  const [shareOpen, setShareOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
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

  function selectStarterTemplate(template: StarterTemplate) {
    const templatePage = buildTemplatePage(template);
    const pageToStore =
      isStarterPage(page) && store.pages.length === 1
        ? { ...templatePage, id: page.id }
        : templatePage;
    setPracticePageStore(upsertPracticePage(store, pageToStore));
    setShowTemplateLibrary(false);
  }

  function duplicateBlock(id: string) {
    const block = page.blocks.find((b) => b.id === id);
    if (!block) return;
    // Some blocks only make sense once per page — a second chord set or scale
    // run would sit inert behind the first (see `target-blocks.ts`).
    if (isAtBlockLimit(page.blocks, block.type)) return;

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

  // Window-level shortcuts share one guard: unmodified letters are piano
  // notes, so only Ctrl/Cmd+K, `?`, and `/` are safe. Escape while a dialog
  // is open is handled on the dialog element itself (see command-palette),
  // never here — pages-menu and dashboard-nav own their window Escape.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.ctrlKey || event.metaKey)) {
        if (isEditableTarget(event.target)) return;
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }

      if (event.key !== "/") return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      router.push(BLOCKS_HREF);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);



  return (
    <DrillRuntimeProvider pageId={page.id} blocks={page.blocks}>
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

          {/* Signed-out only: say what signing in adds, never block. The
              sync badge renders nothing for status "local", so this hint
              takes its slot. */}
          {!isSignedIn ? (
            <p
              data-testid="workshop-signin-hint"
              className="text-xs text-muted-foreground"
            >
              Your pages are saved in this browser.{" "}
              <Link
                href="/sign-in"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>{" "}
              to sync them across devices.
            </p>
          ) : null}

          <WorkshopSyncBadge status={syncStatus} />

          <Link
            href={BLOCKS_HREF}
            aria-label="Open the block library"
            className={cn(buttonVariants({ size: "sm" }), "gap-2")}
          >
            Add blocks
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          store={store}
          page={page}
          updatePage={updatePage}
          onSwitchPage={switchPage}
          onOpenBlockLibrary={() => router.push(BLOCKS_HREF)}
        />

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
                  href={BLOCKS_HREF}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  block library
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
