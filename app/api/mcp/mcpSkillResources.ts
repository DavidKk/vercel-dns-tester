import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { McpResourceProvider } from '@/initializer/mcp'

import { moduleSkillMarkdownFilename, moduleSkillResourceUri } from './skillNaming'

/** MCP resource module id for the combined DNS Tester SKILL document */
const MCP_SKILL_MODULE_ID = 'mcp'

/** Relative path to deployable SKILL markdown (committed; served via MCP resources) */
const SKILL_MARKDOWN_RELATIVE_PATH = join('skills', 'dns-tester-mcp', 'SKILL.md')

let cachedSkillMarkdown: string | null = null

/**
 * Load SKILL markdown from disk once per process (Node.js MCP routes only).
 * @returns Full SKILL document including YAML front matter
 */
function loadDnsTesterMcpSkillMarkdown(): string {
  if (cachedSkillMarkdown === null) {
    const absolutePath = join(process.cwd(), SKILL_MARKDOWN_RELATIVE_PATH)
    cachedSkillMarkdown = readFileSync(absolutePath, 'utf8')
  }
  return cachedSkillMarkdown
}

/**
 * MCP resource provider exposing the DNS Tester SKILL for `resources/list` and `resources/read`.
 * @returns Provider wired into both `/api/mcp` and `/api/mcp-dns` HTTP MCP servers
 */
export function getDnsTesterMcpSkillResourceProvider(): McpResourceProvider {
  const uri = moduleSkillResourceUri(MCP_SKILL_MODULE_ID)
  const name = moduleSkillMarkdownFilename(MCP_SKILL_MODULE_ID)
  const text = loadDnsTesterMcpSkillMarkdown()

  return {
    listResources() {
      return [
        {
          uri,
          name,
          description: 'Agent-ready SKILL for DNS Tester HTTP MCP (HOSTS + public DNS probe endpoints).',
          mimeType: 'text/markdown',
        },
      ]
    },
    async readResource(requestedUri: string) {
      if (requestedUri.trim() !== uri) {
        return null
      }
      return { mimeType: 'text/markdown', text }
    },
  }
}
