import { createMCPHttpServer } from '@/initializer/mcp'
import { version } from '@/package.json'

import batchQueryDNS from './batchQueryDNS'
import queryDNS from './queryDNS'

const name = 'dns_test_service'
const description = 'Provides DNS testing capabilities for validating DNS over HTTPS (DoH) service configuration and functionality'

export const { manifest: GET, execute: POST } = createMCPHttpServer(name, version, description, {
  queryDNS,
  batchQueryDNS,
})
