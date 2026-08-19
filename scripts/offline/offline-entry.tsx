'use client'

/**
 * Entry point for the single-file offline build.
 *
 * This imports the REAL page components — it is not a re-implementation and not
 * a DOM snapshot. The app carries a large amount of interactive state (the
 * 4-step wizard, per-module inputs, the scroll-synced results navigation), all
 * of which a captured-HTML approach would silently discard and which would then
 * drift from the app on the very next edit. Only the router and the asset
 * strategy differ from the deployed app.
 */

import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'

import { SimulationProvider } from '@/lib/context/SimulationContext'
import InputPage from '@/app/page'
import ResultsPage from '@/app/results/page'
import { useRoute, type Route } from './router'

const SCREENS: Record<Route, ComponentType> = {
  '/': InputPage as ComponentType,
  '/results': ResultsPage as ComponentType,
}

function OfflineApp() {
  const route = useRoute()
  const Screen = SCREENS[route] ?? SCREENS['/']

  return (
    // SimulationProvider sits OUTSIDE the screen switch, mirroring its position
    // in app/layout.tsx. This is load-bearing: the simulation result is produced
    // on the input screen and read on the results screen, so the provider must
    // survive navigation. Only the screen below it remounts.
    <SimulationProvider>
      {/*
        `key` forces a fresh mount per screen so page-level state (e.g. the
        wizard's currentStep) resets on navigation, exactly as it does when
        Next.js swaps route components. Without it React reuses state across
        routes and the input wizard would reopen mid-flow.
      */}
      <Screen key={route} />
    </SimulationProvider>
  )
}

const host = document.getElementById('root')
if (!host) throw new Error('Offline build: #root host element is missing')

createRoot(host).render(
  <StrictMode>
    <OfflineApp />
  </StrictMode>,
)
