<p align="center">
  <img src="https://brand.veri-glow.com/favicon.svg" width="80" alt="CiteAnything" />
</p>

<h1 align="center">CiteAnything Plugin</h1>

<p align="center">
  <strong>Skill + MCP tools for verifiable AI-generated research</strong><br>
  Use your agent's own web tools. Turn inspected evidence into replayable citations.
</p>

<p align="center">
  <a href="https://citeanything.app"><img src="https://img.shields.io/badge/app-citeanything.app-10B981?style=flat-square" alt="CiteAnything" /></a>
  <a href="https://github.com/veriglow/citeanything-plugin"><img src="https://img.shields.io/badge/plugin-Skill_%2B_MCP-10B981?style=flat-square" alt="Skill and MCP" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License" /></a>
</p>

## What is included

- An Agent Skill that teaches evidence selection, exact anchors, citation rendering, and private KB workflows.
- A zero-dependency stdio MCP server that calls the existing CiteAnything API.
- Native manifests and marketplace catalogs for Codex, Claude Code, Cursor, and Kimi Code.

The public Plugin deliberately does **not** provide web search, page opening, clicking, finding, crawling, or general URL fetching. Use the host agent's built-in web/browser tools, then pass exact inspected evidence to CiteAnything.

## Public MCP tools

| Tool | Purpose |
|---|---|
| `create_citations` | Create an idempotent batch of replayable citations |
| `get_citation` | Read evidence and verification/preview state |
| `wait_for_citation_preview` | Wait for automatic screenshot completion or client-capture fallback |
| `list_knowledge_base` | List private KB documents and processing states |
| `search_knowledge_base` | Locate evidence in ready KB documents |
| `read_knowledge_base_page` | Read one full extracted page before citing it |
| `import_pdf_to_knowledge_base` | Import one directly relevant public PDF; not a general fetch tool |
| `wait_for_knowledge_base_document` | Wait for parsing to finish or fail |
| `publish_article` | Publish Markdown containing verified `[@ev:TOKEN]` markers |

## Authentication

Generate a scoped **Skill Key** from **Take CiteAnything Home**, then make it available to the process that launches your agent:

```bash
export CITEANYTHING_API_KEY="ca_..."
```

International is the default. For China, also set:

```bash
export CITEANYTHING_BASE_URL="https://citeanything.cn"
```

Restart the host after changing persistent environment variables. Never put a key in this repository, an MCP JSON file committed to Git, or an AI-generated Work.

## Install in Codex

```bash
codex plugin marketplace add veriglow/citeanything-plugin
codex plugin add citeanything@citeanything
```

Start a new Codex thread after installation so the Skill and MCP tools are loaded.

## Install in Claude Code

Run inside Claude Code:

```text
/plugin marketplace add veriglow/citeanything-plugin
/plugin install citeanything@citeanything
```

Start a new session after installation. The bundled MCP server inherits `CITEANYTHING_API_KEY` from the environment that launched Claude Code.

## Install in Kimi Code

Kimi Code's current plugin system installs directly from a GitHub repository URL. Run inside the current Kimi Code TUI:

```text
/plugins install https://github.com/veriglow/citeanything-plugin
/reload
```

The legacy Python `kimi` CLI does not support plugins; use the current Node-based Kimi Code CLI.

## Install in Cursor

This repository includes a Cursor marketplace and a per-plugin `.cursor-plugin/plugin.json`. Add the repository as a custom or team marketplace from **Cursor → Customize → Plugins**, install **CiteAnything**, and provide the requested scoped Skill Key in **Configure**.

Until the marketplace UI surfaces a public repository-install shortcut for your Cursor version, clone the repository and use `plugins/citeanything` as the local plugin directory. Cursor loads both its Skill and `mcp.json` from that directory.

## Other MCP clients

The bundled server requires Node.js 18 or newer and speaks MCP over stdio:

```json
{
  "mcpServers": {
    "citeanything": {
      "command": "npx",
      "args": [
        "-y",
        "https://github.com/veriglow/citeanything-plugin/archive/refs/tags/v0.1.0.tar.gz"
      ]
    }
  }
}
```

This HTTPS tarball is pinned to a release and does not require a configured GitHub SSH key.

## Standalone Skill

Hosts that support Agent Skills but not plugins can install [`SKILL.md`](SKILL.md) on its own. The Skill can explain the workflow, but MCP installation is still required for actual CiteAnything tool calls.

## Development

```bash
npm test
python3 /path/to/skill-creator/scripts/quick_validate.py plugins/citeanything/skills/citeanything
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/citeanything
```

The MCP implementation has no package dependencies. Its only external effects are calls to the selected CiteAnything service and the explicit public-PDF import operation.

## License

[MIT](LICENSE)
