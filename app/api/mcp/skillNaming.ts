import packageJson from '../../../package.json'

const PKG_NAME = typeof packageJson.name === 'string' ? packageJson.name : 'vercel-dns-tester'

/** Download / MCP resource `name`, e.g. `vercel-dns-tester-mcp-skill.md`. */
export function moduleSkillMarkdownFilename(moduleId: string): string {
  return `${PKG_NAME}-${moduleId}-skill.md`
}

/** Stable MCP resource URI, e.g. `skill://vercel-dns-tester-mcp/vercel-dns-tester-mcp-skill.md`. */
export function moduleSkillResourceUri(moduleId: string): string {
  return `skill://${PKG_NAME}-${moduleId}/${moduleSkillMarkdownFilename(moduleId)}`
}
