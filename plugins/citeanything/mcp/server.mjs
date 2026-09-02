#!/usr/bin/env node

import { lookup } from "node:dns/promises";
import { realpathSync } from "node:fs";
import { isIP } from "node:net";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_NAME = "citeanything";
const SERVER_VERSION = "0.1.0";
const DEFAULT_BASE_URL = "https://citeanything.app";
const MAX_PDF_BYTES = 100 * 1024 * 1024;

const citationProperties = {
  claim: { type: "string", description: "The claim supported by this citation." },
  source_url: {
    type: "string",
    description: "Exact original URL for web evidence; omit for knowledge-base evidence.",
  },
  quoted_text: {
    type: "string",
    description: "Verbatim source excerpt, normally one to three sentences.",
  },
  citation_type: { type: "string", enum: ["text", "table"], default: "text" },
  action_steps: {
    type: "array",
    description: "Browser actions needed to reveal dynamic evidence; omit for static pages.",
    items: { type: "object", additionalProperties: true },
  },
  anchor: { type: "string", description: "Short exact text used to position a text highlight." },
  prefix: { type: "string", description: "Exact context immediately before an ambiguous anchor." },
  suffix: { type: "string", description: "Exact context immediately after an ambiguous anchor." },
  row_anchor: { type: "string", description: "Exact table row identifier." },
  col_anchor: { type: "string", description: "Exact table column header, when present." },
  cell_anchor: { type: "string", description: "Exact target table-cell value." },
  selection_scope: { type: "string", enum: ["cell", "row"], default: "cell" },
  source_type: { type: "string", enum: ["web", "kb"], default: "web" },
  kb_file: { type: "string", description: "Knowledge-base document stem." },
  page: {
    description: "Knowledge-base page or chapter identifier.",
    anyOf: [{ type: "string" }, { type: "integer" }],
  },
};

export const TOOLS = [
  {
    name: "create_citations",
    description: "Create one or more replayable citations from original evidence already inspected by the agent. Equivalent retries are idempotent.",
    inputSchema: {
      type: "object",
      properties: {
        citations: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: citationProperties,
            required: ["claim"],
            additionalProperties: false,
          },
        },
      },
      required: ["citations"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "get_citation",
    description: "Get the evidence, verification state, replay URL, and preview state for one CiteAnything token.",
    inputSchema: {
      type: "object",
      properties: { token: { type: "string", minLength: 1 } },
      required: ["token"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "wait_for_citation_preview",
    description: "Wait until a citation's automatic screenshot preview is done, failed, not applicable, or needs client capture.",
    inputSchema: {
      type: "object",
      properties: {
        token: { type: "string", minLength: 1 },
        timeout_seconds: { type: "integer", minimum: 0, maximum: 180, default: 120 },
        poll_interval_seconds: { type: "number", minimum: 0.5, maximum: 10, default: 2 },
      },
      required: ["token"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "list_knowledge_base",
    description: "List the current user's CiteAnything knowledge-base documents and processing states.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "search_knowledge_base",
    description: "Search extracted page text across the current user's ready CiteAnything knowledge-base documents.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1, maxLength: 500 },
        document_id: { type: "integer", minimum: 1 },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
      required: ["query"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "read_knowledge_base_page",
    description: "Read one extracted text page from an owned, ready CiteAnything knowledge-base document.",
    inputSchema: {
      type: "object",
      properties: {
        document_id: { type: "integer", minimum: 1 },
        page: { type: "integer", minimum: 1 },
      },
      required: ["document_id", "page"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "import_pdf_to_knowledge_base",
    description: "Import one directly relevant public PDF into the user's private CiteAnything knowledge base. This is not a general page-fetch tool.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Public HTTP(S) URL that resolves to a PDF." },
        display_name: { type: "string", description: "Optional human-readable document name." },
      },
      required: ["url"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: "wait_for_knowledge_base_document",
    description: "Wait for an imported CiteAnything knowledge-base document to become ready or fail.",
    inputSchema: {
      type: "object",
      properties: {
        document_id: { type: "integer", minimum: 1 },
        timeout_seconds: { type: "integer", minimum: 0, maximum: 600, default: 600 },
        poll_interval_seconds: { type: "number", minimum: 0.5, maximum: 15, default: 3 },
      },
      required: ["document_id"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "publish_article",
    description: "Publish or save a Markdown article containing already-created [@ev:TOKEN] citations.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", minLength: 1 },
        body: { type: "string", minLength: 1, description: "Markdown body with verified CiteAnything markers." },
        summary: { type: "string" },
        cover_image: { type: "string" },
        status: { type: "string", enum: ["draft", "published"], default: "published" },
      },
      required: ["title", "body"],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
];

function baseUrl() {
  return (process.env.CITEANYTHING_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function apiKey() {
  const key = (process.env.CITEANYTHING_API_KEY || "").trim();
  if (!key) {
    throw new Error("CITEANYTHING_API_KEY is not configured. Generate a Skill Key in Take CiteAnything Home, export it in the environment that launches the agent, and restart the host.");
  }
  return key;
}

function authHeaders(extra = {}) {
  return { Authorization: `Bearer ${apiKey()}`, ...extra };
}

async function readResponse(response) {
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  if (!response.ok) {
    const detail = data?.detail || data?.message || `HTTP ${response.status}`;
    throw new Error(`CiteAnything API ${response.status}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
  }
  return data;
}

async function request(path, options = {}, { optionalAuth = false } = {}) {
  const headers = new Headers(options.headers || {});
  const key = (process.env.CITEANYTHING_API_KEY || "").trim();
  if (key) headers.set("Authorization", `Bearer ${key}`);
  else if (!optionalAuth) headers.set("Authorization", `Bearer ${apiKey()}`);
  headers.set("User-Agent", `CiteAnything-Plugin/${SERVER_VERSION}`);
  const response = await fetch(`${baseUrl()}${path}`, { ...options, headers });
  return readResponse(response);
}

function normalizeCitation(citation) {
  const result = { ...citation };
  if (Array.isArray(result.action_steps) || (result.action_steps && typeof result.action_steps === "object")) {
    result.action_steps = JSON.stringify(result.action_steps);
  }
  if (result.page !== undefined) result.page = String(result.page);
  return result;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isPublicIpv4(address) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b, c] = octets;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 192 && b === 0 && c === 2) return false;
  if (a === 192 && b === 168) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

function isPublicIp(address) {
  const kind = isIP(address);
  if (kind === 4) return isPublicIpv4(address);
  if (kind !== 6) return false;
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1") return false;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return false;
  if (/^fe[89ab]/.test(normalized)) return false;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPublicIpv4(mapped[1]);
  return true;
}

async function assertPublicHttpUrl(value) {
  const url = value instanceof URL ? value : new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("url must be a public HTTP(S) URL without embedded credentials.");
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("url must resolve to a public Internet host.");
  }
  const literalKind = isIP(hostname);
  if (literalKind && !isPublicIp(hostname)) throw new Error("url must not target a private or reserved address.");
  if (!literalKind) {
    const answers = await lookup(hostname, { all: true, verbatim: true });
    if (!answers.length || answers.some((answer) => !isPublicIp(answer.address))) {
      throw new Error("url DNS must resolve only to public Internet addresses.");
    }
  }
  return url;
}

async function fetchPublicResource(value) {
  let current = await assertPublicHttpUrl(value);
  for (let redirects = 0; redirects <= 5; redirects += 1) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: { "User-Agent": `CiteAnything-Plugin/${SERVER_VERSION}` },
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get("location");
    if (!location) throw new Error("PDF download redirect omitted the Location header.");
    current = await assertPublicHttpUrl(new URL(location, current));
  }
  throw new Error("PDF download exceeded five redirects.");
}

async function listKnowledgeBase() {
  return request("/api/kb/documents");
}

async function waitForCitationPreview({ token, timeout_seconds = 120, poll_interval_seconds = 2 }) {
  const deadline = Date.now() + Math.max(0, Math.min(Number(timeout_seconds), 180)) * 1000;
  const interval = Math.max(0.5, Math.min(Number(poll_interval_seconds), 10)) * 1000;
  while (true) {
    const citation = await request(`/api/citation/${encodeURIComponent(token)}`, {}, { optionalAuth: true });
    const terminal = ["done", "failed", "not_applicable"].includes(citation.screenshot_status) || citation.client_capture_required === true;
    if (terminal) return { completed: true, timed_out: false, citation };
    if (Date.now() >= deadline) return { completed: false, timed_out: true, citation };
    await sleep(interval);
  }
}

async function waitForKnowledgeBaseDocument({ document_id, timeout_seconds = 600, poll_interval_seconds = 3 }) {
  const id = Number(document_id);
  const deadline = Date.now() + Math.max(0, Math.min(Number(timeout_seconds), 600)) * 1000;
  const interval = Math.max(0.5, Math.min(Number(poll_interval_seconds), 15)) * 1000;
  while (true) {
    const payload = await listKnowledgeBase();
    const document = (payload.documents || []).find((item) => Number(item.id) === id);
    if (!document) throw new Error(`Knowledge-base document ${id} was not found.`);
    if (["ready", "failed"].includes(document.status)) {
      return { completed: document.status === "ready", timed_out: false, document };
    }
    if (Date.now() >= deadline) return { completed: false, timed_out: true, document };
    await sleep(interval);
  }
}

async function importPdf({ url, display_name = "" }) {
  const parsed = await assertPublicHttpUrl(url);
  const response = await fetchPublicResource(parsed);
  if (!response.ok) throw new Error(`PDF download failed with HTTP ${response.status}.`);
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_PDF_BYTES) throw new Error("PDF exceeds the 100 MB import limit.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_PDF_BYTES) throw new Error("PDF exceeds the 100 MB import limit.");
  if (bytes.byteLength < 5 || new TextDecoder("ascii").decode(bytes.subarray(0, 5)) !== "%PDF-") {
    throw new Error("The URL did not return a valid PDF file.");
  }
  const finalUrl = response.url || parsed.href;
  const filename = decodeURIComponent(basename(new URL(finalUrl).pathname)) || "document.pdf";
  const safeFilename = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
  const form = new FormData();
  form.set("file", new Blob([bytes], { type: "application/pdf" }), safeFilename);
  form.set("display_name", display_name || safeFilename.replace(/\.pdf$/i, ""));
  form.set("source_url", finalUrl);
  return request("/api/kb/upload", { method: "POST", body: form });
}

export async function callTool(name, args = {}) {
  switch (name) {
    case "create_citations":
      if (!Array.isArray(args.citations) || args.citations.length === 0) throw new Error("citations must be a non-empty array.");
      return {
        citations: await request("/api/citation/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ citations: args.citations.map(normalizeCitation) }),
        }),
      };
    case "get_citation":
      return request(`/api/citation/${encodeURIComponent(args.token)}`, {}, { optionalAuth: true });
    case "wait_for_citation_preview":
      return waitForCitationPreview(args);
    case "list_knowledge_base":
      return listKnowledgeBase();
    case "search_knowledge_base": {
      const query = new URLSearchParams({ query: String(args.query), limit: String(args.limit ?? 20) });
      if (args.document_id !== undefined) query.set("document_id", String(args.document_id));
      return request(`/api/kb/agent/search?${query}`);
    }
    case "read_knowledge_base_page": {
      const query = new URLSearchParams({ document_id: String(args.document_id), page: String(args.page) });
      return request(`/api/kb/agent/page?${query}`);
    }
    case "import_pdf_to_knowledge_base":
      return importPdf(args);
    case "wait_for_knowledge_base_document":
      return waitForKnowledgeBaseDocument(args);
    case "publish_article":
      return request("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function success(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function protocolError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

export async function handleMessage(message) {
  const id = message?.id;
  switch (message?.method) {
    case "initialize":
      return success(id, {
        protocolVersion: message?.params?.protocolVersion || "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });
    case "notifications/initialized":
    case "notifications/cancelled":
      return null;
    case "ping":
      return success(id, {});
    case "tools/list":
      return success(id, { tools: TOOLS });
    case "tools/call": {
      try {
        const result = await callTool(message?.params?.name || "", message?.params?.arguments || {});
        return success(id, {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
          isError: false,
        });
      } catch (error) {
        const result = { ok: false, error: "tool_execution_failed", message: error instanceof Error ? error.message : String(error) };
        return success(id, {
          content: [{ type: "text", text: JSON.stringify(result) }],
          structuredContent: result,
          isError: true,
        });
      }
    }
    default:
      return id === undefined ? null : protocolError(id, -32601, `Method not found: ${message?.method || ""}`);
  }
}

export async function run(input = process.stdin, output = process.stdout) {
  input.setEncoding("utf8");
  let buffer = "";
  for await (const chunk of input) {
    buffer += chunk;
    while (buffer.includes("\n")) {
      const index = buffer.indexOf("\n");
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (!line) continue;
      try {
        const response = await handleMessage(JSON.parse(line));
        if (response) output.write(`${JSON.stringify(response)}\n`);
      } catch (error) {
        process.stderr.write(`CiteAnything MCP protocol error: ${error instanceof Error ? error.message : String(error)}\n`);
      }
    }
  }
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  run().catch((error) => {
    process.stderr.write(`CiteAnything MCP failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
