import { McpInstallPanel } from '@/components/mcp/McpInstallPanel'
import { generate } from '@/components/Meta'
import { checkAccess } from '@/services/auth/access'
import { getRequestOrigin } from '@/utils/get-request-origin'

const { generateMetadata } = generate({
  title: 'MCP Integration',
  description: 'Install the DNS Tester MCP endpoint in Cursor or VS Code so agents can manage custom HOSTS entries via your Gist.',
})

export { generateMetadata }

/**
 * MCP install page — requires login on the server (same as Hosts); install headers still load client-side from `/api/mcp/headers`.
 * @returns Server-rendered install panel without a separate page title block
 */
export default async function McpPage() {
  await checkAccess({ redirectUrl: '/mcp', isApiRouter: false })

  const requestOrigin = await getRequestOrigin()

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto bg-app-subtle px-4 py-6 text-app-text md:px-6">
      <div className="mx-auto w-full max-w-xl">
        <McpInstallPanel requestOrigin={requestOrigin} />
      </div>
    </main>
  )
}
