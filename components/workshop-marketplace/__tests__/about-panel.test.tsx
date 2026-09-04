import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  AboutPanel,
  ExperimentalBadge,
  requirementLinesFor,
  REQUIREMENT_SENTENCES,
} from "@/components/workshop-marketplace/about-panel";
import { FeatureRenderer } from "@/components/feature-blocks/feature-renderer";
import type { FeatureBlock } from "@/lib/feature-blocks/types";

// The chord library manifest's justification, asserted verbatim.
const CHORD_LIBRARY_JUSTIFICATION =
  "Chord content is reusable across drills — progressions, voicing practice, rhythm drills. Rootless voicings produce different MIDI note sets from identical pitch classes, a dimension the target-block model cannot represent.";

function blockOf(type: string): FeatureBlock {
  return { id: `id-${type}`, type, version: 1, config: {} };
}

function renderPanel(props: Partial<Parameters<typeof AboutPanel>[0]> = {}) {
  return render(
    <AboutPanel
      type="chordLibrary"
      label="Chord library"
      summary="Turns chord symbols or roman numerals into a chord stream."
      justification={CHORD_LIBRARY_JUSTIFICATION}
      requirements={[]}
      experimental={false}
      {...props}
    />
  );
}

describe("requirementLinesFor", () => {
  it("marks midiInput unmet on an empty page", () => {
    expect(requirementLinesFor("midiConnectionBar", [])).toEqual([
      { id: "midiInput", met: false },
    ]);
  });

  it("marks midiInput met once a note input is on the page", () => {
    expect(
      requirementLinesFor("midiConnectionBar", [blockOf("keyboardDisplay")])
    ).toEqual([{ id: "midiInput", met: true }]);
  });

  it("accepts the MIDI connection bar itself as the note input", () => {
    expect(
      requirementLinesFor("midiConnectionBar", [blockOf("midiConnectionBar")])
    ).toEqual([{ id: "midiInput", met: true }]);
  });

  it("marks practiceNotes unmet on an empty page and met with a source", () => {
    expect(requirementLinesFor("noteRoll", [])).toEqual([
      { id: "practiceNotes", met: false },
    ]);
    expect(requirementLinesFor("noteRoll", [blockOf("chordLibrary")])).toEqual([
      { id: "practiceNotes", met: true },
    ]);
  });

  it("returns no lines for blocks without requirements", () => {
    expect(requirementLinesFor("metronome", [])).toEqual([]);
    expect(requirementLinesFor("not-a-block", [])).toEqual([]);
  });
});

describe("AboutPanel", () => {
  it("renders closed by default with correct disclosure semantics", () => {
    renderPanel();

    const trigger = screen.getByTestId("about-trigger-chordLibrary");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls", "about-panel-chordLibrary");
    expect(screen.queryByTestId("about-panel-chordLibrary")).not.toBeInTheDocument();
  });

  it("opens on click, shows summary, justification, and no doc link", () => {
    renderPanel();

    fireEvent.click(screen.getByTestId("about-trigger-chordLibrary"));
    const panel = screen.getByTestId("about-panel-chordLibrary");
    expect(screen.getByTestId("about-trigger-chordLibrary")).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    expect(panel).toHaveAttribute("id", "about-panel-chordLibrary");
    expect(
      within(panel).getByText("Turns chord symbols or roman numerals into a chord stream.")
    ).toBeInTheDocument();
    expect(within(panel).getByText(CHORD_LIBRARY_JUSTIFICATION)).toBeInTheDocument();
    // docsPath is repo-relative and unroutable: the panel renders no link.
    expect(within(panel).queryByRole("link")).not.toBeInTheDocument();
  });

  it("flips aria-expanded back to false when closed again", () => {
    renderPanel();

    const trigger = screen.getByTestId("about-trigger-chordLibrary");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("about-panel-chordLibrary")).not.toBeInTheDocument();
  });

  it("toggles on Enter and Space key downs", () => {
    renderPanel();

    const trigger = screen.getByTestId("about-trigger-chordLibrary");
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("about-panel-chordLibrary")).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: " " });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("about-panel-chordLibrary")).not.toBeInTheDocument();
  });

  it("renders requirements in plain language with satisfied/unsatisfied state", () => {
    renderPanel({
      type: "midiConnectionBar",
      requirements: [{ id: "midiInput", met: false }],
    });
    fireEvent.click(screen.getByTestId("about-trigger-midiConnectionBar"));

    const panel = screen.getByTestId("about-panel-midiConnectionBar");
    expect(within(panel).getByText("Needs a way to play notes")).toBeInTheDocument();
    expect(within(panel).getByLabelText("requirement unsatisfied")).toBeInTheDocument();
    expect(within(panel).getByText("Missing")).toBeInTheDocument();

    renderPanel({
      type: "noteRoll",
      requirements: [{ id: "practiceNotes", met: true }],
    });
    fireEvent.click(screen.getByTestId("about-trigger-noteRoll"));

    const noteRollPanel = screen.getByTestId("about-panel-noteRoll");
    expect(within(noteRollPanel).getByText("Needs a source of notes")).toBeInTheDocument();
    expect(within(noteRollPanel).getByLabelText("requirement satisfied")).toBeInTheDocument();
    expect(within(noteRollPanel).getByText("Satisfied")).toBeInTheDocument();
  });

  it("says what experimental means", () => {
    renderPanel({ experimental: true });

    fireEvent.click(screen.getByTestId("about-trigger-chordLibrary"));
    expect(
      screen.getByText(/works, but its behaviour may still change/)
    ).toBeInTheDocument();
  });

  it("scopes panel ids per type so two open panels never collide", () => {
    render(
      <>
        <AboutPanel
          type="chordLibrary"
          label="Chord library"
          summary="s1"
          justification="j1"
          requirements={[]}
          experimental={false}
        />
        <AboutPanel
          type="scaleLibrary"
          label="Scale library"
          summary="s2"
          justification="j2"
          requirements={[]}
          experimental={false}
        />
      </>
    );

    fireEvent.click(screen.getByTestId("about-trigger-chordLibrary"));
    fireEvent.click(screen.getByTestId("about-trigger-scaleLibrary"));

    const chordPanel = screen.getByTestId("about-panel-chordLibrary");
    const scalePanel = screen.getByTestId("about-panel-scaleLibrary");
    expect(chordPanel).toBeInTheDocument();
    expect(scalePanel).toBeInTheDocument();
    expect(chordPanel.id).not.toBe(scalePanel.id);
  });

  it("mounts the supplementary live preview only while open", () => {
    const preview = (
      <FeatureRenderer
        blocks={[{ id: "preview-chordLibrary", type: "chordLibrary", version: 1, config: {} }]}
      />
    );

    renderPanel({ preview });
    expect(screen.queryByTestId("chord-stream")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("about-trigger-chordLibrary"));
    expect(screen.getByTestId("chord-stream")).toBeInTheDocument();
    expect(screen.getByTestId("about-preview-chordLibrary")).toBeInTheDocument();
  });

  it("renders the experimental marker with a stable testid", () => {
    render(<ExperimentalBadge />);
    expect(screen.getByTestId("experimental-marker")).toHaveTextContent(
      "Experimental"
    );
  });

  it("maps every requirement id to a plain-language sentence", () => {
    expect(REQUIREMENT_SENTENCES.midiInput).toBe("Needs a way to play notes");
    expect(REQUIREMENT_SENTENCES.practiceNotes).toBe("Needs a source of notes");
    expect(REQUIREMENT_SENTENCES.transport).toBe("Needs a transport");
  });
});
