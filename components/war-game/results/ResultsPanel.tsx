'use client'

import { useState } from 'react'
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

interface ResultsPanelProps {
  result: SimulationResult | null
  status: SimulationStatus
}

export function ResultsPanel({ result, status }: ResultsPanelProps) {
  const [activeStage, setActiveStage] = useState<ValueChainStage>('pulp')
  
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
      {/* Section 1: Value Chain Insights - Interactive Tabs */}
      <section>
        <ValueChainInsights 
          result={result} 
          activeStage={activeStage}
          onStageChange={setActiveStage}
          stages={VALUE_CHAIN_STAGES}
        />
      </section>

      {/* Section 2: Dynamic Detailed Analysis Based on Selected Stage */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
          <span className="h-px flex-1 bg-border" />
          Detailed Analysis: {VALUE_CHAIN_STAGES.find(s => s.id === activeStage)?.label}
          <span className="h-px flex-1 bg-border" />
        </h3>
        
        <div className={cn(status === 'running' && 'opacity-50')}>
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

      {/* Section 3: Data Tables (shown based on relevance) */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-4">
          <span className="h-px flex-1 bg-border" />
          {activeStage === 'downstream' ? 'Financial Results' : 'Market Data'}
          <span className="h-px flex-1 bg-border" />
        </h3>
        
        <div className={cn(status === 'running' && 'opacity-50')}>
          {activeStage === 'downstream' ? (
            <FinancialResults result={result} />
          ) : (
            <MarketResults result={result} />
          )}
        </div>
      </section>
    </div>
  )
}
