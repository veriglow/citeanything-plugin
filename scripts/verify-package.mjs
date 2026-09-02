#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readText = (path) => readFile(resolve(root, path), "utf8");
const readJson = async (path) => JSON.parse(await readText(path));

const manifest = await readJson("plugin.json");
const manifestMirror = await readJson(".plugin/plugin.json");
const mcp = await readJson("mcp.json");
const mcpMirror = await readJson(".mcp.json");
const contractText = await readText("contracts/tools.json");
const contract = JSON.parse(contractText);
const packageJson = await readJson("package.json");

assert.deepEqual(manifestMirror, {
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  author: manifest.author,
  homepage: manifest.homepage,
  repository: manifest.repository,
  license: manifest.license,
  keywords: manifest.keywords,
  skills: "./skills/",
  mcpServers: "./agents/open-plugin/.mcp.json",
});
assert.equal(
  manifest.$schema,
  "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
);
assert.equal(
  mcp.$schema,
  "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
);
assert.deepEqual(Object.keys(manifest).sort(), [
  "$schema",
  "author",
  "description",
  "homepage",
  "keywords",
  "license",
  "name",
  "repository",
  "version",
]);
assert.deepEqual(Object.keys(mcp).sort(), ["$schema", "mcpServers"]);
assert.deepEqual(mcp.mcpServers, {
  citeanything: {
    type: "streamable-http",
    url: "https://citeanything.app/mcp",
  },
});
assert.equal(packageJson.version, manifest.version);
assert.equal(contract.contractVersion, manifest.version);

const expectedTools = [
  ["create_citations", "citation:write"],
  ["get_citation", "citation:read"],
  ["wait_for_citation_preview", "citation:read"],
  ["list_knowledge_base", "kb:read"],
  ["search_knowledge_base", "kb:read"],
  ["read_knowledge_base_page", "kb:read"],
  ["import_pdf_to_knowledge_base", "kb:write"],
  ["wait_for_knowledge_base_document", "kb:read"],
  ["publish_article", "article:write"],
];
assert.deepEqual(
  contract.tools.map(({ name, scope }) => [name, scope]),
  expectedTools,
);
const forbidden = /(^|_)(search_web|web_search|fetch_url|open|click|find|crawl|browser)($|_)/;
assert.equal(contract.tools.some(({ name }) => forbidden.test(name)), false);
for (const tool of contract.tools) {
  assert.equal(typeof tool.description, "string");
  assert.equal(tool.inputSchema?.type, "object");
  assert.equal(typeof tool.annotations?.readOnlyHint, "boolean");
}

const canonicalSkill = await readText("skills/citeanything/SKILL.md");
assert.equal(await readText("SKILL.md"), canonicalSkill);
assert.match(canonicalSkill, /use the host agent's own web tools/i);
assert.doesNotMatch(canonicalSkill, /CITEANYTHING_API_KEY/);

const expectedHash = `${createHash("sha256").update(contractText).digest("hex")}  tools.json\n`;
assert.equal(await readText("contracts/tools.sha256"), expectedHash);

for (const path of [
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".cursor-plugin/plugin.json",
  ".kimi-plugin/plugin.json",
  "kimi.plugin.json",
]) {
  const adapter = await readJson(path);
  assert.equal(adapter.name, manifest.name, `${path} name drifted`);
  assert.equal(adapter.version, manifest.version, `${path} version drifted`);
  assert.equal(JSON.stringify(adapter), JSON.stringify(adapter).replaceAll("CITEANYTHING_API_KEY", ""));
}

const httpServer = {
  type: "http",
  url: "https://citeanything.app/mcp",
};
assert.deepEqual(mcpMirror, {
  mcpServers: { citeanything: httpServer },
});
assert.deepEqual(await readJson("agents/open-plugin/.mcp.json"), {
  mcpServers: { citeanything: httpServer },
});
assert.deepEqual(await readJson("agents/claude/.mcp.json"), {
  mcpServers: { citeanything: httpServer },
});
assert.deepEqual(await readJson("agents/cursor/mcp.json"), {
  citeanything: httpServer,
});

const codexAdapter = await readJson(".codex-plugin/plugin.json");
const claudeAdapter = await readJson(".claude-plugin/plugin.json");
const cursorAdapter = await readJson(".cursor-plugin/plugin.json");
const kimiAdapter = await readJson(".kimi-plugin/plugin.json");
assert.equal(codexAdapter.mcpServers, "./.mcp.json");
assert.equal(claudeAdapter.mcpServers, "./agents/claude/.mcp.json");
assert.equal(cursorAdapter.mcpServers, "./agents/cursor/mcp.json");
assert.deepEqual(kimiAdapter.mcpServers, { citeanything: httpServer });

console.log(
  `Verified CiteAnything Agent Plugin ${manifest.version}: ${contract.tools.length} tools, contract sha256 ${expectedHash.slice(0, 12)}…`,
);
