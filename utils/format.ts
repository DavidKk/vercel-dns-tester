export function formatProjectName(name: string): string {
  return name
    .replace('vercel-', '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
