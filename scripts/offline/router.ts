'use client'

/**
 * Minimal hash router shared by the offline shims and entry point.
 *
 * The app only has two routes and only ever calls `router.push()`, so this is
 * deliberately tiny. Keeping the path<->hash mapping in ONE place means the
 * `next/link` shim, the `next/navigation` shim and the entry point can never
 * disagree about what a route looks like.
 */

import { useEffect, useState } from 'react'

/** Every route the offline build serves. */
export const ROUTES = ['/', '/results'] as const
export type Route = (typeof ROUTES)[number]

/** Document title per route, so the tab title tracks the screen. */
export const ROUTE_TITLES: Record<Route, string> = {
  '/': 'Market Input · APP Strategic War-Gaming Tool',
  '/results': 'Simulation Results · APP Strategic War-Gaming Tool',
}

/** Normalise an app path (`/results`, `/results?x=1`) to a known Route. */
export function toRoute(path: string): Route {
  const clean = '/' + String(path ?? '/').replace(/^[#/]+/, '').split(/[?#]/)[0]
  return (ROUTES as readonly string[]).includes(clean) ? (clean as Route) : '/'
}

/** Convert an app path to the hash form used in the single file. */
export function toHash(path: string): string {
  return '#' + toRoute(path)
}

/** Read the current route out of `location.hash`. */
export function currentRoute(): Route {
  if (typeof window === 'undefined') return '/'
  return toRoute(window.location.hash || '/')
}

/** Imperatively navigate. Mirrors what `router.push` does in the real app. */
export function navigate(path: string): void {
  const next = toHash(path)
  if (window.location.hash === next) {
    // Same-hash assignment fires no `hashchange`, so notify listeners directly.
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    return
  }
  window.location.hash = next
}

/**
 * Subscribe to route changes. Returns the active route and keeps the document
 * title in sync (the real app sets titles via per-route metadata, which does
 * not exist offline).
 */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => currentRoute())

  useEffect(() => {
    const onChange = () => {
      setRoute(currentRoute())
      // Navigating should land at the top of the new screen, exactly as a real
      // Next.js route change does.
      window.scrollTo({ top: 0, behavior: 'auto' })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  useEffect(() => {
    document.title = ROUTE_TITLES[route]
  }, [route])

  return route
}
