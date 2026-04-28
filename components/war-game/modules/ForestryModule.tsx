'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { TreePine, Ship, TrendingUp } from 'lucide-react'
import type { ForestrySettings, PolicyLevel, ExportPolicyLevel, RealEstateCondition } from '@/lib/types/war-game'
import { POLICY_LABELS } from '@/lib/data/initial-data'

interface ForestryModuleProps {
  settings: ForestrySettings
  onChange: (settings: ForestrySettings) => void
}

const policyValues: PolicyLevel[] = ['tight', 'baseline', 'relaxed']
const exportPolicyValues: ExportPolicyLevel[] = ['restricted', 'baseline', 'expanded']
const realEstateValues: RealEstateCondition[] = ['downturn', 'stable', 'recovery']

// Calculate China woodchip supply based on inputs
function calculateChinaSupply(loggingPolicy: PolicyLevel, realEstateCondition: RealEstateCondition): { supply: number; level: 'low' | 'medium' | 'high' } {
  // Base supply: 800 kt
  let supply = 800
  
  // Logging policy impact
  if (loggingPolicy === 'tight') supply -= 150
  else if (loggingPolicy === 'relaxed') supply += 150
  
  // Real estate impact (construction waste wood recycling)
  if (realEstateCondition === 'downturn') supply -= 100
  else if (realEstateCondition === 'recovery') supply += 100
  
  // Determine level
  let level: 'low' | 'medium' | 'high' = 'medium'
  if (supply <= 650) level = 'low'
  else if (supply >= 900) level = 'high'
  
  return { supply, level }
}

// Calculate Vietnam woodchip supply based on export policy
function calculateVietnamSupply(exportPolicy: ExportPolicyLevel): { supply: number; level: 'low' | 'medium' | 'high' } {
  // Base supply to China: 400 kt
  let supply = 400
  
  // Export policy impact
  if (exportPolicy === 'restricted') supply -= 120
  else if (exportPolicy === 'expanded') supply += 120
  
  // Determine level
  let level: 'low' | 'medium' | 'high' = 'medium'
  if (supply <= 320) level = 'low'
  else if (supply >= 480) level = 'high'
  
  return { supply, level }
}

export function ForestryModule({
  settings,
  onChange,
}: ForestryModuleProps) {
  const handleChinaPolicyChange = (value: number[]) => {
    onChange({ ...settings, chinaLoggingPolicy: policyValues[value[0]] })
  }

  const handleRealEstateChange = (value: number[]) => {
    onChange({ ...settings, chinaRealEstateCondition: realEstateValues[value[0]] })
  }

  const handleVietnamPolicyChange = (value: number[]) => {
    onChange({ ...settings, vietnamExportPolicy: exportPolicyValues[value[0]] })
  }

  // Calculate outputs
  const chinaOutput = calculateChinaSupply(settings.chinaLoggingPolicy, settings.chinaRealEstateCondition)
  const vietnamOutput = calculateVietnamSupply(settings.vietnamExportPolicy)

  return (
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TreePine className="h-5 w-5 text-success" />
          Forestry & Woodchips
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* China Block */}
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <TreePine className="h-4 w-4 text-success" />
              <h3 className="font-semibold text-sm">China Domestic Supply</h3>
            </div>
            
            <div className="flex-1 space-y-4">
              {/* China Logging Policy Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">China Logging Policy</Label>
                  <span className="text-xs font-medium text-primary">
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
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Tight</span>
                  <span>Baseline</span>
                  <span>Relaxed</span>
                </div>
              </div>

              {/* Real Estate Condition Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Real Estate Market</Label>
                  <span className="text-xs font-medium text-primary">
                    {POLICY_LABELS.chinaRealEstateCondition[settings.chinaRealEstateCondition]}
                  </span>
                </div>
                <Slider
                  value={[realEstateValues.indexOf(settings.chinaRealEstateCondition)]}
                  onValueChange={handleRealEstateChange}
                  max={2}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Downturn</span>
                  <span>Stable</span>
                  <span>Recovery</span>
                </div>
              </div>
            </div>

            {/* China Woodchip Supply - Always at bottom */}
            <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 mt-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">China Supply</span>
              </div>
              <div className="text-right">
                <span className={cn(
                  'text-base font-bold',
                  chinaOutput.level === 'high' && 'text-success',
                  chinaOutput.level === 'medium' && 'text-warning',
                  chinaOutput.level === 'low' && 'text-destructive'
                )}>
                  {chinaOutput.supply} kt
                </span>
                <span className={cn(
                  'ml-1.5 text-[10px] px-1.5 py-0.5 rounded',
                  chinaOutput.level === 'high' && 'bg-success/20 text-success',
                  chinaOutput.level === 'medium' && 'bg-warning/20 text-warning',
                  chinaOutput.level === 'low' && 'bg-destructive/20 text-destructive'
                )}>
                  {chinaOutput.level === 'high' ? 'Abundant' : chinaOutput.level === 'medium' ? 'Moderate' : 'Tight'}
                </span>
              </div>
            </div>
          </div>

          {/* Vietnam Block */}
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Ship className="h-4 w-4 text-chart-2" />
              <h3 className="font-semibold text-sm">Vietnam Exports to China</h3>
            </div>
            
            <div className="flex-1 space-y-4">
              {/* Vietnam Export Policy Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Vietnam Export Policy</Label>
                  <span className="text-xs font-medium text-primary">
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
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Restricted</span>
                  <span>Baseline</span>
                  <span>Expanded</span>
                </div>
              </div>
            </div>

            {/* Vietnam Woodchip Supply - Always at bottom */}
            <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 mt-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Vietnam Supply</span>
              </div>
              <div className="text-right">
                <span className={cn(
                  'text-base font-bold',
                  vietnamOutput.level === 'high' && 'text-success',
                  vietnamOutput.level === 'medium' && 'text-warning',
                  vietnamOutput.level === 'low' && 'text-destructive'
                )}>
                  {vietnamOutput.supply} kt
                </span>
                <span className={cn(
                  'ml-1.5 text-[10px] px-1.5 py-0.5 rounded',
                  vietnamOutput.level === 'high' && 'bg-success/20 text-success',
                  vietnamOutput.level === 'medium' && 'bg-warning/20 text-warning',
                  vietnamOutput.level === 'low' && 'bg-destructive/20 text-destructive'
                )}>
                  {vietnamOutput.level === 'high' ? 'Abundant' : vietnamOutput.level === 'medium' ? 'Moderate' : 'Tight'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
