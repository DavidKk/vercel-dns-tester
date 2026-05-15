/**
 * Route prefixes that should hide global navigation
 * If the current path starts with these prefixes, Nav will not be displayed
 */
export const HIDDEN_ROUTES: string[] = []

export const DEFAULT_NAV = {
  $main: [
    { name: 'Tester', href: '/' },
    { name: 'Custom Hosts', href: '/custom-dns' },
  ],
}
