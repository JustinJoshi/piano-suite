import { describe, it, expect } from "vitest";
import { describeRegistryForAgent, listManifests } from "../manifest";

type CatalogueComponent = Record<string, unknown> & { type: string };

function parseCatalogue(): { components: CatalogueComponent[] } {
  return JSON.parse(describeRegistryForAgent());
}

describe("describeRegistryForAgent", () => {
  it("includes every registered component", () => {
    expect(parseCatalogue().components).toHaveLength(listManifests().length);
  });

  it("describes each component with kind, accepts, outputs, requires, and configSpec", () => {
    for (const component of parseCatalogue().components) {
      expect(component).toMatchObject({
        kind: expect.any(String),
        accepts: expect.any(Array),
        outputs: expect.any(Array),
        requires: expect.any(Array),
        configSpec: expect.any(Array),
      });
    }
  });

  it("is static: only known metadata keys, identical across calls", () => {
    // The catalogue must carry no user data or per-caller state, so every
    // component is limited to these serialised manifest fields.
    const staticKeys = [
      "type",
      "kind",
      "label",
      "summary",
      "justification",
      "accepts",
      "outputs",
      "requires",
      "configSpec",
      "status",
    ];
    const first = describeRegistryForAgent();
    expect(describeRegistryForAgent()).toBe(first);
    for (const component of parseCatalogue().components) {
      expect(Object.keys(component).sort()).toEqual([...staticKeys].sort());
    }
  });
});
