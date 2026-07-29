import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import {
  DashboardMenuButton,
  DashboardNavProvider,
  useDashboardNav,
} from "@/components/tools/dashboard-nav";

afterEach(() => {
  cleanup();
});

function OpenStateProbe() {
  const { open } = useDashboardNav();
  return <span data-testid="open-state">{open ? "open" : "closed"}</span>;
}

describe("DashboardNavProvider", () => {
  it("toggles open state from the menu button", () => {
    render(
      <DashboardNavProvider>
        <DashboardMenuButton />
        <OpenStateProbe />
      </DashboardNavProvider>
    );

    expect(screen.getByTestId("open-state")).toHaveTextContent("closed");

    fireEvent.click(screen.getByTestId("dashboard-menu-button"));
    expect(screen.getByTestId("open-state")).toHaveTextContent("open");
    expect(screen.getByTestId("dashboard-menu-button")).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    fireEvent.click(screen.getByTestId("dashboard-menu-button"));
    expect(screen.getByTestId("open-state")).toHaveTextContent("closed");
  });

  it("closes on Escape", () => {
    render(
      <DashboardNavProvider>
        <DashboardMenuButton />
        <OpenStateProbe />
      </DashboardNavProvider>
    );

    fireEvent.click(screen.getByTestId("dashboard-menu-button"));
    expect(screen.getByTestId("open-state")).toHaveTextContent("open");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByTestId("open-state")).toHaveTextContent("closed");
  });
});

describe("DashboardMenuButton", () => {
  it("renders nothing outside the provider", () => {
    const { container } = render(<DashboardMenuButton />);
    expect(container).toBeEmptyDOMElement();
  });
});
