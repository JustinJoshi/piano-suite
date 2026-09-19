#!/usr/bin/env node
/**
 * make:block — scaffold a Workshop feature block and register it everywhere.
 *
 * The block library is the project's stated bottleneck, and the cost of a new
 * block is not the idea: it is remembering the five registration sites and the
 * generated docs table. This script does the ritual deterministically so an
 * agent (or a human) spends its attention on the block's behaviour instead.
 *
 *   node scripts/make-block.mjs <blockType> [options]
 *   npm run make:block -- <blockType> [options]
 *
 * Creates:
 *   lib/feature-blocks/<kebab>/config.ts
 *   lib/feature-blocks/<kebab>/manifest.ts
 *   components/feature-blocks/<kebab>-block.tsx
 *   docs/components/<kebab>.md
 *
 * Registers in:
 *   lib/feature-blocks/registry.ts      (the client registry)
 *   lib/feature-blocks/schemas.ts       (blockNormalizers — Convex-bundled)
 *   lib/feature-blocks/versions.ts      (blockConfigVersions)
 *   lib/workshop-grid.ts                (TYPE_DEFAULT_SIZES)
 *   lib/feature-blocks/manifest.ts      (ALL_MANIFESTS)
 *   lib/feature-blocks/target-blocks.ts (--targets only)
 *
 * Then regenerates the component table in docs/components/README.md.
 *
 * Every edit is anchored on existing syntax and every anchor is checked before
 * anything is written: a missing anchor aborts the whole run rather than
 * leaving a block half-registered across five files.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const CATEGORIES = ["rhythm", "technique", "theory", "progress", "visualization"];
const KINDS = ["interactive", "source", "transform"];
/** FeatureRenderer spreads config onto the component, so React eats these. */
const RESERVED_FIELD_NAMES = ["key", "ref", "children"];

const USAGE = `Usage: npm run make:block -- <blockType> [options]

  <blockType>              camelCase, e.g. intervalTrainer

Options:
  --label "..."            Human label            (default: derived from type)
  --description "..."      Registry description   (default: a TODO line)
  --summary "..."          Marketplace summary    (default: the description)
  --justification "..."    Why this block exists  (default: a TODO line)
  --category <name>        ${CATEGORIES.join(" | ")}   (default: technique)
  --kind <name>            ${KINDS.join(" | ")}        (default: interactive)
  --icon <LucideName>      lucide-react icon      (default: Blocks)
  --size <WxH>             default grid size      (default: 2x1)
  --targets                wire as a target block (provides targets, maxPerPage 1)
  --dry-run                print the plan, write nothing
`;

function die(message) {
  console.error(`make:block: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const opts = {
    category: "technique",
    kind: "interactive",
    icon: "Blocks",
    size: "2x1",
    targets: false,
    dryRun: false,
  };
  const positional = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--targets") opts.targets = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(USAGE);
      process.exit(0);
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) {
        die(`${arg} needs a value`);
      }
      opts[key] = value;
      i += 1;
    } else positional.push(arg);
  }

  if (positional.length !== 1) die(`expected exactly one block type\n\n${USAGE}`);
  opts.type = positional[0];
  return opts;
}

const toKebab = (camel) =>
  camel.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const toPascal = (camel) => camel[0].toUpperCase() + camel.slice(1);
const toTitle = (camel) => {
  const words = toKebab(camel).split("-");
  return words[0][0].toUpperCase() + words[0].slice(1) + " " + words.slice(1).join(" ");
};

/**
 * Insert a line just before the `};` that closes a top-level object literal.
 * Nested members close with an indented `},` so the first unindented `};`
 * after the opener is always the right one.
 */
function insertBeforeObjectClose(src, opener, line, file) {
  const start = src.indexOf(opener);
  if (start === -1) die(`could not find "${opener}" in ${file}`);
  const close = src.indexOf("\n};", start);
  if (close === -1) die(`could not find the close of "${opener}" in ${file}`);
  return src.slice(0, close + 1) + line + src.slice(close + 1);
}

/** Append an import after the file's last import statement. */
function insertAfterLastImport(src, statement, file) {
  const lines = src.split("\n");
  let last = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^import\s/.test(lines[i]) || /^\}\s+from\s+".*";$/.test(lines[i])) last = i;
  }
  if (last === -1) die(`could not find an import statement in ${file}`);
  lines.splice(last + 1, 0, statement);
  return lines.join("\n");
}

/** Add a named icon to the existing multi-line lucide-react import. */
function addLucideIcon(src, icon, file) {
  const close = src.indexOf('} from "lucide-react";');
  if (close === -1) die(`could not find the lucide-react import in ${file}`);
  const block = src.slice(0, close);
  if (new RegExp(`\\b${icon},`).test(block.slice(block.lastIndexOf("import {")))) {
    return src; // already imported
  }
  return src.slice(0, close) + `  ${icon},\n` + src.slice(close);
}

/** node_modules lives in the main checkout, not in a worktree — walk up. */
function resolveBin(name) {
  let dir = REPO_ROOT;
  for (let i = 0; i < 6; i += 1) {
    const candidate = join(dir, "node_modules", ".bin", name);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { type } = opts;

  if (!/^[a-z][a-zA-Z0-9]*$/.test(type)) {
    die(`"${type}" must be camelCase, starting with a lowercase letter`);
  }
  if (RESERVED_FIELD_NAMES.includes(type)) {
    die(`"${type}" is a reserved React prop name`);
  }
  if (!CATEGORIES.includes(opts.category)) {
    die(`--category must be one of: ${CATEGORIES.join(", ")}`);
  }
  if (!KINDS.includes(opts.kind)) {
    die(`--kind must be one of: ${KINDS.join(", ")}`);
  }
  const sizeMatch = /^(\d)x(\d)$/.exec(opts.size);
  if (!sizeMatch) die(`--size must look like 2x1`);
  const [, w, h] = sizeMatch;

  const kebab = toKebab(type);
  const Pascal = toPascal(type);
  const label = opts.label ?? toTitle(type);
  const description =
    opts.description ?? `TODO: one sentence on what ${label} does for a practice page.`;
  const summary = opts.summary ?? description;
  const justification =
    opts.justification ?? `TODO: why ${label} earns a place in the block library.`;

  // --- refuse to touch a type that is already registered -------------------
  const versions = read("lib/feature-blocks/versions.ts");
  if (new RegExp(`^\\s*${type}:`, "m").test(versions)) {
    die(`"${type}" is already registered — pick another name, or edit it by hand`);
  }

  // --- generated files -----------------------------------------------------
  const files = new Map();

  files.set(
    `lib/feature-blocks/${kebab}/config.ts`,
    opts.targets ? targetConfigSource(type, Pascal) : configSource(type, Pascal),
  );
  files.set(
    `lib/feature-blocks/${kebab}/manifest.ts`,
    manifestSource({ type, Pascal, kebab, label, summary, justification, opts, w, h }),
  );
  files.set(
    `components/feature-blocks/${kebab}-block.tsx`,
    opts.targets
      ? targetComponentSource(type, Pascal, kebab, label)
      : componentSource(Pascal, kebab, label),
  );
  files.set(`docs/components/${kebab}.md`, docsSource(label, type, summary, justification));

  for (const rel of files.keys()) {
    if (existsSync(join(REPO_ROOT, rel))) die(`${rel} already exists`);
  }

  // --- edits to existing files --------------------------------------------
  const edits = new Map();

  // 1. registry.ts
  let registry = read("lib/feature-blocks/registry.ts");
  registry = addLucideIcon(registry, opts.icon, "registry.ts");
  registry = insertAfterLastImport(
    registry,
    `import { ${Pascal}Block } from "@/components/feature-blocks/${kebab}-block";\n` +
      `import {\n  ${type}DefaultConfig,\n  normalize${Pascal}Config,\n  ${type}Fields,\n} from "@/lib/feature-blocks/${kebab}/config";`,
    "registry.ts",
  );
  registry = insertBeforeObjectClose(
    registry,
    "export const featureRegistry = {",
    registryEntry({ type, Pascal, label, description, opts }),
    "registry.ts",
  );
  edits.set("lib/feature-blocks/registry.ts", registry);

  // 2. schemas.ts — the Convex-bundled normalizer map
  let schemas = read("lib/feature-blocks/schemas.ts");
  schemas = insertAfterLastImport(
    schemas,
    `import { normalize${Pascal}Config } from "./${kebab}/config";`,
    "schemas.ts",
  );
  schemas = insertBeforeObjectClose(
    schemas,
    "const blockNormalizers: Record<string, BlockNormalizer> = {",
    `  ${type}: normalize${Pascal}Config as BlockNormalizer,\n`,
    "schemas.ts",
  );
  edits.set("lib/feature-blocks/schemas.ts", schemas);

  // 3. versions.ts
  edits.set(
    "lib/feature-blocks/versions.ts",
    insertBeforeObjectClose(
      versions,
      "export const blockConfigVersions: Record<string, number> = {",
      `  ${type}: 1,\n`,
      "versions.ts",
    ),
  );

  // 4. workshop-grid.ts — the default tile span
  edits.set(
    "lib/workshop-grid.ts",
    insertBeforeObjectClose(
      read("lib/workshop-grid.ts"),
      "const TYPE_DEFAULT_SIZES: Record<string, BlockSize> = {",
      `  ${type}: { w: ${w}, h: ${h} },\n`,
      "workshop-grid.ts",
    ),
  );

  // 5. manifest.ts — the library entry
  let manifest = read("lib/feature-blocks/manifest.ts");
  manifest = insertAfterLastImport(
    manifest,
    `import { ${type}Manifest } from "./${kebab}/manifest";`,
    "manifest.ts",
  );
  manifest = insertBeforeObjectClose(
    manifest,
    "const ALL_MANIFESTS: Record<string, ComponentManifest> = {",
    `  ${type}: ${type}Manifest,\n`,
    "manifest.ts",
  );
  edits.set("lib/feature-blocks/manifest.ts", manifest);

  // 6. target-blocks.ts — only for a block that owns the runtime's targets
  if (opts.targets) {
    let targets = read("lib/feature-blocks/target-blocks.ts");
    targets = insertAfterLastImport(
      targets,
      `import { normalize${Pascal}Config } from "./${kebab}/config";`,
      "target-blocks.ts",
    );
    const anchor = "] as const;";
    const listStart = targets.indexOf("export const TARGET_BLOCK_TYPES = [");
    if (listStart === -1) die("could not find TARGET_BLOCK_TYPES in target-blocks.ts");
    const listEnd = targets.indexOf(anchor, listStart);
    targets = targets.slice(0, listEnd) + `  "${type}",\n` + targets.slice(listEnd);
    targets = insertBeforeObjectClose(
      targets,
      "const scoringResolvers: Record<TargetBlockType, (raw: unknown) => ScoringConfig> = {",
      `  ${type}: normalize${Pascal}Config,\n`,
      "target-blocks.ts",
    );
    edits.set("lib/feature-blocks/target-blocks.ts", targets);
  }

  // --- write ---------------------------------------------------------------
  if (opts.dryRun) {
    console.log(`make:block ${type} — dry run, nothing written\n`);
    console.log("would create:");
    for (const rel of files.keys()) console.log(`  + ${rel}`);
    console.log("would edit:");
    for (const rel of edits.keys()) console.log(`  ~ ${rel}`);
    return;
  }

  for (const [rel, contents] of files) {
    mkdirSync(dirname(join(REPO_ROOT, rel)), { recursive: true });
    writeFileSync(join(REPO_ROOT, rel), contents);
  }
  for (const [rel, contents] of edits) {
    writeFileSync(join(REPO_ROOT, rel), contents);
  }

  console.log(`make:block ${type} — created:`);
  for (const rel of files.keys()) console.log(`  + ${rel}`);
  console.log("registered in:");
  for (const rel of edits.keys()) console.log(`  ~ ${rel}`);

  // --- regenerate the docs table the parity test guards --------------------
  const vitest = resolveBin("vitest");
  if (!vitest) {
    console.warn(
      "\nmake:block: could not find the vitest binary — regenerate the docs table with\n" +
        "  UPDATE_COMPONENT_DOCS=1 vitest run lib/feature-blocks/__tests__/registry-parity.test.ts",
    );
  } else {
    execFileSync(
      vitest,
      ["run", "lib/feature-blocks/__tests__/registry-parity.test.ts"],
      { cwd: REPO_ROOT, env: { ...process.env, UPDATE_COMPONENT_DOCS: "1" }, stdio: "inherit" },
    );
    console.log("  ~ docs/components/README.md (generated table)");
  }

  console.log(
    `\nNext: give ${Pascal}Block its behaviour, then run\n` +
      "  npm run typecheck && npm run test:unit:run",
  );
}

// --------------------------------------------------------------------------
// Templates
// --------------------------------------------------------------------------

function configSource(type, Pascal) {
  return `import { toBool, toText } from "../coerce";
import type { FieldDescriptor } from "../types";

export type ${Pascal}Config = {
  title: string;
  compact: boolean;
};

export const ${type}DefaultConfig: ${Pascal}Config = {
  title: "",
  compact: false,
};

export function normalize${Pascal}Config(raw: unknown): ${Pascal}Config {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  return {
    title: toText(r.title, ${type}DefaultConfig.title, 60),
    compact: toBool(r.compact, ${type}DefaultConfig.compact),
  };
}

export const ${type}Fields: FieldDescriptor[] = [
  { kind: "text", key: "title", label: "Title", placeholder: "Optional heading" },
  { kind: "toggle", key: "compact", label: "Compact layout" },
];
`;
}

function targetConfigSource(type, Pascal) {
  return `import { normalizeScoring, scoringFields, toBool, toText } from "../coerce";
import type { ScoringConfig } from "../coerce";
import type { FieldDescriptor } from "../types";

export type ${Pascal}Config = ScoringConfig & {
  title: string;
  compact: boolean;
};

export const ${type}DefaultConfig: ${Pascal}Config = {
  title: "",
  compact: false,
  // Single-note targets default to exact; loosen this for chord targets.
  requireExact: true,
  goodThreshold: 0,
  hardThreshold: 2,
};

export function normalize${Pascal}Config(raw: unknown): ${Pascal}Config {
  const r = (typeof raw === "object" && raw !== null ? raw : {}) as Record<
    string,
    unknown
  >;

  return {
    title: toText(r.title, ${type}DefaultConfig.title, 60),
    compact: toBool(r.compact, ${type}DefaultConfig.compact),
    ...normalizeScoring(r, ${type}DefaultConfig),
  };
}

export const ${type}Fields: FieldDescriptor[] = [
  { kind: "text", key: "title", label: "Title", placeholder: "Optional heading" },
  { kind: "toggle", key: "compact", label: "Compact layout" },
  ...scoringFields,
];
`;
}

function manifestSource({ type, kebab, label, summary, justification, opts, w, h }) {
  // A target block's output is the stream it feeds, not the word "targets" —
  // registry parity asserts manifest.outputs contains "practiceNotes".
  const provides = opts.targets
    ? `  outputs: ["practiceNotes"],\n  maxPerPage: 1,\n`
    : `  outputs: [],\n`;
  return `import type { ComponentManifest } from "../manifest-types";
import { ${type}Fields } from "./config";

export const ${type}Manifest: ComponentManifest = {
  type: "${type}",
  kind: "${opts.kind}",
  label: "${label}",
  summary:
    "${summary.replace(/"/g, '\\"')}",
  justification:
    "${justification.replace(/"/g, '\\"')}",
  category: "${opts.category}",
  accepts: [],
${provides}  requires: [],
  configSpec: ${type}Fields,
  defaultSize: { w: ${w}, h: ${h} },
  minSize: { w: ${w}, h: ${h} },
  docsPath: "docs/components/${kebab}.md",
  // Truthful until this block reads or writes the runtime; registry parity
  // refuses "stable" for a block that does neither.
  status: "experimental",
};
`;
}

function registryEntry({ type, Pascal, label, description, opts }) {
  const provides = opts.targets ? `    provides: "targets",\n    maxPerPage: 1,\n` : "";
  return `  ${type}: {
    type: "${type}",
    category: "${opts.category}",
    configVersion: blockConfigVersions.${type},
    label: "${label}",
    description:
      "${description.replace(/"/g, '\\"')}",
    icon: ${opts.icon},
${provides}    fields: ${type}Fields,
    defaultConfig: ${type}DefaultConfig,
    normalizeConfig: normalize${Pascal}Config,
    component: ${Pascal}Block as ComponentType<Record<string, unknown>>,
  } satisfies FeatureDefinition<Record<string, unknown>>,
`;
}

function componentSource(Pascal, kebab, label) {
  return `"use client";

import { cn } from "@/lib/utils";
import type { ${Pascal}Config } from "@/lib/feature-blocks/${kebab}/config";

/**
 * TODO: describe what this block gives a practice page.
 *
 * Scaffolded by \`npm run make:block\`. Displays read the composed page stream
 * with \`useNoteStream()\`; if this block renders content, use that rather than
 * \`previewNotes\`. Colours come from theme tokens only — no raw hex.
 */
export function ${Pascal}Block({ title, compact }: ${Pascal}Config) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-surface",
        compact ? "p-3" : "p-5",
      )}
    >
      {title ? (
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
      ) : null}
      <p className="text-sm text-muted-foreground">
        ${label} — not implemented yet.
      </p>
    </div>
  );
}
`;
}

function targetComponentSource(type, Pascal, kebab, label) {
  return `"use client";

import { useMemo } from "react";
import { useTargetSource } from "@/hooks/useTargetSource";
import { TargetBlockShell } from "@/components/feature-blocks/target-block-shell";
import type { ChordTarget } from "@/lib/drill-runtime";
import type { ${Pascal}Config } from "@/lib/feature-blocks/${kebab}/config";

/**
 * TODO: describe the run this block asks the player to perform.
 *
 * Scaffolded by \`npm run make:block --targets\`. Put the \`config -> targets\`
 * maths in \`lib/drill-targets.ts\` (pure, unit-tested) and keep this component
 * to rendering. Only the first target block on a page is live; the shell
 * renders the superseded and no-runtime states for you.
 */
export function ${Pascal}Block(config: ${Pascal}Config) {
  // TODO: replace with a builder from lib/drill-targets.ts.
  const targets = useMemo<ChordTarget[]>(() => [], []);
  const state = useTargetSource("${type}", targets);

  return (
    <TargetBlockShell
      label={config.title || "${label}"}
      state={state}
      emptyMessage="No targets configured yet"
    />
  );
}
`;
}

function docsSource(label, type, summary, justification) {
  return `# ${label}

${summary}

## Why it exists

${justification}

## Config

| Field | Meaning |
| --- | --- |
| \`title\` | Optional heading shown above the block |
| \`compact\` | Tighter padding for a small tile |

## Notes

Scaffolded by \`npm run make:block -- ${type}\`. Replace this file's contents as
the block's behaviour settles.
`;
}

main();
