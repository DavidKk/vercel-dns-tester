import { createMCPHttpServer } from '@/initializer/mcp'
import { buildDnsHostsMcpToolsMap } from '@/services/hosts/dnsHostsMcpTools'

import { MCP_INSTALL_SERVER_KEY } from './installSnippets'
import { getDnsTesterMcpSkillResourceProvider } from './mcpSkillResources'

/** MCP service version exposed to clients */
const MCP_VERSION = '1.0.0'

/** Human-readable MCP description for initialize/manifest */
const MCP_DESCRIPTION =
  'DNS Tester MCP for the GitHub Gist HOSTS file used by the custom DOH resolver: read/write, add/remove lines, existence checks, hostname↔IP lookups, and a tooling summary.'

const { manifest, execute } = createMCPHttpServer(MCP_INSTALL_SERVER_KEY, MCP_VERSION, MCP_DESCRIPTION, buildDnsHostsMcpToolsMap(), getDnsTesterMcpSkillResourceProvider())

export { execute, manifest }
