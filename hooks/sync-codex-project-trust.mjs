#!/usr/bin/env node
// sync-codex-project-trust.mjs — one-way sync (disk scan -> ~/.codex/config.toml) of
// `[projects."<path>"]` trust blocks for every top-level git repo under a projects
// directory (e.g. ~/Projects). This is not part of the managed, checked-in
// codex-config.toml fragment: personal project paths never belong in a public repo, and
// this script never reads or writes anything under git. It only ever touches
// `[projects."..."]` blocks whose path is under the given projects directory — every
// other block and all top-level scalar lines in the target file are left byte-for-byte
// identical, in the same order.
//
// Usage: node sync-codex-project-trust.mjs <projects-dir> <target-config.toml>
//
// Same targeted line/block merge approach as sync-codex-config.mjs — not a general TOML
// parser. The target file has a predictable flat shape:
//   - top-level scalar lines "key = value" before the first "[" header (untouched here)
//   - named blocks "[header]" running through all lines up to the next top-level "["
//     header or EOF

import { readFile, writeFile, rename, chmod, stat, unlink, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const [, , projectsDirArg, targetPath] = process.argv;

if (!projectsDirArg || !targetPath || !existsSync(projectsDirArg) || !existsSync(targetPath)) {
  process.exit(0);
}

// Strip a trailing slash so prefix-matching against block paths is unambiguous.
const projectsDir = projectsDirArg.replace(/\/+$/, "");

function splitLines(text) {
  const hadTrailingNewline = text.endsWith("\n");
  const body = hadTrailingNewline ? text.slice(0, -1) : text;
  const lines = body.length === 0 ? [] : body.split("\n");
  return { lines, hadTrailingNewline };
}

// A block starts at any line beginning with "[" at column 0 and runs until the next such
// line (or EOF). Everything before the first block is preamble (untouched here).
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

function projectHeader(projectPath) {
  return `[projects."${projectPath}"]`;
}

function extractProjectPath(header) {
  const m = header.match(/^\[projects\."(.+)"\]$/);
  return m ? m[1] : null;
}

function isGitRepoDir(dirPath) {
  return existsSync(path.join(dirPath, ".git"));
}

async function findManagedRepoPaths() {
  const entries = await readdir(projectsDir, { withFileTypes: true });
  const repoPaths = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const abs = path.join(projectsDir, entry.name);
    if (isGitRepoDir(abs)) repoPaths.push(abs);
  }
  repoPaths.sort();
  return repoPaths;
}

async function main() {
  const [managedRepoPaths, targetText] = await Promise.all([
    findManagedRepoPaths(),
    readFile(targetPath, "utf8"),
  ]);

  const targetSplit = splitLines(targetText);
  const targetParsed = parseToml(targetSplit.lines);

  const managedRepoSet = new Set(managedRepoPaths);
  const prefix = `${projectsDir}/`;

  let added = 0;
  let removed = 0;
  let updated = 0;

  // Pass 1: reconcile existing [projects."<path-under-projects-dir>"] blocks in place.
  const keptBlocks = [];
  const seenPaths = new Set();
  for (const block of targetParsed.blocks) {
    const projectPath = extractProjectPath(block.header);
    if (projectPath === null || !projectPath.startsWith(prefix)) {
      keptBlocks.push(block); // not one of ours — leave untouched
      continue;
    }
    seenPaths.add(projectPath);
    if (!managedRepoSet.has(projectPath)) {
      removed++; // path no longer exists / no longer a git repo — drop the block
      continue;
    }
    const desiredLines = [block.header, 'trust_level = "trusted"'];
    if (block.lines.length !== desiredLines.length || block.lines[1] !== desiredLines[1]) {
      keptBlocks.push({ header: block.header, lines: desiredLines });
      updated++;
    } else {
      keptBlocks.push(block);
    }
  }

  // Pass 2: append blocks for managed repos that had no existing block.
  for (const projectPath of managedRepoPaths) {
    if (seenPaths.has(projectPath)) continue;
    keptBlocks.push({
      header: projectHeader(projectPath),
      lines: [projectHeader(projectPath), 'trust_level = "trusted"'],
    });
    added++;
  }

  const totalChanges = added + removed + updated;
  if (totalChanges === 0) {
    return;
  }

  const outputLines = [...targetParsed.preamble, ...keptBlocks.flatMap((block) => block.lines)];
  const outputText = outputLines.join("\n") + (targetSplit.hadTrailingNewline ? "\n" : "");

  if (outputText === targetText) {
    return; // no actual byte difference — stay idempotent and silent
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

  console.log(`Synced project trust: ${added} added, ${removed} removed, ${updated} updated into ${targetPath}.`);
}

main().catch((err) => {
  console.error(`codex project-trust sync failed: ${err.message}`);
  process.exit(1);
});
