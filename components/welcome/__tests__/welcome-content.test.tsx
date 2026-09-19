import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WelcomeContent } from "@/components/welcome/welcome-content";
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({ isSignedIn: false }),
  useAuth: () => ({ isLoaded: true, has: () => false }),
}));

vi.mock("convex/react", () => ({
  useQuery: () => undefined,
  useMutation: () => vi.fn(async () => undefined),
}));

import { WelcomeConfigProvider } from "@/components/welcome/welcome-config-provider";

function renderContent() {
  return render(
    <WelcomeConfigProvider>
      <WelcomeContent />
    </WelcomeConfigProvider>
  );
}

describe("WelcomeContent", () => {
  it("does not link to any visual lab (labs do not belong on the landing page)", () => {
    renderContent();
    const hrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "");
    const banned = [
      "/tools/julia",
      "/tools/lissajous",
      "/tools/quasiperiodic",
      "/tools/multigrid",
    ];
    for (const href of hrefs) {
      for (const prefix of banned) {
        expect(href.startsWith(prefix)).toBe(false);
      }
    }
  });
});
