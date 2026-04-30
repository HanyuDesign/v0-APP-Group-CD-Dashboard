'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Trees, Factory, Package } from 'lucide-react'
import { ValueChainInsights } from './ValueChainInsights'
import { ForestryDetails } from './ForestryDetails'
import { PulpCapacityDetails } from './PulpCapacityDetails'
import { DownstreamDetails } from './DownstreamDetails'
import { MarketResults } from './MarketResults'
import { FinancialResults } from './FinancialResults'
import type { SimulationResult, SimulationStatus } from '@/lib/types/war-game'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

// Value chain stages as clickable tabs
export type ValueChainStage = 'forestry' | 'pulp' | 'downstream'

const VALUE_CHAIN_STAGES = [
  { 
    id: 'forestry' as ValueChainStage, 
    label: 'Forestry & Woodchips', 
    shortLabel: 'Upstream',
    icon: Trees,
    color: 'green',
    description: 'Supply & sourcing dynamics'
  },
  { 
    id: 'pulp' as ValueChainStage, 
    label: 'Pulp Capacity & Competitors', 
    shortLabel: 'Midstream',
    icon: Factory,
    color: 'blue',
    description: 'Capacity decisions & reactions'
  },
  { 
    id: 'downstream' as ValueChainStage, 
    label: 'Downstream Markets', 
    shortLabel: 'Demand',
    icon: Package,
    color: 'purple',
    description: 'Market absorption & margins'
  },
] as const

// Navigation items for each tab
const NAV_ITEMS: Record<ValueChainStage, { id: string; label: string }[]> = {
  forestry: [
    { id: 'forestry-ai-analysis', label: 'AI Forestry Analysis' },
    { id: 'forestry-woodchip-supply', label: 'Woodchip Supply Projection' },
    { id: 'forestry-import-dependency', label: 'Import Dependency Trend' },
    { id: 'forestry-supply-demand', label: 'Supply-Demand Balance' },
  ],
  pulp: [
    { id: 'pulp-value-chain-flow', label: 'Value Chain Impact Flow' },
    { id: 'pulp-app-capacity', label: 'APP Capacity Outcome' },
    { id: 'pulp-competitor-response', label: 'Competitor Response' },
    { id: 'pulp-export-reallocation', label: 'Global Export Reallocation' },
    { id: 'pulp-market-impact', label: 'Market Impact Summary' },
  ],
  downstream: [
    { id: 'downstream-health-overview', label: 'Market Health Overview' },
    { id: 'downstream-paper', label: 'Paper' },
    { id: 'downstream-board', label: 'Packaging / Carton Board' },
    { id: 'downstream-tissue', label: 'Tissue' },
  ],
}

interface ResultsPanelProps {
  result: SimulationResult | null
  status: SimulationStatus
}

// Sticky Navigation Component
function StickyNav({ 
  activeStage, 
  activeSection,
  onSectionClick 
}: { 
  activeStage: ValueChainStage
  activeSection: string
  onSectionClick: (sectionId: string) => void 
}) {
  const navItems = NAV_ITEMS[activeStage]
  
  const getStageColor = () => {
    switch (activeStage) {
      case 'forestry': return { bg: 'bg-green-50', border: 'border-green-200', active: 'bg-green-600 text-white', hover: 'hover:bg-green-100' }
      case 'pulp': return { bg: 'bg-blue-50', border: 'border-blue-200', active: 'bg-blue-600 text-white', hover: 'hover:bg-blue-100' }
      case 'downstream': return { bg: 'bg-purple-50', border: 'border-purple-200', active: 'bg-purple-600 text-white', hover: 'hover:bg-purple-100' }
    }
  }
  
  const colors = getStageColor()
  
  return (
    <div className={cn(
      'py-2.5 px-4 rounded-lg border',
      colors.bg, colors.border
    )}>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap mr-2">Jump to:</span>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionClick(item.id)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap',
              activeSection === item.id
                ? colors.active
                : cn('text-foreground/70', colors.hover)
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Market Data Tabs Component
function MarketDataTabs({ result, status }: { result: SimulationResult, status: SimulationStatus }) {
  const [activeTab, setActiveTab] = useState<'market' | 'financial'>('market')
  
  return (
    <div className="space-y-4">
      {/* Tab Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Market Data</h3>
        <span className="h-px flex-1 bg-border" />
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('market')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
              activeTab === 'market'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Market Performance
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
              activeTab === 'financial'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Financial Results
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className={cn(status === 'running' && 'opacity-50')}>
        {activeTab === 'market' ? (
          <MarketResults result={result} />
        ) : (
          <FinancialResults result={result} />
        )}
      </div>
    </div>
  )
}

export function ResultsPanel({ result, status }: ResultsPanelProps) {
  const [activeStage, setActiveStage] = useState<ValueChainStage>('pulp')
  const [activeSection, setActiveSection] = useState<string>('')
  
  // Initialize active section when stage changes
  useEffect(() => {
    const firstItem = NAV_ITEMS[activeStage][0]
    if (firstItem) {
      setActiveSection(firstItem.id)
    }
  }, [activeStage])
  
  // Scroll tracking to update active section
  useEffect(() => {
    const handleScroll = () => {
      const navItems = NAV_ITEMS[activeStage]
      const scrollPosition = window.scrollY + 300 // Offset for sticky header
      
      for (let i = navItems.length - 1; i >= 0; i--) {
        const element = document.getElementById(navItems[i].id)
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id)
          break
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeStage])
  
  // Handle section click with smooth scroll
  const handleSectionClick = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 280 // Account for sticky header (Strategic Insights + Navigation)
      const elementPosition = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      })
      setActiveSection(sectionId)
    }
  }, [])
  
  if (status === 'idle' && !result) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-secondary/50 p-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Awaiting Simulation
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Set parameters and click &quot;Run Simulation&quot; to view results
          </p>
        </CardContent>
      </Card>
    )
  }

  if (status === 'running') {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Spinner size="lg" />
          <p className="mt-4 text-lg font-medium">
            Running Simulation...
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            AI agents are analyzing competitor responses
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!result) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header: Strategic Insights + Detailed Analysis Navigation */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm pb-4 -mx-4 px-4 pt-4 border-b border-border/50">
        {/* Section 1: Value Chain Insights - Interactive Tabs */}
        <section>
          <ValueChainInsights 
            result={result} 
            activeStage={activeStage}
            onStageChange={setActiveStage}
            stages={VALUE_CHAIN_STAGES}
          />
        </section>

        {/* Section 2: Detailed Analysis Header + Navigation */}
        <section className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Detailed Analysis</h3>
            <span className="h-px flex-1 bg-border" />
          </div>
          
          {/* Navigation Bar */}
          <StickyNav 
            activeStage={activeStage} 
            activeSection={activeSection}
            onSectionClick={handleSectionClick} 
          />
        </section>
      </div>

      {/* Section 2: Detailed Analysis Content */}
      <section>
        {/* Content */}
        <div className={cn('mt-4', status === 'running' && 'opacity-50')}>
          {activeStage === 'forestry' && (
            <ForestryDetails result={result} />
          )}
          
          {activeStage === 'pulp' && (
            <PulpCapacityDetails result={result} />
          )}
          
          {activeStage === 'downstream' && (
            <DownstreamDetails result={result} />
          )}
        </div>
      </section>

      {/* Section 3: Market Data with Tabs */}
      <section>
        <MarketDataTabs result={result} status={status} />
      </section>
    </div>
  )
}
