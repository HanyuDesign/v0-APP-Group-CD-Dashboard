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
    <div className="flex items-stretch gap-4">
      {/* 林业与木片 */}
      <div className="w-[320px] flex-shrink-0">
        <ForestryModule
          settings={input.forestry}
          onChange={handleForestryChange}
          woodchipAvailability={result?.woodchip.availability}
          woodchipPrice={result?.woodchip.priceLevel}
        />
      </div>

      {/* 箭头 */}
      <div className="flex flex-shrink-0 items-center">
        <div className="flex flex-col items-center gap-1">
          <ArrowRight className="h-6 w-6 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">木片供应</span>
        </div>
      </div>

      {/* 浆产能 */}
      <div className="min-w-[380px] flex-1">
        <PulpModule
          settings={input.appCapacity}
          onChange={handleAppCapacityChange}
          competitorChanges={result?.competitorChanges}
        />
      </div>

      {/* 箭头 */}
      <div className="flex flex-shrink-0 items-center">
        <div className="flex flex-col items-center gap-1">
          <ArrowRight className="h-6 w-6 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">浆供应</span>
        </div>
      </div>

      {/* 下游市场 */}
      <div className="w-[300px] flex-shrink-0">
        <DownstreamModule
          settings={input.downstream}
          onChange={handleDownstreamChange}
          segmentOutcomes={result?.segmentOutcomes}
        />
      </div>
    </div>
  )
}
