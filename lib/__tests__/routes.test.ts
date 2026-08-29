import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  learningRoutes,
  getLearningRoute,
  isStepDone,
  markStep,
  nextStepId,
  isRouteComplete,
  loadRouteProgress,
  saveRouteProgress,
  ROUTE_PROGRESS_KEY,
} from "@/lib/routes";
import { starterTemplates } from "@/lib/starter-templates";

describe("learningRoutes registry", () => {
  it("ships the music-theory and finger-flexibility routes", () => {
    const ids = learningRoutes.map((r) => r.id);
    expect(ids).toContain("music-theory");
    expect(ids).toContain("finger-flexibility");
  });

  it("gives every step a unique id within its route", () => {
    for (const route of learningRoutes) {
      const ids = route.steps.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(route.steps.length).toBeGreaterThan(2);
    }
  });

  it("points tool steps at real tool hrefs", () => {
    const knownHrefs = new Set([
      "/tools/chord-drill",
      "/tools/arpeggios",
      "/tools/progression",
      "/tools/root-cycling",
      "/tools/technique",
    ]);
    for (const route of learningRoutes) {
      for (const step of route.steps) {
        if (step.kind === "tool") {
          expect(knownHrefs.has(step.href)).toBe(true);
        }
      }
    }
  });

  it("references starter templates that exist for seed steps", () => {
    const templateIds = new Set(starterTemplates.map((t) => t.id));
    for (const route of learningRoutes) {
      for (const step of route.steps) {
        if (step.kind === "seed-workshop") {
          expect(templateIds.has(step.templateId)).toBe(true);
        }
      }
    }
  });

  it("looks routes up by id and returns null for unknown ids", () => {
    expect(getLearningRoute("music-theory")?.title).toBeTruthy();
    expect(getLearningRoute("nope")).toBeNull();
  });
});

describe("route progress helpers", () => {
  const route = getLearningRoute("music-theory");
  if (!route) throw new Error("music-theory route missing");

  it("marks a step done without mutating the input", () => {
    const progress = {};
    const next = markStep(progress, route.id, route.steps[0].id, true);

    expect(next).not.toBe(progress);
    expect(isStepDone(next, route.id, route.steps[0].id)).toBe(true);
    expect(isStepDone(progress, route.id, route.steps[0].id)).toBe(false);
  });

  it("can un-mark a step", () => {
    let progress = markStep({}, route.id, route.steps[0].id, true);
    progress = markStep(progress, route.id, route.steps[0].id, false);
    expect(isStepDone(progress, route.id, route.steps[0].id)).toBe(false);
  });

  it("finds the first undone step and null when complete", () => {
    expect(nextStepId(route, {})).toBe(route.steps[0].id);

    let progress = {};
    for (const step of route.steps.slice(0, 2)) {
      progress = markStep(progress, route.id, step.id, true);
    }
    expect(nextStepId(route, progress)).toBe(route.steps[2].id);

    for (const step of route.steps) {
      progress = markStep(progress, route.id, step.id, true);
    }
    expect(nextStepId(route, progress)).toBeNull();
    expect(isRouteComplete(route, progress)).toBe(true);
  });

  it("persists progress to localStorage", () => {
    saveRouteProgress(markStep({}, route.id, route.steps[0].id, true));

    const loaded = loadRouteProgress();
    expect(isStepDone(loaded, route.id, route.steps[0].id)).toBe(true);
    expect(window.localStorage.getItem(ROUTE_PROGRESS_KEY)).toContain(
      route.steps[0].id
    );
  });

  it("returns empty progress for corrupt storage", () => {
    window.localStorage.setItem(ROUTE_PROGRESS_KEY, "{not json");
    expect(loadRouteProgress()).toEqual({});
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });
});
