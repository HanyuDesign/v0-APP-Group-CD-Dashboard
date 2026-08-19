'use client'

/**
 * Offline shim for `next/navigation`.
 *
 * The app only uses `useRouter().push()`, but the whole surface it could
 * plausibly reach is provided so a future edit to a page does not silently
 * break the offline export with an "undefined is not a function".
 */

import { currentRoute, navigate, toRoute } from '../router'

export function useRouter() {
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    refresh: () => window.dispatchEvent(new HashChangeEvent('hashchange')),
    prefetch: () => {},
  }
}

export function usePathname(): string {
  return currentRoute()
}

export function useSearchParams(): URLSearchParams {
  // There is no query string in the hash form, so this is always empty rather
  // than throwing — an empty read is what a page would see on a bare route.
  return new URLSearchParams()
}

export function useParams(): Record<string, string> {
  return {}
}

export function redirect(path: string): void {
  navigate(path)
}

export const notFound = () => {
  navigate(toRoute('/'))
}
