import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouteCards } from "@/components/routes/route-cards";
import {
  getLearningRoute,
  learningRoutes,
  markStep,
  saveRouteProgress,
} from "@/lib/routes";

describe("RouteCards", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // Reset the module-cached snapshot; saving is the only writer.
    saveRouteProgress({});
  });

  it("renders one card per guided route linking to its guide", () => {
    render(<RouteCards />);

    expect(screen.getByTestId("route-cards").children).toHaveLength(
      learningRoutes.length
    );
    for (const route of learningRoutes) {
      expect(
        screen.getByTestId(`picker-route-${route.id}`)
      ).toHaveAttribute("href", `/routes/${route.id}`);
      expect(screen.getByText(route.title)).toBeInTheDocument();
      expect(screen.getByText(route.tagline)).toBeInTheDocument();
    }
  });

  it("invites an untouched route to start", () => {
    render(<RouteCards />);

    const card = screen.getByTestId("picker-route-music-theory");
    expect(card).toHaveTextContent("Start the route");
  });

  it("shows live progress for a route in progress", () => {
    const route = getLearningRoute("music-theory");
    if (!route) throw new Error("music-theory route missing");
    saveRouteProgress(markStep({}, route.id, route.steps[0].id, true));

    render(<RouteCards />);

    const card = screen.getByTestId("picker-route-music-theory");
    expect(card).toHaveTextContent(/1 of \d+ steps done/i);
    expect(card).toHaveTextContent(/continue/i);
    expect(card).not.toHaveTextContent(/completed/i);
  });

  it("celebrates a finished route", () => {
    const route = getLearningRoute("finger-flexibility");
    if (!route) throw new Error("finger-flexibility route missing");
    let progress = {};
    for (const step of route.steps) {
      progress = markStep(progress, route.id, step.id, true);
    }
    saveRouteProgress(progress);

    render(<RouteCards />);

    const card = screen.getByTestId("picker-route-finger-flexibility");
    expect(card).toHaveTextContent(/completed/i);
  });
});
