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
          林业与木片
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 可视化地图示意 */}
        <div className="relative rounded-lg bg-secondary/30 p-4">
          <div className="flex items-center justify-between gap-4">
            {/* 华南 */}
            <div className="flex-1 rounded-lg border border-border/50 bg-card/50 p-3 text-center">
              <TreePine className="mx-auto h-6 w-6 text-success" />
              <p className="mt-1 text-sm font-medium">华南林区</p>
              <p className="text-xs text-muted-foreground">国内木片供应</p>
            </div>
            
            {/* 箭头 */}
            <div className="flex flex-col items-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            
            {/* 木片池 */}
            <div className="flex-1 rounded-lg border-2 border-primary/50 bg-primary/10 p-3 text-center">
              <p className="text-sm font-semibold text-primary">中国木片池</p>
              {woodchipAvailability && (
                <p className={cn(
                  'mt-1 text-xs font-medium',
                  woodchipAvailability === 'high' && 'text-success',
                  woodchipAvailability === 'medium' && 'text-warning',
                  woodchipAvailability === 'low' && 'text-destructive'
                )}>
                  可用性: {woodchipAvailability === 'high' ? '充足' : woodchipAvailability === 'medium' ? '中等' : '紧张'}
                </p>
              )}
              {woodchipPrice && (
                <p className="text-xs text-muted-foreground">
                  价格: {POLICY_LABELS.priceLevel[woodchipPrice]}
                </p>
              )}
            </div>
            
            {/* 箭头 */}
            <div className="flex flex-col items-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground rotate-180" />
              <ArrowRight className="h-5 w-5 text-muted-foreground rotate-180" />
            </div>
            
            {/* 越南 */}
            <div className="flex-1 rounded-lg border border-border/50 bg-card/50 p-3 text-center">
              <Ship className="mx-auto h-6 w-6 text-chart-2" />
              <p className="mt-1 text-sm font-medium">越南</p>
              <p className="text-xs text-muted-foreground">木片出口 (~30%)</p>
            </div>
          </div>
        </div>

        {/* 政策控制 */}
        <div className="space-y-4">
          {/* 中国伐木政策 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">中国伐木政策</Label>
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
              <span>紧缩</span>
              <span>基准</span>
              <span>宽松</span>
            </div>
          </div>

          {/* 越南出口政策 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">越南出口政策</Label>
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
              <span>限制</span>
              <span>基准</span>
              <span>扩大</span>
            </div>
          </div>

          {/* 越南出口价格 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">越南出口价格</Label>
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
              <span>低</span>
              <span>中</span>
              <span>高</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
