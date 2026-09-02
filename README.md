<p align="center">
  <img src="https://brand.veri-glow.com/favicon.svg" width="80" alt="CiteAnything" />
</p>

<h1 align="center">CiteAnything Plugin</h1>

<p align="center">
  <strong>Verifiable citations for AI agents.</strong><br>
  Inspect with the agent you already use; preserve the evidence with CiteAnything.
</p>

<p align="center">
  <a href="https://citeanything.app/plugin"><img src="https://img.shields.io/badge/plugin-citeanything.app-10B981?style=flat-square" alt="CiteAnything Plugin" /></a>
  <a href="https://agent-plugins.org"><img src="https://img.shields.io/badge/package-Skill_%2B_MCP-10B981?style=flat-square" alt="Agent Plugin: Skill and MCP" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License" /></a>
</p>

## Install

```bash
npx plugins add veriglow/citeanything-plugin
```

The installer detects supported agents and installs one Agent Skill plus one remote MCP server. The
default scope is your user account; use `--scope project` when you deliberately want a project-local
installation. Select one host explicitly with `--target`.

On the first protected tool call, the host opens `citeanything.app` in your browser. Log in, review
the five permissions, and approve the connection. Normal installation requires no Skill Key,
environment variable, copied authorization code, or hand-edited MCP JSON.

## What agents receive

- One canonical Skill for selecting exact evidence, building anchors, placing citation markers, and
  keeping private knowledge-base material private.
- One first-party Streamable HTTP MCP service at `https://citeanything.app/mcp`.
- Exactly nine product tools with browser OAuth, per-tool scopes, refresh rotation, and user
  revocation.

| Tool | Purpose |
| --- | --- |
| `create_citations` | Create an idempotent batch of replayable citations |
| `get_citation` | Read an owned citation and its verification state |
| `wait_for_citation_preview` | Wait for automatic preview completion or client-capture fallback |
| `list_knowledge_base` | List private knowledge-base documents and processing states |
| `search_knowledge_base` | Locate evidence in ready private documents |
| `read_knowledge_base_page` | Read one full extracted page before citing it |
| `import_pdf_to_knowledge_base` | Import one explicitly selected public PDF |
| `wait_for_knowledge_base_document` | Wait for parsing to finish or fail |
| `publish_article` | Publish Markdown containing verified `[@ev:TOKEN]` markers |

CiteAnything deliberately does not provide general web search, open, click, find, crawl, browser
automation, or arbitrary page-fetching tools. Use your host agent's own web tools to inspect the
original source; use CiteAnything after the evidence is known.

## Host status

The package includes generated adapters for Codex, Claude Code, Cursor, and Kimi Code. Agent Plugin
discovery finds both the Skill and remote MCP contribution. A host is listed as fully supported on
the [Plugin page](https://citeanything.app/plugin) only after a clean install, browser OAuth, tool
call, restart/refresh, uninstall, and revocation have all passed on a dated host version.

Until those v0.2 interoperability checks are published, treat each adapter as a release candidate
rather than a compatibility promise.

## Update, uninstall, and revoke

- Re-run the install command to install the current repository release.
- Remove CiteAnything through the target host's plugin or MCP settings. Host-specific storage and
  removal behavior differs, so the Plugin page records the verified path for each host version.
- Revoke any live OAuth session from [Connected apps](https://citeanything.app/connections). Removal
  and revocation are separate on purpose: revocation immediately disables server access even if a
  host left cached metadata behind.

## Other installation paths

These are fallbacks for hosts that cannot install a complete Agent Plugin:

- **Standalone Skill:** install [`skills/citeanything/SKILL.md`](skills/citeanything/SKILL.md), or
  fetch the released Skill from <https://citeanything.app/SKILL.md>.
- **Direct remote MCP:** configure `https://citeanything.app/mcp` as a Streamable HTTP MCP server.
  The client must support MCP OAuth discovery and PKCE.
- **Legacy stdio:** run the compatibility server in [`compatibility/stdio`](compatibility/stdio) with
  a scoped Skill Key. This manual path exists for older clients and is not the primary v0.2 flow.

Version 0.2 one-click OAuth targets the international `citeanything.app` account system. The China
service continues to use its existing manual compatibility path; the package never silently moves
credentials or data between regions.

## Troubleshooting

- If the Skill appears but no CiteAnything tools do, restart the host and confirm its installed MCP
  entry points to `https://citeanything.app/mcp`.
- If sign-in does not open, ask the host to reconnect or authenticate the `citeanything` MCP server;
  do not work around it by pasting tokens into chat.
- If a revoked client keeps failing, remove its cached MCP connection in the host and connect again.
- Run `npx plugins discover veriglow/citeanything-plugin --debug` to distinguish package discovery
  from host activation. Report the host name/version and non-secret error text in a GitHub issue.

## Package contract

[`contracts/tools.json`](contracts/tools.json) is the versioned source of truth for the public tool
names, JSON Schemas, annotations, and OAuth scopes. The hosted MCP server, generated adapters, stdio
fallback, contract tests, and future training-trajectory adapters consume the same contract.

```bash
npm run generate
npm test
npm run verify
npx plugins discover . --debug
```

Generation is deterministic and verification fails if a host adapter, Skill copy, contract hash,
or public tool allowlist drifts.

## Public entry points

- Plugin guide: <https://citeanything.app/plugin>
- Canonical Skill: <https://citeanything.app/SKILL.md>
- Machine-readable metadata: <https://citeanything.app/plugin/manifest.json>
- MCP resource: <https://citeanything.app/mcp>

## License

[MIT](LICENSE)
