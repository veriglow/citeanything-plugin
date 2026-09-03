#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readText = (path) => readFile(resolve(root, path), "utf8");
const readJson = async (path) => JSON.parse(await readText(path));
const formatJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

async function write(relativePath, content) {
  const path = resolve(root, relativePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
}

const manifest = await readJson("plugin.json");
const mcp = await readJson("mcp.json");
const skill = await readText("skills/citeanything/SKILL.md");
const contract = await readText("contracts/tools.json");
const metadata = {
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  author: manifest.author,
  homepage: manifest.homepage,
  repository: manifest.repository,
  license: manifest.license,
  keywords: manifest.keywords,
};
const remoteServer = {
  type: "http",
  url: mcp.mcpServers.citeanything.url,
};
const remoteServers = { citeanything: remoteServer };
const logoPath = "assets/citeanything-logo.svg";
const cursorLogoUrl = "https://brand.veri-glow.com/favicon.svg";
const cursorAuthor = {
  name: manifest.author.name,
  email: "feedback@citeanything.app",
};
const interfaceMetadata = {
  displayName: "CiteAnything",
  shortDescription: "Turn inspected evidence into replayable citations",
  longDescription:
    "Use the host agent's own web tools to inspect original sources, then create replayable CiteAnything citations, cite private knowledge-base documents, and publish cited articles.",
  developerName: "VeriGlow",
  category: "Productivity",
  capabilities: ["Interactive", "Write"],
  websiteURL: "https://citeanything.app/plugin",
  privacyPolicyURL: "https://citeanything.app/privacy",
  termsOfServiceURL: "https://citeanything.app/terms",
  defaultPrompt: [
    "Research this question and cite every important factual claim",
    "Create replayable citations for the evidence I inspected",
    "Search my CiteAnything knowledge base and cite exact evidence",
  ],
  brandColor: "#10B981",
  logo: `./${logoPath}`,
};

await write(
  ".plugin/plugin.json",
  formatJson({
    ...metadata,
    skills: "./skills/",
    mcpServers: "./agents/open-plugin/.mcp.json",
  }),
);
await write(".mcp.json", formatJson({ mcpServers: remoteServers }));
await write("SKILL.md", skill);
await write(
  "agents/open-plugin/.mcp.json",
  formatJson({ mcpServers: remoteServers }),
);
await write(
  "agents/claude/.mcp.json",
  formatJson({ mcpServers: remoteServers }),
);
await write(
  "agents/cursor/mcp.json",
  formatJson(remoteServers),
);
await write(
  "contracts/tools.sha256",
  `${createHash("sha256").update(contract).digest("hex")}  tools.json\n`,
);

await write(
  ".codex-plugin/plugin.json",
  formatJson({
    ...metadata,
    skills: "./skills/",
    mcpServers: "./.mcp.json",
    interface: interfaceMetadata,
  }),
);
await write(
  ".claude-plugin/plugin.json",
  formatJson({
    ...metadata,
    skills: "./skills/",
    mcpServers: "./agents/claude/.mcp.json",
  }),
);
await write(
  ".cursor-plugin/plugin.json",
  formatJson({
    ...metadata,
    displayName: interfaceMetadata.displayName,
    author: cursorAuthor,
    logo: cursorLogoUrl,
    skills: "./skills/",
    mcpServers: "./agents/cursor/mcp.json",
  }),
);
await write(
  ".kimi-plugin/plugin.json",
  formatJson({
    ...metadata,
    skills: "./skills/",
    mcpServers: remoteServers,
    interface: {
      displayName: interfaceMetadata.displayName,
      shortDescription: interfaceMetadata.shortDescription,
      longDescription: interfaceMetadata.longDescription,
      developerName: interfaceMetadata.developerName,
      websiteURL: interfaceMetadata.websiteURL,
    },
  }),
);
await write("kimi.plugin.json", formatJson({
  ...metadata,
  skills: "./skills/",
  mcpServers: remoteServers,
  interface: {
    displayName: interfaceMetadata.displayName,
    shortDescription: interfaceMetadata.shortDescription,
    longDescription: interfaceMetadata.longDescription,
    developerName: interfaceMetadata.developerName,
    websiteURL: interfaceMetadata.websiteURL,
  },
}));

const marketplaceEntry = {
  name: manifest.name,
  source: ".",
  description: manifest.description,
  version: manifest.version,
  author: manifest.author,
  homepage: manifest.homepage,
  repository: manifest.repository,
  license: manifest.license,
  logo: logoPath,
  category: "Productivity",
  tags: ["citations", "evidence", "research", "mcp"],
};
const cursorMarketplaceEntry = {
  ...marketplaceEntry,
  displayName: interfaceMetadata.displayName,
  author: cursorAuthor,
  logo: cursorLogoUrl,
};
await write(
  ".claude-plugin/marketplace.json",
  formatJson({
    name: "citeanything",
    owner: { name: "VeriGlow", email: "feedback@citeanything.app" },
    plugins: [{ ...marketplaceEntry, strict: true }],
  }),
);
await write(
  ".cursor-plugin/marketplace.json",
  formatJson({
    name: "citeanything",
    owner: { name: "VeriGlow", email: "feedback@citeanything.app" },
    metadata: {
      description: "CiteAnything plugins for verifiable AI-generated research",
      version: manifest.version,
    },
    plugins: [cursorMarketplaceEntry],
  }),
);
await write(
  ".agents/plugins/marketplace.json",
  formatJson({
    name: "citeanything",
    interface: { displayName: "CiteAnything" },
    plugins: [
      {
        name: manifest.name,
        source: { source: "local", path: "." },
        policy: { installation: "AVAILABLE", authentication: "ON_USE" },
        category: "Productivity",
      },
    ],
  }),
);
