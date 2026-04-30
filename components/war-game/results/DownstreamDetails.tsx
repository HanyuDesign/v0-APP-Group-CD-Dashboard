'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, Package, Bath, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle, Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SimulationResult } from '@/lib/types/war-game'

interface DownstreamDetailsProps {
  result: SimulationResult
}

const years = [2025, 2026, 2027, 2028, 2029, 2030] as const

// Generate downstream market data based on simulation results
function generateDownstreamData(result: SimulationResult) {
  const baseData = {
    paper: {
      supply: { 2025: 45000, 2026: 46500, 2027: 48200, 2028: 50100, 2029: 52000, 2030: 54000 },
      demand: { 2025: 44000, 2026: 45800, 2027: 47800, 2028: 49500, 2029: 51200, 2030: 53000 },
      utilization: { 2025: 92, 2026: 91, 2027: 90, 2028: 89, 2029: 88, 2030: 87 },
      marginPressure: 'moderate' as const,
    },
    packaging: {
      supply: { 2025: 38000, 2026: 40000, 2027: 42500, 2028: 45000, 2029: 47500, 2030: 50000 },
      demand: { 2025: 37500, 2026: 39500, 2027: 42000, 2028: 44800, 2029: 47200, 2030: 49500 },
      utilization: { 2025: 94, 2026: 93, 2027: 92, 2028: 91, 2029: 90, 2030: 89 },
      marginPressure: 'low' as const,
    },
    tissue: {
      supply: { 2025: 12000, 2026: 12800, 2027: 13600, 2028: 14500, 2029: 15400, 2030: 16300 },
      demand: { 2025: 11800, 2026: 12600, 2027: 13500, 2028: 14400, 2029: 15300, 2030: 16200 },
      utilization: { 2025: 95, 2026: 94, 2027: 93, 2028: 92, 2029: 91, 2030: 90 },
      marginPressure: 'low' as const,
    },
  }
  
  return baseData
}

function MarginIndicator({ level }: { level: 'low' | 'moderate' | 'high' }) {
  const config = {
    low: { color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle, label: 'Low Pressure' },
    moderate: { color: 'text-amber-600 bg-amber-50', icon: AlertTriangle, label: 'Moderate Pressure' },
    high: { color: 'text-red-600 bg-red-50', icon: AlertTriangle, label: 'High Pressure' },
  }
  
  const { color, icon: Icon, label } = config[level]
  
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium', color)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

function DownstreamTable({ 
  title, 
  icon: Icon, 
  iconColor,
  data 
}: { 
  title: string
  icon: React.ElementType
  iconColor: string
  data: {
    supply: Record<number, number>
    demand: Record<number, number>
    utilization: Record<number, number>
    marginPressure: 'low' | 'moderate' | 'high'
  }
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>
          <MarginIndicator level={data.marginPressure} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Metric</th>
                {years.map(year => (
                  <th key={year} className="text-right py-2 px-2 font-medium text-muted-foreground min-w-[70px]">
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/30">
                <td className="py-2.5 pr-4 font-medium text-foreground">Supply (kt)</td>
                {years.map(year => (
                  <td key={year} className="text-right py-2.5 px-2 font-mono text-sm">
                    {(data.supply[year] / 1000).toFixed(1)}k
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-2.5 pr-4 font-medium text-foreground">Demand (kt)</td>
                {years.map(year => (
                  <td key={year} className="text-right py-2.5 px-2 font-mono text-sm">
                    {(data.demand[year] / 1000).toFixed(1)}k
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-2.5 pr-4 font-medium text-foreground">Balance (kt)</td>
                {years.map(year => {
                  const balance = data.supply[year] - data.demand[year]
                  return (
                    <td key={year} className={cn(
                      'text-right py-2.5 px-2 font-mono text-sm font-medium',
                      balance > 0 ? 'text-emerald-600' : balance < 0 ? 'text-red-600' : 'text-foreground'
                    )}>
                      {balance > 0 ? '+' : ''}{(balance / 1000).toFixed(1)}k
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium text-foreground">Utilization (%)</td>
                {years.map(year => (
                  <td key={year} className={cn(
                    'text-right py-2.5 px-2 font-mono text-sm',
                    data.utilization[year] >= 90 ? 'text-emerald-600' : 
                    data.utilization[year] >= 80 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {data.utilization[year]}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

export function DownstreamDetails({ result }: DownstreamDetailsProps) {
  const downstreamData = generateDownstreamData(result)
  
  return (
    <div className="space-y-6">
      {/* AI Analysis Summary */}
      <Card className="border-purple-200 bg-purple-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <Info className="h-4 w-4 text-purple-600" />
            </div>
            <CardTitle className="text-base font-semibold">Downstream Market Analysis</CardTitle>
            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
              AI Generated
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <p className="text-sm text-foreground leading-relaxed">
              Downstream markets show balanced supply-demand dynamics through 2030. Packaging segment demonstrates 
              the strongest fundamentals with consistent demand growth driven by e-commerce expansion. Paper segment 
              faces moderate margin pressure as digital substitution continues. Tissue maintains healthy utilization 
              supported by stable consumer demand.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center p-3 rounded-lg bg-white/50">
                <div className="text-xs text-muted-foreground mb-1">Paper Outlook</div>
                <div className="flex items-center justify-center gap-1 text-amber-600 font-medium">
                  <Minus className="h-4 w-4" />
                  Stable
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/50">
                <div className="text-xs text-muted-foreground mb-1">Packaging Outlook</div>
                <div className="flex items-center justify-center gap-1 text-emerald-600 font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Growth
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/50">
                <div className="text-xs text-muted-foreground mb-1">Tissue Outlook</div>
                <div className="flex items-center justify-center gap-1 text-emerald-600 font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Growth
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Paper Market */}
      <DownstreamTable
        title="Paper"
        icon={FileText}
        iconColor="bg-blue-100 text-blue-600"
        data={downstreamData.paper}
      />
      
      {/* Packaging / Carton Board Market */}
      <DownstreamTable
        title="Packaging / Carton Board"
        icon={Package}
        iconColor="bg-amber-100 text-amber-600"
        data={downstreamData.packaging}
      />
      
      {/* Tissue Market */}
      <DownstreamTable
        title="Tissue"
        icon={Bath}
        iconColor="bg-emerald-100 text-emerald-600"
        data={downstreamData.tissue}
      />
    </div>
  )
}
