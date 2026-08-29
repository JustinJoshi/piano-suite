"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLearningRoute,
  getRouteProgressSnapshot,
  getServerRouteProgressSnapshot,
  isStepDone,
  markStep,
  nextStepId,
  saveRouteProgress,
  subscribeRouteProgress,
  type RouteStep,
} from "@/lib/routes";
import {
  buildAnkiSetupPrompt,
  type AnkiDeckFile,
} from "@/lib/anki-setup-prompt";
import { buildTemplatePage, starterTemplates } from "@/lib/starter-templates";
import {
  getActivePage,
  getPracticePageStore,
  isStarterPage,
  setPracticePageStore,
  upsertPracticePage,
} from "@/lib/custom-practice-storage";

type RouteGuideProps = {
  routeId: string;
  /** Deck files for the Anki setup prompt; empty when unused. */
  decks: AnkiDeckFile[];
};

export function RouteGuide({ routeId, decks }: RouteGuideProps) {
  const router = useRouter();
  const progress = useSyncExternalStore(
    subscribeRouteProgress,
    getRouteProgressSnapshot,
    getServerRouteProgressSnapshot
  );
  const [promptCopied, setPromptCopied] = useState(false);

  const route = getLearningRoute(routeId);
  const doneCount = useMemo(
    () =>
      route
        ? route.steps.filter((s) => isStepDone(progress, route.id, s.id)).length
        : 0,
    [progress, route]
  );
  const nextId = useMemo(
    () => (route ? nextStepId(route, progress) : null),
    [progress, route]
  );

  if (!route) return null;

  function toggleStep(step: RouteStep) {
    saveRouteProgress(
      markStep(progress, route.id, step.id, !isStepDone(progress, route.id, step.id))
    );
  }

  async function copySetupPrompt() {
    try {
      await navigator.clipboard.writeText(buildAnkiSetupPrompt(decks));
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; the manual steps above still work.
    }
  }

  function seedWorkshop(templateId: string) {
    const template = starterTemplates.find((t) => t.id === templateId);
    if (!template) return;

    // Same semantics as the template picker: a page that holds only
    // starter tiles is replaced in place, otherwise we add a new page.
    const store = getPracticePageStore();
    const active = getActivePage(store);
    const page = buildTemplatePage(template);
    const pageToStore = isStarterPage(active)
      ? { ...page, id: active.id }
      : page;
    setPracticePageStore(upsertPracticePage(store, pageToStore));

    saveRouteProgress(markStep(progress, route.id, "seed-workshop", true));
    router.push("/tools/workshop");
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6 flex items-start gap-4">
        <route.icon className="mt-1 h-8 w-8 shrink-0 text-primary" />
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {route.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{route.description}</p>
          <p
            data-testid="route-progress"
            className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            {doneCount} of {route.steps.length} steps done
          </p>
        </div>
      </header>

      <ol className="space-y-3">
        {route.steps.map((step) => {
          const done = isStepDone(progress, route.id, step.id);
          const isNext = nextId === step.id;
          return (
            <li
              key={step.id}
              data-testid="route-step"
              data-step-id={step.id}
              data-done={done ? "true" : undefined}
              className={cn(
                "rounded-xl border bg-card p-4 transition-colors sm:p-5",
                done
                  ? "border-success/40 bg-success/5"
                  : isNext
                    ? "border-primary/50"
                    : "border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-pressed={done}
                  aria-label={`Mark "${step.title}" ${done ? "not done" : "done"}`}
                  onClick={() => toggleStep(step)}
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <h2
                    className={cn(
                      "text-sm font-semibold text-foreground sm:text-base",
                      done && "text-muted-foreground line-through"
                    )}
                  >
                    {step.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>

                  <div className="mt-3">
                    <StepAction
                      route={route}
                      step={step}
                      promptCopied={promptCopied}
                      onCopyPrompt={copySetupPrompt}
                      onSeed={seedWorkshop}
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

type StepActionProps = {
  route: LearningRoute;
  step: RouteStep;
  promptCopied: boolean;
  onCopyPrompt: () => void;
  onSeed: (templateId: string) => void;
};

function StepAction({
  route,
  step,
  promptCopied,
  onCopyPrompt,
  onSeed,
}: StepActionProps) {
  switch (step.kind) {
    case "read":
      return null;
    case "external":
      return (
        <a
          href={step.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <ExternalLink className="h-4 w-4" />
          {step.cta}
        </a>
      );
    case "tool":
      return (
        <Link
          href={step.href}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          {step.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      );
    case "anki-setup":
      return (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://apps.ankiweb.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            <Download className="h-4 w-4" />
            Download Anki
          </a>
          <Link
            href="/articles/anki-ankiconnect-setup"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Full setup guide
          </Link>
          {/* Deliberately quiet: for people who would rather have their
              computer assistant do the whole setup. */}
          <button
            type="button"
            data-testid="copy-anki-prompt"
            aria-label="Copy AI setup prompt"
            title="Copy a prompt your computer assistant can follow to set all of this up"
            onClick={onCopyPrompt}
            className={cn(
              "ml-auto inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              promptCopied && "text-success"
            )}
          >
            {promptCopied ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Bot className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      );
    case "seed-workshop":
      return (
        <button
          type="button"
          data-testid="seed-workshop"
          onClick={() => onSeed(step.templateId)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          <LayoutTemplate className="h-4 w-4" />
          Set up my workshop page
        </button>
      );
  }
}
