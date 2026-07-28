import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SavedPatternsPanel } from "../saved-patterns-panel";

const savePattern = vi.fn();
const deletePattern = vi.fn();
const listResult = [
  {
    _id: "patterns_1" as const,
    name: "Star lattice",
    params: { mode: [4, 5] },
    createdAt: 1,
    updatedAt: 2,
  },
];

vi.mock("convex/react", () => ({
  useQuery: () => listResult,
  useMutation: (fn: unknown) => {
    if (fn === "save") return savePattern;
    if (fn === "delete") return deletePattern;
    return vi.fn();
  },
}));

vi.mock("@/convex/_generated/api", () => ({
  api: {
    savedPatterns: {
      listSavedPatterns: "list",
      savePattern: "save",
      deletePattern: "delete",
    },
  },
}));

vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/hooks/useAuthAccess", () => ({
  useAuthAccess: () => ({
    canPersist: true,
    canAccess: true,
    isSignedIn: true,
    authDisabled: false,
  }),
}));

vi.mock("@/hooks/useToolUserReady", () => ({
  useToolUserReady: () => ({
    userReady: true,
    canPersist: true,
    canAccess: true,
  }),
}));

describe("SavedPatternsPanel", () => {
  const getParams = vi.fn(() => ({ mode: [5, 7] }));
  const onLoad = vi.fn();

  beforeEach(() => {
    savePattern.mockReset();
    deletePattern.mockReset();
    getParams.mockClear();
    onLoad.mockClear();
    savePattern.mockResolvedValue("patterns_new");
    deletePattern.mockResolvedValue(undefined);
  });

  it("lists saved patterns and loads one on click", () => {
    render(
      <SavedPatternsPanel
        tool="chladni"
        getParams={getParams}
        onLoad={onLoad}
      />
    );

    expect(screen.getByTestId("saved-patterns-panel")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Star lattice" }));
    expect(onLoad).toHaveBeenCalledWith({ mode: [4, 5] });
    expect(screen.getByRole("status")).toHaveTextContent(/Loaded/);
  });

  it("saves the current params with an optional name", async () => {
    render(
      <SavedPatternsPanel
        tool="chladni"
        getParams={getParams}
        onLoad={onLoad}
      />
    );

    fireEvent.change(screen.getByLabelText("Pattern name"), {
      target: { value: "My maze" },
    });
    fireEvent.click(screen.getByTestId("save-pattern"));

    await vi.waitFor(() => {
      expect(savePattern).toHaveBeenCalledWith({
        tool: "chladni",
        name: "My maze",
        params: { mode: [5, 7] },
      });
    });
  });
});
