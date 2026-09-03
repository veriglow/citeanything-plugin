import assert from "node:assert/strict";
import test from "node:test";

import {
  handleMessage,
  TOOL_CONTRACT,
  TOOL_SCOPES,
  TOOLS,
} from "../compatibility/stdio/server.mjs";

test("publishes the agreed public tool profile without general web tools", () => {
  assert.deepEqual(
    TOOLS.map((tool) => tool.name),
    [
      "create_citations",
      "get_citation",
      "wait_for_citation_preview",
      "list_knowledge_base",
      "search_knowledge_base",
      "read_knowledge_base_page",
      "import_pdf_to_knowledge_base",
      "wait_for_knowledge_base_document",
      "publish_article",
    ],
  );
  assert.equal(TOOLS.some((tool) => ["search_web", "fetch_url", "open", "click", "find"].includes(tool.name)), false);
  assert.equal(TOOL_CONTRACT.contractVersion, "0.2.1");
  assert.deepEqual(
    Object.keys(TOOL_SCOPES).sort(),
    TOOLS.map((tool) => tool.name).sort(),
  );
});

test("implements MCP initialize and tools/list", async () => {
  const initialized = await handleMessage({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-06-18" },
  });
  assert.equal(initialized.result.protocolVersion, "2025-06-18");
  assert.equal(initialized.result.serverInfo.name, "citeanything");

  const listed = await handleMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" });
  assert.equal(listed.result.tools.length, 9);
});

test("returns a structured setup error without leaking credentials", async () => {
  const previous = process.env.CITEANYTHING_API_KEY;
  delete process.env.CITEANYTHING_API_KEY;
  try {
    const response = await handleMessage({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "list_knowledge_base", arguments: {} },
    });
    assert.equal(response.result.isError, true);
    assert.match(response.result.structuredContent.message, /CITEANYTHING_API_KEY is not configured/);
  } finally {
    if (previous === undefined) delete process.env.CITEANYTHING_API_KEY;
    else process.env.CITEANYTHING_API_KEY = previous;
  }
});

test("PDF import rejects loopback targets before making a request", async () => {
  const previous = process.env.CITEANYTHING_API_KEY;
  process.env.CITEANYTHING_API_KEY = "test-key";
  try {
    const response = await handleMessage({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "import_pdf_to_knowledge_base",
        arguments: { url: "http://127.0.0.1/private.pdf" },
      },
    });
    assert.equal(response.result.isError, true);
    assert.match(response.result.structuredContent.message, /private or reserved address/);
  } finally {
    if (previous === undefined) delete process.env.CITEANYTHING_API_KEY;
    else process.env.CITEANYTHING_API_KEY = previous;
  }
});
