import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "../src/server.js";
import { getServerName, getServerVersion } from "../src/version.js";

const mcpDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(join(mcpDir, "package.json"), "utf8")) as {
  name: string;
  version: string;
};

test("getServerVersion reads mcp/package.json", () => {
  assert.equal(getServerVersion(), packageJson.version);
});

test("getServerName reads mcp/package.json", () => {
  assert.equal(getServerName(), packageJson.name);
});

test("the running server's serverInfo.version matches package.json version", async () => {
  const server = createServer({ env: {} });
  // The MCP SDK exposes the constructed serverInfo on the underlying Server instance.
  const serverInfo = (server as unknown as { server: { _serverInfo: { name: string; version: string } } })
    .server._serverInfo;
  assert.equal(serverInfo.version, packageJson.version);
  assert.equal(serverInfo.name, packageJson.name);
});
