'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Trees, Factory, Package, FileText } from 'lucide-react'
import { ValueChainInsights } from './ValueChainInsights'
import { ForestryDetails } from './ForestryDetails'
import { PulpCapacityDetails, PulpExportReallocation } from './PulpCapacityDetails'
import { DownstreamDetails } from './DownstreamDetails'
import { MarketResults } from './MarketResults'
import { FinancialResults } from './FinancialResults'
import { MarketEvolutionSection } from './MarketEvolutionSection'
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
    { id: 'executive-outcome', label: 'Executive Outcome' },
    { id: 'market-evolution', label: 'Market Evolution' },
    { id: 'pulp-app-position', label: 'APP Strategic Position' },
    { id: 'pulp-competitor-dynamics', label: 'Competitor Dynamics' },
    { id: 'detailed-tables', label: 'Detailed Tables' },
  ],
  downstream: [
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
  onSectionClick,
  isSticky
}: { 
  activeStage: ValueChainStage
  activeSection: string
  onSectionClick: (sectionId: string) => void
  isSticky: boolean
}) {
  const navItems = NAV_ITEMS[activeStage]
  
  const getStageColor = () => {
    switch (activeStage) {
      case 'forestry': return { 
        bg: 'bg-green-50', 
        border: 'border-green-200', 
        active: 'bg-green-600 text-white shadow-sm', 
        inactive: 'text-foreground/80 hover:bg-green-100 border border-transparent hover:border-green-300' 
      }
      case 'pulp': return { 
        bg: 'bg-blue-50', 
        border: 'border-blue-200', 
        active: 'bg-blue-600 text-white shadow-sm', 
        inactive: 'text-foreground/80 hover:bg-blue-100 border border-transparent hover:border-blue-300' 
      }
      case 'downstream': return { 
        bg: 'bg-purple-50', 
        border: 'border-purple-200', 
        active: 'bg-purple-600 text-white shadow-sm', 
        inactive: 'text-foreground/80 hover:bg-purple-100 border border-transparent hover:border-purple-300' 
      }
    }
  }
  
  const colors = getStageColor()
  
  return (
    <div 
      className={cn(
        'py-3 px-4 rounded-lg border transition-shadow duration-200',
        colors.bg, colors.border,
        // Add shadow when parent is sticky
        isSticky && 'shadow-sm'
      )}
    >
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-base font-medium text-muted-foreground whitespace-nowrap mr-1">Jump to:</span>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionClick(item.id)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-base font-medium transition-all whitespace-nowrap',
              activeSection === item.id
                ? colors.active
                : colors.inactive
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Detailed Tables Appendix — collapsible, low-priority section that groups
// the Market Data tabs and the Global Export Reallocation table beneath the
// strategic narrative. Defaults to closed; the jump-nav target id is on the
// disclosure header so the page can scroll to it directly.
function DetailedTablesAppendix({
  result,
  status,
}: {
  result: SimulationResult
  status: SimulationStatus
}) {
  return (
    <section id="detailed-tables" className="scroll-mt-96 space-y-5 pt-2">
      <div className="flex items-center gap-2 border-t border-border/40 pt-4">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-base font-semibold text-foreground">
          Detailed Market Tables
        </span>
      </div>

      <div className="space-y-6">
        <MarketDataTabs result={result} status={status} id="market-data" />
        <PulpExportReallocation result={result} />
      </div>
    </section>
  )
}

// Market Data Tabs Component – the tab switcher is rendered inside the
// "Player Market Data" card header (Market tab) and the "APP Project IRR"
// card header (Financial tab), keeping the controls in context with the
// data they govern instead of in a separate banner above them.
function MarketDataTabs({ result, status, id }: { result: SimulationResult, status: SimulationStatus, id?: string }) {
  const [activeTab, setActiveTab] = useState<'market' | 'financial'>('market')

  return (
    <div id={id} className={cn('scroll-mt-96', status === 'running' && 'opacity-50')}>
      {activeTab === 'market' ? (
        <MarketResults result={result} activeTab={activeTab} onTabChange={setActiveTab} />
      ) : (
        <FinancialResults result={result} activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  )
}

export function ResultsPanel({ result, status }: ResultsPanelProps) {
  const [activeStage, setActiveStage] = useState<ValueChainStage>('pulp')
  const [activeSection, setActiveSection] = useState<string>('')
  const [isNavSticky, setIsNavSticky] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  
  // Initialize active section when stage changes
  useEffect(() => {
    const firstItem = NAV_ITEMS[activeStage][0]
    if (firstItem) {
      setActiveSection(firstItem.id)
    }
  }, [activeStage])
  
  // Track if nav is sticky and update active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Check if sticky container is active (scrolled past its original position)
      const scrollY = window.scrollY
      // Sticky activates when content scrolls past ~200px
      setIsNavSticky(scrollY > 100)
      
      // Update active section based on scroll position
      const navItems = NAV_ITEMS[activeStage]
      // Total sticky height: header (64) + step nav (44) + strategic insights (~200) + jump nav (~52) + buffer
      const scrollPosition = scrollY + 400
      
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
      // Offset = header (64) + step nav (44) + strategic insights (~200) + jump nav (~52) + padding
      const offset = 380
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
      {/* Sticky Container: Strategic Insights + Detailed Analysis Navigation */}
      <div className="sticky top-[108px] z-40 bg-background pb-3 -mx-6 px-6 pt-3">
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
            <h3 className="text-base font-semibold text-muted-foreground">Detailed Analysis</h3>
            <span className="h-px flex-1 bg-border" />
          </div>
          
          {/* Navigation Bar */}
          <div ref={navRef}>
            <StickyNav 
              activeStage={activeStage} 
              activeSection={activeSection}
              onSectionClick={handleSectionClick}
              isSticky={isNavSticky}
            />
          </div>
        </section>
      </div>

      {/* Detailed Analysis Content */}
      <section>
        <div className={cn('space-y-6', status === 'running' && 'opacity-50')}>
          {activeStage === 'forestry' && (
            <ForestryDetails result={result} />
          )}

          {activeStage === 'pulp' && (
            <>
              {/* 1. Executive Market Outcome + 2. Market Evolution */}
              <MarketEvolutionSection result={result} />
              {/* 3. APP Strategic Position + 4. Competitor Dynamics */}
              <PulpCapacityDetails result={result} />
              {/* 5. Detailed Market Tables (lower-priority appendix, collapsed by default) */}
              <DetailedTablesAppendix result={result} status={status} />
            </>
          )}

          {activeStage === 'downstream' && (
            <DownstreamDetails result={result} />
          )}
        </div>
      </section>
    </div>
  )
}
