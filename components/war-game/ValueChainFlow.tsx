'use client'

import { ForestryModule } from './modules/ForestryModule'
import { PulpModule } from './modules/PulpModule'
import { DownstreamModule } from './modules/DownstreamModule'
import { ArrowRight } from 'lucide-react'
import type { 
  SimulationInput, 
  SimulationResult,
  ForestrySettings,
  APPCapacitySettings,
  DownstreamSettings,
} from '@/lib/types/war-game'

interface ValueChainFlowProps {
  input: SimulationInput
  onInputChange: (input: SimulationInput) => void
  result: SimulationResult | null
}

export function ValueChainFlow({ input, onInputChange, result }: ValueChainFlowProps) {
  const handleForestryChange = (forestry: ForestrySettings) => {
    onInputChange({ ...input, forestry })
  }

  const handleAppCapacityChange = (appCapacity: APPCapacitySettings) => {
    onInputChange({ ...input, appCapacity })
  }

  const handleDownstreamChange = (downstream: DownstreamSettings) => {
    onInputChange({ ...input, downstream })
  }

  return (
    <div className="flex items-stretch gap-3">
      {/* Forestry & Woodchips - 2 parts */}
      <div className="flex-[2] min-w-0">
        <ForestryModule
          settings={input.forestry}
          onChange={handleForestryChange}
          woodchipAvailability={result?.woodchip.availability}
          woodchipPrice={result?.woodchip.priceLevel}
        />
      </div>

      {/* Arrow */}
      <div className="flex flex-shrink-0 items-center">
        <div className="flex flex-col items-center gap-1">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground whitespace-nowrap">Woodchip</span>
        </div>
      </div>

      {/* Pulp Capacity - 3 parts */}
      <div className="flex-[3] min-w-0">
        <PulpModule
          settings={input.appCapacity}
          onChange={handleAppCapacityChange}
          competitorChanges={result?.competitorChanges}
        />
      </div>

      {/* Arrow */}
      <div className="flex flex-shrink-0 items-center">
        <div className="flex flex-col items-center gap-1">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground whitespace-nowrap">Pulp</span>
        </div>
      </div>

      {/* Downstream Markets - 2 parts */}
      <div className="flex-[2] min-w-0">
        <DownstreamModule
          settings={input.downstream}
          onChange={handleDownstreamChange}
        />
      </div>
    </div>
  )
}
