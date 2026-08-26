#!/usr/bin/env node
// sync-codex-config.mjs — one-way merge of the managed codex-config.toml
// fields/blocks into the real ~/.codex/config.toml. Repo -> Mac only; live
// machine state (projects, marketplaces, notify, tui, etc.) is never read or
// touched — anything not present in the managed fragment stays untouched.
//
// Usage: node sync-codex-config.mjs <managed-fragment.toml> <target-config.toml>
//
// This is a targeted line/block merge, not a general TOML parser — both files
// have a predictable flat shape:
//   - top-level scalar lines "key = value" before the first "[" header
//   - named blocks "[header]" (opaque string key, nesting not interpreted)
//     running through all lines up to the next top-level "[" header or EOF
// Each managed key/block replaces the matching key/block in the target file
// in place if present, or is appended if absent. Everything else in the
// target file is left byte-for-byte identical, in the same order.

import { readFile, writeFile, rename, chmod, stat, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";

const [, , fragmentPath, targetPath] = process.argv;

if (!fragmentPath || !targetPath || !existsSync(fragmentPath) || !existsSync(targetPath)) {
  process.exit(0);
}

function splitLines(text) {
  const hadTrailingNewline = text.endsWith("\n");
  const body = hadTrailingNewline ? text.slice(0, -1) : text;
  const lines = body.length === 0 ? [] : body.split("\n");
  return { lines, hadTrailingNewline };
}

// A block starts at any line beginning with "[" at column 0 and runs until
// the next such line (or EOF). Everything before the first block is preamble.
function parseToml(lines) {
  const preamble = [];
  const blocks = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith("[")) {
      current = { header: line, lines: [line] };
      blocks.push(current);
    } else if (current) {
      current.lines.push(line);
    } else {
      preamble.push(line);
    }
  }
  return { preamble, blocks };
}

function extractKey(line) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*=/);
  return m ? m[1] : null;
}

function mergeScalars(targetPreamble, fragmentPreamble) {
  let changed = 0;
  const keyIndex = new Map();
  targetPreamble.forEach((line, i) => {
    const key = extractKey(line);
    if (key) keyIndex.set(key, i);
  });
  const toAppend = [];
  for (const line of fragmentPreamble) {
    const key = extractKey(line);
    if (!key) continue; // blank lines/comments in the fragment preamble are not managed content
    if (keyIndex.has(key)) {
      const idx = keyIndex.get(key);
      if (targetPreamble[idx] !== line) {
        targetPreamble[idx] = line;
        changed++;
      }
    } else {
      toAppend.push(line);
      changed++;
    }
  }
  targetPreamble.push(...toAppend);
  return changed;
}

function blockEquals(a, b) {
  return a.length === b.length && a.every((line, i) => line === b[i]);
}

function mergeBlocks(targetBlocks, fragmentBlocks) {
  let changed = 0;
  const headerIndex = new Map();
  targetBlocks.forEach((block, i) => headerIndex.set(block.header, i));
  const toAppend = [];
  for (const fragmentBlock of fragmentBlocks) {
    if (headerIndex.has(fragmentBlock.header)) {
      const idx = headerIndex.get(fragmentBlock.header);
      const targetBlock = targetBlocks[idx];
      if (!blockEquals(targetBlock.lines, fragmentBlock.lines)) {
        targetBlocks[idx] = { header: fragmentBlock.header, lines: fragmentBlock.lines.slice() };
        changed++;
      }
    } else {
      toAppend.push({ header: fragmentBlock.header, lines: fragmentBlock.lines.slice() });
      changed++;
    }
  }
  targetBlocks.push(...toAppend);
  return changed;
}

async function main() {
  const [fragmentText, targetText] = await Promise.all([
    readFile(fragmentPath, "utf8"),
    readFile(targetPath, "utf8"),
  ]);

  const fragmentSplit = splitLines(fragmentText);
  const targetSplit = splitLines(targetText);

  const fragmentParsed = parseToml(fragmentSplit.lines);
  const targetParsed = parseToml(targetSplit.lines);

  const scalarChanges = mergeScalars(targetParsed.preamble, fragmentParsed.preamble);
  const blockChanges = mergeBlocks(targetParsed.blocks, fragmentParsed.blocks);
  const totalChanges = scalarChanges + blockChanges;

  if (totalChanges === 0) {
    return;
  }

  const outputLines = [
    ...targetParsed.preamble,
    ...targetParsed.blocks.flatMap((block) => block.lines),
  ];
  const outputText = outputLines.join("\n") + (targetSplit.hadTrailingNewline ? "\n" : "");

  if (outputText === targetText) {
    return; // merge produced no actual byte difference — stay idempotent and silent
  }

  const mode = (await stat(targetPath)).mode & 0o777;
  const tmpPath = `${targetPath}.tmp-${process.pid}`;
  await writeFile(tmpPath, outputText, { mode });
  await chmod(tmpPath, mode);
  try {
    await rename(tmpPath, targetPath);
  } catch (err) {
    await unlink(tmpPath).catch(() => {});
    throw err;
  }

  console.log(`Synced ${totalChanges} codex-config field(s)/table(s) into ${targetPath}.`);
}

main().catch((err) => {
  console.error(`codex-config sync failed: ${err.message}`);
  process.exit(1);
});
