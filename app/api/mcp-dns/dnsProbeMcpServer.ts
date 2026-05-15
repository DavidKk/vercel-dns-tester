import { MCP_PROBE_INSTALL_SERVER_KEY } from '@/app/api/mcp/installSnippets'
import { createMCPHttpServer } from '@/initializer/mcp'
import { buildDnsProbeMcpToolsMap } from '@/services/dns/dnsProbeMcpTools'

/** MCP service version for the public DNS probe server */
const MCP_VERSION = '1.0.0'

/** Description returned in MCP initialize / manifest */
const MCP_DESCRIPTION =
  'Public DNS Tester MCP: run the same DoH checks as the web UI (JSON /resolve vs RFC 8484 /dns-query) and optional OPTIONS preflight probe. No authentication.'

const { manifest, execute } = createMCPHttpServer(MCP_PROBE_INSTALL_SERVER_KEY, MCP_VERSION, MCP_DESCRIPTION, buildDnsProbeMcpToolsMap())

export { execute, manifest }
