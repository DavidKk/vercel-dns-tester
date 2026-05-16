/**
 * Placeholder while private HOSTS MCP headers load (matches {@link McpHostsInstallSection} layout)
 * @returns Pulsing skeleton for the install section
 */
export function McpInstallSkeleton() {
  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-5 shadow-sm sm:p-6" aria-hidden="true">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="h-3 w-28 animate-pulse rounded bg-app-border" />
          <div className="h-7 w-24 animate-pulse rounded-md bg-app-border" />
        </div>
        <div className="h-40 animate-pulse rounded-md border border-app-border bg-app-subtle" />
        <div className="h-3 w-full animate-pulse rounded bg-app-border" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-app-border pt-5">
        <div className="h-3 w-14 animate-pulse rounded bg-app-border" />
        <div className="h-7 w-20 animate-pulse rounded-md bg-app-border" />
        <div className="h-7 w-24 animate-pulse rounded-md bg-app-border" />
        <div className="h-7 w-24 animate-pulse rounded-md bg-app-border" />
      </div>
    </section>
  )
}
