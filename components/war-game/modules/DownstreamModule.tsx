'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { FileText, Package, Bath, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { TrafficLight } from '../shared/TrafficLight'
import { AIBadge } from '../shared/AIBadge'
import type { DownstreamSettings, DemandScenario, SegmentOutcome } from '@/lib/types/war-game'
import { POLICY_LABELS } from '@/lib/data/initial-data'

interface DownstreamModuleProps {
  settings: DownstreamSettings
  onChange: (settings: DownstreamSettings) => void
  segmentOutcomes?: SegmentOutcome[]
}

const demandOptions: DemandScenario[] = ['low', 'base', 'high']

interface SegmentCardProps {
  title: string
  icon: React.ReactNode
  demandValue: DemandScenario
  onDemandChange: (value: DemandScenario) => void
  outcome?: SegmentOutcome
  description: string
  trend: 'shrinking' | 'growing' | 'stable'
}

function SegmentCard({
  title,
  icon,
  demandValue,
  onDemandChange,
  outcome,
  description,
  trend,
}: SegmentCardProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        {trend === 'shrinking' && <TrendingDown className="h-4 w-4 text-destructive" />}
        {trend === 'growing' && <TrendingUp className="h-4 w-4 text-success" />}
        {trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
      </div>
      
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">需求情景</span>
          <Select
            value={demandValue}
            onValueChange={(v) => onDemandChange(v as DemandScenario)}
          >
            <SelectTrigger className="h-7 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {demandOptions.map(opt => (
                <SelectItem key={opt} value={opt}>
                  {POLICY_LABELS.demandScenario[opt]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {outcome && (
          <>
            {/* 供需平衡 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">供需平衡</span>
                <span className={cn(
                  'font-mono',
                  outcome.supplyDemandBalance > 50 && 'text-destructive',
                  outcome.supplyDemandBalance < -20 && 'text-success',
                  Math.abs(outcome.supplyDemandBalance) <= 50 && 'text-warning'
                )}>
                  {outcome.supplyDemandBalance > 0 ? '过剩 ' : '短缺 '}
                  {Math.abs(Math.round(outcome.supplyDemandBalance))} 万吨
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    outcome.supplyDemandBalance > 50 && 'bg-destructive',
                    outcome.supplyDemandBalance < -20 && 'bg-success',
                    Math.abs(outcome.supplyDemandBalance) <= 50 && 'bg-warning'
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(10, 50 + outcome.supplyDemandBalance / 3))}%`
                  }}
                />
              </div>
            </div>
            
            {/* 产能利用率 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">产能利用率</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs">
                  {Math.round(outcome.utilization)}%
                </span>
                <TrafficLight
                  status={
                    outcome.utilization >= 90 ? 'green' :
                    outcome.utilization >= 80 ? 'amber' : 'red'
                  }
                />
              </div>
            </div>
            
            {/* 利润压力 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">利润压力</span>
              <span className={cn(
                'text-xs font-medium',
                outcome.marginPressure === 'high' && 'text-success',
                outcome.marginPressure === 'medium' && 'text-warning',
                outcome.marginPressure === 'low' && 'text-destructive'
              )}>
                {outcome.marginPressure === 'high' ? '低' : 
                 outcome.marginPressure === 'medium' ? '中' : '高'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function DownstreamModule({
  settings,
  onChange,
  segmentOutcomes,
}: DownstreamModuleProps) {
  const paperOutcome = segmentOutcomes?.find(s => s.segment === 'paper')
  const boardOutcome = segmentOutcomes?.find(s => s.segment === 'board')
  const tissueOutcome = segmentOutcomes?.find(s => s.segment === 'tissue')

  return (
    <Card className="h-full border-border/50 bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-chart-3" />
            下游市场
          </CardTitle>
          <AIBadge size="md" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 纸张 */}
        <SegmentCard
          title="纸张"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          demandValue={settings.paperDemand}
          onDemandChange={(v) => onChange({ ...settings, paperDemand: v })}
          outcome={paperOutcome}
          description="收缩市场，持续关停"
          trend="shrinking"
        />
        
        {/* 包装纸板 */}
        <SegmentCard
          title="包装纸板"
          icon={<Package className="h-4 w-4 text-chart-3" />}
          demandValue={settings.boardDemand}
          onDemandChange={(v) => onChange({ ...settings, boardDemand: v })}
          outcome={boardOutcome}
          description="电商驱动增长"
          trend="growing"
        />
        
        {/* 生活用纸 */}
        <SegmentCard
          title="生活用纸"
          icon={<Bath className="h-4 w-4 text-chart-2" />}
          demandValue={settings.tissueDemand}
          onDemandChange={(v) => onChange({ ...settings, tissueDemand: v })}
          outcome={tissueOutcome}
          description="消费升级带动"
          trend="growing"
        />
        
        {/* 竞争对手响应说明 */}
        <div className="rounded-lg bg-secondary/30 p-2 text-xs text-muted-foreground">
          <p className="flex items-center gap-1">
            <AIBadge size="sm" />
            <span>竞争对手下游产能由AI根据市场经济性和APP动作自动调整</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
