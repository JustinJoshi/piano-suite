import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DrillShortcutsBlock } from "@/components/feature-blocks/drill-shortcuts-block";
import { drillTools } from "@/lib/tools";

describe("DrillShortcutsBlock", () => {
  it("renders a shortcut link for every ready-made drill", () => {
    render(<DrillShortcutsBlock />);

    for (const tool of drillTools) {
      const link = screen.getByRole("link", { name: new RegExp(tool.title, "i") });
      expect(link).toHaveAttribute("href", tool.href);
      expect(link).toHaveAttribute("title", tool.description);
    }
  });
});
