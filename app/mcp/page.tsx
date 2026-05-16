import { McpInstallPanel } from '@/components/mcp/McpInstallPanel'
import { generate } from '@/components/Meta'
import { getRequestOrigin } from '@/utils/get-request-origin'

const { generateMetadata } = generate({
  title: 'MCP Integration',
  description: 'Install the public DNS probe MCP without signing in, or sign in to add authenticated HOSTS gist tools for Cursor and VS Code.',
})

export { generateMetadata }

/**
 * MCP install page — public; private HOSTS install snippets load after sign-in via `/api/mcp/headers`.
 * @returns Server-rendered install panel
 */
export default async function McpPage() {
  const requestOrigin = await getRequestOrigin()

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto bg-app-subtle px-4 py-6 text-app-text md:px-6">
      <div className="mx-auto w-full max-w-xl">
        <McpInstallPanel requestOrigin={requestOrigin} />
      </div>
    </main>
  )
}
