import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

interface PackageJson {
  name: string;
  version: string;
}

let cachedPackageJson: PackageJson | undefined;

/**
 * Resolves mcp/package.json relative to the currently running module file. This works
 * identically whether the module is executing as `src/version.ts` (via tsx, one directory below
 * mcp/) or as the compiled `dist/version.js` (also one directory below mcp/) — so there is a
 * single source of truth for the package version and no separate literal to keep in sync.
 */
export function readPackageJson(): PackageJson {
  if (cachedPackageJson) {
    return cachedPackageJson;
  }

  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const packageJsonPath = join(moduleDir, "..", "package.json");
  const raw = readFileSync(packageJsonPath, "utf8");
  cachedPackageJson = JSON.parse(raw) as PackageJson;
  return cachedPackageJson;
}

export function getServerVersion(): string {
  return readPackageJson().version;
}

export function getServerName(): string {
  return readPackageJson().name;
}
