# CiteAnything Plugin One-Click Distribution Implementation Plan

## Milestone A: Freeze the portable contract and package

- [x] 1. Establish the exact baseline and protect unrelated work
  - Record current revisions and dirty state for `citeanything-plugin`, the VeriGlow umbrella,
    `citeanything-server`, and `citeanything-client` before editing.
  - Preserve the existing unrelated `VeriGlow-BP`, `inventory.json`, and `citeanything/research/`
    changes; never stage them as part of this feature unless a directly overlapping inventory entry
    must be merged carefully.
  - Capture the current `npx plugins discover` output showing Skill-only detection as the regression
    baseline.
  - Confirm existing v0.1 stdio tests and relevant server/client auth tests pass before refactoring.
  - _Requirements: R6, R8_

- [x] 2. Create the canonical nine-tool contract
  - Extract every public tool name, description, input schema, response envelope, error code, and
    minimum OAuth scope into `contracts/tools.json`.
  - Give the contract an explicit semantic version and deterministic hash suitable for Plugin,
    server, and future harness compatibility checks.
  - Assert the exact nine-tool allowlist and reject general web search, open, click, find, crawl,
    browser automation, and arbitrary-fetch aliases.
  - Generate or load the existing Node stdio definitions from the contract without changing v0.1
    behavior.
  - Add fixtures that future training-trajectory adapters can consume without depending on a host's
    private tool wrapper.
  - _Requirements: R3, R5, R8_

- [x] 3. Convert the repository to a conforming Agent Plugin root
  - Add standard root `plugin.json`, `mcp.json`, and `skills/citeanything/SKILL.md`.
  - Configure the root MCP contribution as Streamable HTTP at
    `https://citeanything.app/mcp`, with no API key or environment-variable placeholders.
  - Move the stdio implementation under `compatibility/stdio/` and preserve its executable npm bin
    as a clearly labeled legacy/manual path.
  - Add schema validation and package-layout tests for the Agent Plugins 1.0 files.
  - Run `npx plugins discover` locally and require both one Skill and one MCP server.
  - _Requirements: R1, R2, R3, R4, R8_

- [x] 4. Generate and verify host adapters
  - Generate Codex, Claude Code, Cursor, and Kimi metadata from the canonical manifest, Skill, MCP
    URL, tool contract version, and package version.
  - Remove duplicated credential prompts from adapters on the remote OAuth path.
  - Make generation deterministic and make CI fail when committed adapters drift.
  - Mark a host Skill-only or legacy-stdio-only when its tested version cannot complete remote MCP
    OAuth; do not claim full Plugin support.
  - Preserve host-native marketplace metadata needed for later publication.
  - _Requirements: R1, R2, R5, R6_

## Milestone B: Add standards-based MCP OAuth to the international server

- [x] 5. Add OAuth persistence and shared security primitives
  - Add `McpOAuthClient`, `McpAuthorizationGrant`, and `McpSession` schemas with safe additive
    migrations, ownership/index constraints, expiry, revocation, and token-family state.
  - Store authorization codes and refresh tokens only as hashes; never persist access tokens.
  - Extract reusable PKCE, secure-token, hashing, expiry, rotation, rate-limit, and audit helpers from
    the existing CLI authentication implementation without changing the CLI protocol.
  - Add cleanup for expired grants and sessions and database tests for replay, uniqueness, and
    cross-user isolation.
  - Update the relevant CiteAnything product spec and `inventory.json` classifications without
    overwriting unrelated edits.
  - _Requirements: R4, R6, R8; Security Requirements_

- [x] 6. Implement OAuth and MCP discovery endpoints
  - Serve RFC 9728 Protected Resource Metadata for `https://citeanything.app/mcp`.
  - Serve RFC 8414 Authorization Server Metadata with PKCE S256, scopes, resource indicators,
    token, registration, and revocation capabilities.
  - Implement public-client dynamic registration with exact redirect-URI validation, bounded client
    metadata, expiry/management policy, and rate limits.
  - Support Client ID Metadata Documents where compatible with the final MCP SDK/client versions,
    while retaining the DCR path needed by MCP 2025-06-18 clients.
  - Return the correct `401` `WWW-Authenticate` challenge and insufficient-scope response without
    leaking internal details.
  - Add conformance tests for metadata URLs, aliases required by real clients, registration abuse,
    and malformed requests.
  - _Requirements: R4, R5, R8; Security Requirements_

- [x] 7. Implement browser authorization, tokens, refresh, and revocation
  - Add authorization-code consent flow using the existing international-site account session and
    mandatory PKCE S256.
  - Bind each code to user, public client, exact redirect URI, MCP resource, granted scopes, and
    expiry; make it single-use.
  - Issue one-hour `mcp_access` tokens whose audience is exactly
    `https://citeanything.app/mcp` and whose claims include client and granted scopes.
  - Implement rotating opaque refresh tokens with a 90-day absolute session lifetime and token-family
    revocation on replay.
  - Implement standard revocation and reject web, CLI, legacy, and Skill Key credentials at `/mcp`.
  - Add success, denial, cancellation, expiry, replay, wrong verifier/client/redirect/resource,
    refresh rotation, revocation, and secret-redaction tests.
  - _Requirements: R4, R5, R6, R8; Security Requirements_

## Milestone C: Serve the canonical nine tools remotely

- [x] 8. Extract reusable application services from REST routes
  - Separate authenticated HTTP parsing from citation batch creation, citation lookup/preview,
    knowledge-base list/search/page/import/status, and article publishing operations.
  - Make each service accept an explicit authenticated user identity and preserve all existing
    ownership, idempotency, validation, billing, queue, and marker-verification behavior.
  - Keep existing REST routes backward compatible and prove representative REST responses do not
    regress.
  - Move no bearer token between internal services and make recursive public HTTP calls unnecessary.
  - Update specs and inventory entries for each new Function or Schema object.
  - _Requirements: R3, R4, R5, R8_

- [x] 9. Mount the Streamable HTTP MCP resource server
  - Add the official Python MCP SDK and mount its application at `/mcp` within the existing FastAPI
    lifespan.
  - Configure stateless JSON operation where the validated SDK/deployment combination supports it.
  - Convert the canonical JSON contract into server tool registrations and fail startup or CI when
    the deployed contract version/hash differs from the Plugin release target.
  - Resolve every request to an `mcp_access` principal, enforce audience and per-tool minimum scope,
    and pass only user ID plus authorized context into application services.
  - Implement protocol initialize, tools/list, calls, bounded waits, cancellation, stable errors,
    request IDs, and non-secret audit records.
  - _Requirements: R2, R3, R4, R5, R8_

- [x] 10. Implement and verify all nine remote tool handlers
  - Add `create_citations`, `get_citation`, and `wait_for_citation_preview` with existing citation
    idempotency and ownership behavior.
  - Add `list_knowledge_base`, `search_knowledge_base`, `read_knowledge_base_page`, and
    `wait_for_knowledge_base_document` with owned-document and processing-state checks.
  - Add `import_pdf_to_knowledge_base` with DNS/IP checks across every redirect, private/special-use
    address blocking, strict byte/time/redirect caps, and final PDF content validation.
  - Add `publish_article` with token/marker validation and article ownership rules.
  - Run contract snapshots, two-user isolation, REST/MCP parity, polling timeout/cancellation, and
    PDF abuse tests.
  - Assert that tools/list exposes exactly the canonical nine tools and no network-search surface.
  - _Requirements: R3, R4, R5, R8; Security Requirements_

## Milestone D: Complete first-use UX and public discovery

- [x] 11. Add international-site OAuth consent and connection management
  - Add a browser approval page that names the requesting client, protected resource, and each
    requested scope in plain language.
  - Preserve the authorization request through account sign-in without weakening state, redirect,
    PKCE, or expiry binding.
  - Add approve, deny, expired, invalid, and success states that work on desktop and mobile.
  - Add an authenticated connected-apps view with client, scopes, creation/last-use time, and revoke
    action, without displaying credentials.
  - Add accessibility, authentication, cross-user, and browser-flow tests.
  - _Requirements: R4, R6, R7, R8_

- [x] 12. Publish the stable first-party Plugin and Skill entry points
  - Add `https://citeanything.app/plugin` with install command, repository, current released version,
    exact tool list, no-web-search boundary, host matrix, OAuth scopes, update/uninstall/revoke paths,
    fallbacks, and last verification date.
  - Serve the released canonical Skill at `https://citeanything.app/SKILL.md` and redirect
    `/SKILL` if retained as a convenience URL.
  - Expose structured, cacheable Plugin metadata that distinguishes released content from the main
    branch and links the canonical MCP resource.
  - State explicitly that v0.2 one-click OAuth supports `citeanything.app`; document `.cn` only as
    its unchanged manual compatibility path.
  - Update discovery content, sitemaps or machine-readable indexes where already used by the site.
  - _Requirements: R3, R7_

- [x] 13. Rewrite installation and lifecycle documentation around verified behavior
  - Lead the README with `npx plugins add veriglow/citeanything-plugin`, capabilities, supported
    hosts, and first-use browser login.
  - Document user/project scopes, update, uninstall, revocation, and clean troubleshooting.
  - Move native installation, standalone Skill, direct remote MCP, and Skill Key stdio instructions
    into clearly labeled fallback sections.
  - Do not advertise a host as fully supported until its clean-install test passes.
  - Remove stale v0.1 claims and assert there are no Anthropic or other AI attribution trailers in
    release commits.
  - _Requirements: R1, R5, R6, R7, R8_

## Milestone E: Interoperability, rollout, and release

- [ ] 14. Validate staging through real MCP clients
  - Deploy OAuth metadata, endpoints, consent UI, and `/mcp` behind an international staging feature
    flag without changing China deployment behavior.
  - Run protocol and OAuth conformance tests with the official MCP inspector/SDK client and inspect
    production-shaped proxy, CORS, streaming, timeout, and multi-instance behavior.
  - Complete a clean authentication and `list_knowledge_base` call with no Skill Key, restart the
    client, verify refresh, revoke the connection, and verify reauthorization is required.
  - Exercise representative citation creation/preview, KB read/import/status, and article publishing
    calls with disposable staging data.
  - Record SDK and protocol versions, findings, and rollback procedure.
  - _Requirements: R3, R4, R6, R8_

- [ ] 15. Test installation and activation host by host
  - Test `npx plugins discover` and `npx plugins add` from the candidate Git tag in isolated user and
    project profiles.
  - Verify Skill discovery, MCP registration, browser OAuth, tools/list, read-only authenticated call,
    restart/refresh, update, uninstall, and revocation in locally available Codex, Claude Code,
    Cursor, and Kimi Code versions.
  - Where a host does not support remote MCP OAuth, label the result accurately, retain its documented
    fallback, and exclude it from the full-support list until resolved.
  - Confirm installer target selection does not mutate non-target hosts.
  - Save a dated compatibility matrix and redact all account identifiers and tokens from evidence.
  - _Requirements: R1, R4, R5, R6, R8_

- [ ] 16. Release v0.2.0 only after every advertised gate passes
  - Run Plugin package/contract tests, backend tests, client tests, lint/type/build checks, inventory
    validation, secret scans, and clean-tree adapter regeneration.
  - Review staged files in each repository and exclude unrelated work and sensitive personal files.
  - Commit without `Co-Authored-By`, AI attribution, or generated-by trailers; push the required
    repository and submodule/umbrella revisions in dependency order.
  - Deploy and enable the international MCP OAuth feature, create the `v0.2.0` Git tag/release, and
    publish matching marketplace/discovery metadata.
  - Repeat discovery and at least one clean end-to-end OAuth read call from the exact released tag.
  - Announce only the hosts that passed complete installation, activation, authorization, and tool
    execution; retain rollback controls until post-release checks finish.
  - _Requirements: R1-R8; Security Requirements; Completion Definition_

## Completion Gate

The implementation is not complete merely because manifests validate or `/mcp` responds. Completion
requires a clean user profile to install the released Plugin, discover its canonical Skill and exact
nine-tool MCP server, authorize through the international CiteAnything browser flow, complete a real
owned read operation without a preconfigured secret, survive restart through secure refresh, and
lose access after revocation on every host advertised as fully supported.
