'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { TreePine, Ship, ArrowRight } from 'lucide-react'
import type { ForestrySettings, PolicyLevel, ExportPolicyLevel, PriceLevel } from '@/lib/types/war-game'
import { POLICY_LABELS } from '@/lib/data/initial-data'

interface ForestryModuleProps {
  settings: ForestrySettings
  onChange: (settings: ForestrySettings) => void
  woodchipAvailability?: 'low' | 'medium' | 'high'
  woodchipPrice?: PriceLevel
}

const policyValues: PolicyLevel[] = ['tight', 'baseline', 'relaxed']
const exportPolicyValues: ExportPolicyLevel[] = ['restricted', 'baseline', 'expanded']
const priceValues: PriceLevel[] = ['low', 'medium', 'high']

export function ForestryModule({
  settings,
  onChange,
  woodchipAvailability,
  woodchipPrice,
}: ForestryModuleProps) {
  const handleChinaPolicyChange = (value: number[]) => {
    onChange({ ...settings, chinaLoggingPolicy: policyValues[value[0]] })
  }

  const handleVietnamPolicyChange = (value: number[]) => {
    onChange({ ...settings, vietnamExportPolicy: exportPolicyValues[value[0]] })
  }

  const handleVietnamPriceChange = (value: number[]) => {
    onChange({ ...settings, vietnamExportPrice: priceValues[value[0]] })
  }

  return (
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TreePine className="h-5 w-5 text-success" />
          Forestry & Woodchips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Map visualization */}
        <div className="relative rounded-lg bg-secondary/30 p-3">
          <div className="flex flex-col gap-3">
            {/* Top row: South China and Vietnam */}
            <div className="grid grid-cols-2 gap-3">
              {/* South China */}
              <div className="rounded-lg border border-border/50 bg-card/50 p-2.5 text-center">
                <TreePine className="mx-auto h-5 w-5 text-success" />
                <p className="mt-1 text-xs font-medium">South China</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Domestic supply</p>
              </div>
              
              {/* Vietnam */}
              <div className="rounded-lg border border-border/50 bg-card/50 p-2.5 text-center">
                <Ship className="mx-auto h-5 w-5 text-chart-2" />
                <p className="mt-1 text-xs font-medium">Vietnam</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Exports (~30%)</p>
              </div>
            </div>
            
            {/* Arrows pointing down */}
            <div className="flex justify-center gap-8">
              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>
            
            {/* Woodchip pool - Simulation Result */}
            <div className="rounded-lg border-2 border-primary/50 bg-primary/10 p-3 text-center">
              <p className="text-sm font-bold text-primary">China Woodchip Pool</p>
              <div className="mt-2 flex flex-col items-center gap-1">
                {woodchipAvailability && (
                  <span className={cn(
                    'text-base font-bold',
                    woodchipAvailability === 'high' && 'text-success',
                    woodchipAvailability === 'medium' && 'text-warning',
                    woodchipAvailability === 'low' && 'text-destructive'
                  )}>
                    {woodchipAvailability === 'high' ? 'Abundant' : woodchipAvailability === 'medium' ? 'Moderate' : 'Tight'}
                  </span>
                )}
                {woodchipPrice && (
                  <span className={cn(
                    'text-sm font-semibold',
                    woodchipPrice === 'low' && 'text-success',
                    woodchipPrice === 'medium' && 'text-warning',
                    woodchipPrice === 'high' && 'text-destructive'
                  )}>
                    Price: {POLICY_LABELS.priceLevel[woodchipPrice]}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Policy controls */}
        <div className="space-y-4">
          {/* China logging policy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">China Logging Policy</Label>
              <span className="text-sm font-medium text-primary">
                {POLICY_LABELS.chinaLoggingPolicy[settings.chinaLoggingPolicy]}
              </span>
            </div>
            <Slider
              value={[policyValues.indexOf(settings.chinaLoggingPolicy)]}
              onValueChange={handleChinaPolicyChange}
              max={2}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Tight</span>
              <span>Baseline</span>
              <span>Relaxed</span>
            </div>
          </div>

          {/* Vietnam export policy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Vietnam Export Policy</Label>
              <span className="text-sm font-medium text-primary">
                {POLICY_LABELS.vietnamExportPolicy[settings.vietnamExportPolicy]}
              </span>
            </div>
            <Slider
              value={[exportPolicyValues.indexOf(settings.vietnamExportPolicy)]}
              onValueChange={handleVietnamPolicyChange}
              max={2}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Restricted</span>
              <span>Baseline</span>
              <span>Expanded</span>
            </div>
          </div>

          {/* Vietnam export price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Vietnam Export Price</Label>
              <span className="text-sm font-medium text-primary">
                {POLICY_LABELS.priceLevel[settings.vietnamExportPrice]}
              </span>
            </div>
            <Slider
              value={[priceValues.indexOf(settings.vietnamExportPrice)]}
              onValueChange={handleVietnamPriceChange}
              max={2}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
