# CiteAnything Plugin One-Click Distribution Requirements

## Problem

The public CiteAnything Plugin can be installed through host-specific paths, but the cross-client
`plugins` installer currently discovers only its Skill and not its MCP server. Authentication also
requires a manually exported Skill Key. The distribution is therefore not yet equivalent to a
first-party, one-command Agent Plugin.

## Goal

A user shall be able to install CiteAnything once, start or reload a supported agent, authenticate
interactively on first use, and use the complete Skill + MCP capability without editing JSON,
copying files, or exporting an API key.

The first verified installation command, for Codex, shall be:

```bash
codex plugin marketplace add veriglow/citeanything-plugin --ref main && codex plugin add citeanything@citeanything
```

`npx plugins add veriglow/citeanything-plugin` remains the intended portable installer entry point,
but it shall not be advertised as activating a host until that host's native plugin and MCP views
confirm the installation.

## User Stories

1. As an agent user, I want one command to install CiteAnything into my supported local agents.
2. As a new CiteAnything user, I want first use to guide me through secure browser authentication.
3. As an existing user, I want the same Skill and MCP tools in every supported host.
4. As a security-conscious user, I want credentials stored and transmitted through an explicit
   authentication flow rather than committed configuration or inherited shell secrets.
5. As a maintainer, I want one canonical tool contract shared by the public plugin and training
   trajectories, with host-specific packaging treated only as an adapter layer.

## Functional Requirements

### R1 — One-command host installation

- Codex shall install the public GitHub plugin with one shell line using its native marketplace and
  plugin commands, yielding one Skill and one MCP server.
- When a user runs `npx plugins add veriglow/citeanything-plugin`, the portable installer shall
  discover one CiteAnything package containing at least one Skill and one MCP server.
- When supported agents are detected, the installer shall offer or perform installation through
  their native plugin mechanisms without requiring the user to locate plugin files manually.
- When a target is specified with `--target`, installation shall affect only that target.

### R2 — Portable package

- The plugin shall provide a conforming Agent Plugins 1.0 root `plugin.json`.
- The plugin shall expose the canonical Skill under the standard root `skills/` location.
- The plugin shall expose its MCP server through a conforming root `mcp.json`.
- Vendor-specific manifests may remain as adapters, but they shall not define a different public
  tool contract or different Skill behavior.
- Agent Plugins root files and generated host companions shall remain distinct when their schemas
  or transport spellings differ; parity means equivalent behavior, not byte-identical files.

### R3 — Complete public capability

- After installation and activation, the host shall expose the canonical CiteAnything Skill and
  these nine MCP tools:
  `create_citations`, `get_citation`, `wait_for_citation_preview`, `list_knowledge_base`,
  `search_knowledge_base`, `read_knowledge_base_page`, `import_pdf_to_knowledge_base`,
  `wait_for_knowledge_base_document`, and `publish_article`.
- The public plugin shall not add general web search, open, click, find, crawl, or arbitrary URL
  fetching tools.
- When a host lacks support for a component type, the installer or documentation shall report that
  limitation rather than silently representing the installation as complete.

### R4 — First-use authentication

- When an unauthenticated user invokes a protected CiteAnything tool, the system shall return an
  actionable sign-in flow that can be completed in a browser.
- When browser sign-in completes, the user shall be able to retry or continue the tool call without
  copying an API key or editing a configuration file.
- The portable plugin shall not depend on an arbitrary ambient environment variable such as
  `CITEANYTHING_API_KEY` for normal operation.
- The plugin package, logs, tool results, and generated Works shall not expose access tokens,
  refresh tokens, Skill Keys, or authorization codes.
- Authentication state shall be revocable and scoped to the signed-in user.

### R5 — Host parity

- Codex, Claude Code, Cursor, and Kimi Code shall receive the same Skill content, MCP tool names,
  input schemas, and API semantics.
- Every activated host-native installation shall expose the same resulting capabilities.
- Host-specific configuration shall be generated from or checked against canonical sources to
  prevent drift.
- Vercel Labs' `plugins` CLI shall be treated as one distribution adapter, not as the owner of the
  canonical package format.

### R6 — Installation scopes and lifecycle

- User scope shall be the default where the target supports it.
- Project or local scope shall be supported where the target exposes those scopes; unsupported
  scopes shall be reported explicitly.
- A released plugin version shall be reproducible from its Git tag.
- Updating the plugin shall preserve authentication state where secure host- or plugin-managed
  storage permits it.
- Uninstalling the plugin shall remove active registration and shall not leave usable credentials
  behind unless the user explicitly chooses to preserve them.

### R7 — Public discovery and documentation

- The GitHub repository shall remain an installable source of truth.
- CiteAnything shall publish a stable first-party web entry that identifies the Plugin, Skill, MCP
  endpoint or transport, current install command, supported agents, and authentication behavior.
- The README shall lead with the verified Codex one-line installation, user-visible capabilities,
  supported agents, and first-use login; unverified portable and host-specific steps shall be
  labeled accurately.
- Standalone Skill and MCP instructions shall remain available for hosts that do not support full
  plugins.

### R8 — Verification and release gate

- `npx plugins discover veriglow/citeanything-plugin` shall report both the Skill and MCP server;
  discovery alone shall not count as host activation.
- Automated tests shall assert the exact nine-tool public profile and absence of general web tools.
- Installation shall be smoke-tested in isolated user or project scopes for every locally testable
  supported host.
- At least one clean-install end-to-end test shall authenticate and complete a real read-only API
  call without a preconfigured Skill Key.
- The release shall not be advertised as one-click until the discovery, installation, activation,
  authentication, and tool-call gates pass.
- Repository commits shall contain no `Co-Authored-By` or other AI attribution trailers.

## Security Requirements

- The implementation shall follow least privilege for authorization scopes and MCP tools.
- Browser authentication shall bind the authorization result to the initiating client and expire
  abandoned attempts.
- Local callback, device authorization, or remote OAuth flows shall defend against CSRF, code
  interception, replay, and token leakage as applicable to the selected design.
- Plugin subprocesses shall run without shell interpolation of user-controlled values.
- Existing PDF import SSRF, size, redirect, and content checks shall remain enforced.

## Non-goals

- Adding a second public-web search or browsing provider.
- Training or shipping the CiteAnything model or harness as part of this plugin release.
- Hiding unsupported host limitations behind a successful installer exit.
- Treating a README-only change as completion of one-click distribution.

## Completion Definition

The work is complete only when a new user can run the primary command on a clean supported machine,
activate the plugin, sign in through the offered browser flow, and successfully call a CiteAnything
tool with the canonical Skill and all nine tools present—without manually handling secrets or
editing host configuration.
