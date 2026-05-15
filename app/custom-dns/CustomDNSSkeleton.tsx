/**
 * Skeleton placeholder for the custom HOSTS editor while Gist files load on the client
 * @returns Loading layout matching CustomDNS structure
 */
export function CustomDNSSkeleton() {
  const editorLines = Array.from({ length: 8 })

  return (
    <main className="flex min-h-0 flex-1 bg-app-subtle text-app-text">
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-4 md:px-6 lg:px-8">
        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-app-border bg-app-surface shadow-sm">
          <div className="flex h-full min-h-[320px] flex-col p-4">
            <div className="mb-4 h-4 w-32 animate-pulse rounded bg-app-border" />
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              {editorLines.map((_, index) => (
                <div key={index} className="h-4 animate-pulse rounded bg-app-subtle" style={{ width: `${68 + (index % 4) * 8}%` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2">
          <div className="h-10 w-24 animate-pulse rounded-md bg-app-border" />
          <div className="h-10 w-24 animate-pulse rounded-md bg-app-border" />
        </div>
      </div>
    </main>
  )
}
