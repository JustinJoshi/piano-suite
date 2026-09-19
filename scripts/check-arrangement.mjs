#!/usr/bin/env node
/**
 * check:arrangement — run the Workshop's page-wiring validator from the CLI.
 *
 * `lib/feature-blocks/validate-arrangement.ts` was written React-free and
 * DOM-free precisely so a non-browser caller could use it; this is that
 * caller. An agent (or a human) can now check whether a page's blocks are
 * wired coherently without booting Next.js, opening the Workshop, or burning
 * tokens describing the page to a model.
 *
 *   node scripts/check-arrangement.mjs <page.json>
 *   npm run check:arrangement -- <page.json>
 *
 * Input is either a bare array of blocks, or an object with a `blocks` array
 * (the shape a stored practice page uses). Exit 0 when the arrangement is
 * valid, 1 when it is not, 2 for a usage or input error.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const EXIT_INVALID = 1;
const EXIT_USAGE = 2;

/**
 * Bundle the validator's (pure, relative-import-only) module graph and import
 * it from memory. esbuild is already a dependency via vite/vitest, so this
 * needs no new tooling and no temp files on disk.
 */
async function loadValidator() {
  const result = await esbuild.build({
    entryPoints: [resolve(REPO_ROOT, "scripts/arrangement-entry.ts")],
    bundle: true,
    platform: "node",
    format: "esm",
    write: false,
    logLevel: "silent",
    tsconfig: resolve(REPO_ROOT, "tsconfig.json"),
  });
  const code = result.outputFiles[0].text;
  return import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
}

function fail(message) {
  console.error(`check:arrangement: ${message}`);
  process.exit(EXIT_USAGE);
}

function readBlocks(file) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`could not read ${file} — ${error.message}`);
  }

  const blocks = Array.isArray(parsed) ? parsed : parsed?.blocks;
  if (!Array.isArray(blocks)) {
    fail(
      `${file} must be an array of blocks, or an object with a "blocks" array`,
    );
  }

  blocks.forEach((block, index) => {
    if (typeof block?.type !== "string") {
      fail(`block at index ${index} has no "type"`);
    }
  });

  return blocks;
}

async function main() {
  const [file] = process.argv.slice(2);
  if (!file || file === "--help" || file === "-h") {
    console.log(
      "Usage: node scripts/check-arrangement.mjs <page.json>\n" +
        "       npm run check:arrangement -- <page.json>",
    );
    process.exit(file ? 0 : EXIT_USAGE);
  }

  const blocks = readBlocks(resolve(process.cwd(), file));
  const { validateArrangement, resolveChain, getManifest } =
    await loadValidator();

  const result = validateArrangement(blocks);
  const chain = resolveChain(blocks);
  const label = (type) => getManifest(type)?.label ?? type;

  const describe = (group, entries) =>
    entries.length === 0
      ? null
      : `${group}: ${entries.map((e) => label(e.type)).join(", ")}`;

  const summary = [
    describe("sources", chain.sources),
    describe("transforms", chain.transforms),
    describe("displays", chain.displays),
  ].filter(Boolean);

  if (result.status === "valid") {
    console.log(`valid — ${blocks.length} block(s)`);
    for (const line of summary) console.log(`  ${line}`);
    return;
  }

  console.error(`invalid — ${result.issues.length} wiring issue(s)`);
  for (const issue of result.issues) {
    console.error(`  ${label(issue.type)} (${issue.blockId}): ${issue.detail}`);
  }
  for (const line of summary) console.error(`  ${line}`);
  process.exit(EXIT_INVALID);
}

main().catch((error) => {
  console.error(`check:arrangement: ${error.stack ?? error}`);
  process.exit(EXIT_USAGE);
});
