import { z } from 'zod'
import { generateMCPManifest } from '@/initializer/mcp/creator'
import { Tool } from '@/initializer/mcp/tool'

describe('generateMCPManifest', () => {
  it('should generate a correct MCP manifest from Map', () => {
    // Create mock tools
    const mockTool1 = new Tool({
      name: 'test_tool_1',
      description: 'Test tool 1 description',
      parameters: z.object({ param1: z.string() }),
      handler: async () => ({ result: 'test1' }),
    })

    const mockTool2 = new Tool({
      name: 'test_tool_2',
      description: 'Test tool 2 description',
      parameters: z.object({ param2: z.number() }),
      handler: async () => ({ result: 'test2' }),
    })

    const tools = new Map([
      ['test_tool_1', mockTool1],
      ['test_tool_2', mockTool2],
    ])

    const manifest = generateMCPManifest('test-service', '1.0.0', 'Test service description', tools)

    // Verify manifest structure
    expect(manifest.name).toBe('test-service')
    expect(manifest.version).toBe('1.0.0')
    expect(manifest.description).toBe('Test service description')
    expect(manifest.tools).toHaveProperty('test_tool_1')
    expect(manifest.tools).toHaveProperty('test_tool_2')

    // Verify tool1 structure
    expect(manifest.tools.test_tool_1.description).toBe('Test tool 1 description')
    expect(manifest.tools.test_tool_1.inputSchema).toBeDefined()

    // Verify tool2 structure
    expect(manifest.tools.test_tool_2.description).toBe('Test tool 2 description')
    expect(manifest.tools.test_tool_2.inputSchema).toBeDefined()
  })

  it('should handle empty tools map', () => {
    const manifest = generateMCPManifest('empty-service', '1.0.0', 'Empty service description', new Map())

    expect(manifest.name).toBe('empty-service')
    expect(manifest.version).toBe('1.0.0')
    expect(manifest.description).toBe('Empty service description')
    expect(Object.keys(manifest.tools)).toHaveLength(0)
  })
})
