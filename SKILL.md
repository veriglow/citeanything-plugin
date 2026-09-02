---
name: citeanything
description: Create replayable CiteAnything citations from original web evidence or private knowledge-base documents. Use after inspecting sources when factual claims need durable citations, screenshot previews, or a published cited article. Do not use CiteAnything to search or read the public web; use the host agent's own web tools first.
---

# CiteAnything

Turn evidence already inspected by the agent into citations that readers can reopen and verify.

## Boundaries

- Use the host's own search, browser, or web tools to discover and inspect public sources.
- Search-result snippets are discovery aids, not evidence. Open the original source before citing it.
- CiteAnything tools create and retrieve citations, manage CiteAnything knowledge-base evidence, and publish cited articles. They do not provide general web search or page fetching.
- Authentication is completed through the host's MCP browser sign-in flow. Never ask the user to paste a bearer token, authorization code, refresh token, or Skill Key into a prompt or artifact.

## Web evidence

1. Inspect the original page with the host agent's tools.
2. Copy an exact rendered excerpt. Do not invent or paraphrase the anchor.
3. Call `create_citations`, preferably once for a verified batch.
4. Put each returned citation immediately after the claim it supports.
5. Call `wait_for_citation_preview` only when the user needs to know whether the automatic screenshot succeeded or requires client capture.

For ordinary prose use `citation_type: "text"`, an exact short `anchor`, and a longer exact `quoted_text`. For a native HTML table or ARIA grid use `citation_type: "table"`, an exact `row_anchor`, and `selection_scope: "cell"` or `"row"`. Add `col_anchor` only for a real header cell. Add `action_steps` only when replay must reproduce an interaction needed to reveal the evidence.

## Private knowledge-base evidence

1. Call `list_knowledge_base` to inspect document states.
2. Call `search_knowledge_base` to locate candidate pages.
3. Call `read_knowledge_base_page` and copy exact evidence from the full page text.
4. Call `create_citations` with `source_type: "kb"`, the returned `stem` as `kb_file`, and the actual page number. Omit `source_url`.

Use `import_pdf_to_knowledge_base` only for a directly relevant, lawful public PDF worth retaining. It imports the PDF but does not expose a general network-fetch capability. Pass its returned `doc_id` as `document_id` to `wait_for_knowledge_base_document`, then read the relevant page before citing it.

## Output contract

- Inside CiteAnything conversations, use `[@ev:TOKEN]` immediately after the supported claim.
- In ordinary Markdown, use the returned citation URL as a clickable link; raw markers have no renderer there.
- In visible HTML, PPTX, or PDF Works, render linked numbered badges and retain the full token mapping in `citations.json`; do not expose raw markers as visible artifact text.
- Call `publish_article` only after every marker in the Markdown body was returned by `create_citations` or otherwise verified with `get_citation`.

If citation creation fails, correct the evidence payload or choose another inspected source. Never silently present an external factual claim as cited.
