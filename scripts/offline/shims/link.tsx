'use client'

/**
 * Offline shim for `next/link`.
 *
 * The offline build is a single HTML file opened from `file://`, so there is no
 * Next.js router and no server to resolve real paths. Routes become hash
 * fragments (`/results` -> `#/results`) which work with no base URL at all —
 * this matters because a `blob:` document (the strictest self-containment test)
 * has an opaque origin and cannot resolve a relative path.
 */

import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react'
import { toHash } from '../router'

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string | { pathname?: string }
  children?: ReactNode
  // Accepted and ignored: Next-only props that have no meaning offline.
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
  shallow?: boolean
  passHref?: boolean
  legacyBehavior?: boolean
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, children, prefetch, replace, scroll, shallow, passHref, legacyBehavior, ...rest },
  ref,
) {
  const path = typeof href === 'string' ? href : (href?.pathname ?? '/')
  return (
    <a ref={ref} href={toHash(path)} {...rest}>
      {children}
    </a>
  )
})

export default Link
