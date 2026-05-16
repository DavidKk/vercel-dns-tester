import { NextRequest } from 'next/server'

import { moduleSkillMarkdownFilename, moduleSkillResourceUri } from '@/app/api/mcp/skillNaming'
import { GET, POST } from '@/app/api/mcp-dns/route'

describe('MCP DNS probe skill resources', () => {
  const baseUrl = 'http://localhost/api/mcp-dns'
  const context = { params: Promise.resolve({}) }
  const skillUri = moduleSkillResourceUri('mcp')
  const skillName = moduleSkillMarkdownFilename('mcp')

  it('should include SKILL in GET manifest resources', async () => {
    const req = new NextRequest(baseUrl, { method: 'GET' })
    const res = await GET(req, context)

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.result.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uri: skillUri,
          name: skillName,
          mimeType: 'text/markdown',
        }),
      ])
    )
  })

  it('should return SKILL markdown via resources/list and resources/read', async () => {
    const listReq = new NextRequest(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'resources/list' }),
    })
    const listRes = await POST(listReq, context)
    const listData = await listRes.json()
    expect(listData.result.resources.some((r: { uri: string }) => r.uri === skillUri)).toBe(true)

    const readReq = new NextRequest(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'resources/read',
        params: { uri: skillUri },
      }),
    })
    const readRes = await POST(readReq, context)
    const readData = await readRes.json()
    expect(readData.result.contents[0].mimeType).toBe('text/markdown')
    expect(readData.result.contents[0].text).toContain('dns_hosts_read')
    expect(readData.result.contents[0].text).toContain('dns_probe_query')
  })
})
