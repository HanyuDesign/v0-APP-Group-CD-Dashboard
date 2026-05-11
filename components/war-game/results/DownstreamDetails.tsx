'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, Package, Bath, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle, BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrafficLight } from '../shared/TrafficLight'
import type { SimulationResult } from '@/lib/types/war-game'
import { PLAYERS } from '@/lib/data/initial-data'

interface DownstreamDetailsProps {
  result: SimulationResult
}

const years = [2026, 2027, 2028, 2029, 2030, 2031] as const

const SEGMENT_CONFIG = {
  paper: {
    label: 'Paper',
    icon: FileText,
    iconColor: 'bg-amber-100 text-amber-600',
    borderColor: 'border-amber-200',
    bgColor: 'bg-amber-50/30',
  },
  board: {
    label: 'Packaging / Carton Board',
    icon: Package,
    iconColor: 'bg-purple-100 text-purple-600',
    borderColor: 'border-purple-200',
    bgColor: 'bg-purple-50/30',
  },
  tissue: {
    label: 'Tissue',
    icon: Bath,
    iconColor: 'bg-blue-100 text-blue-600',
    borderColor: 'border-blue-200',
    bgColor: 'bg-blue-50/30',
  },
}

// Generate downstream market data based on simulation results
function generateDownstreamData(result: SimulationResult) {
  const { segmentOutcomes, input } = result
  
  // Get APP's downstream capacity additions
  const appBoardAdd = 
    (input.appCapacity.guangxi.includeBoard ? input.appCapacity.guangxi.boardCapacity : 0) +
    (input.appCapacity.jiangsuFujian.includeBoard ? input.appCapacity.jiangsuFujian.boardCapacity : 0)
  const appTissueAdd = 
    (input.appCapacity.guangxi.includeTissue ? input.appCapacity.guangxi.tissueCapacity : 0) +
    (input.appCapacity.jiangsuFujian.includeTissue ? input.appCapacity.jiangsuFujian.tissueCapacity : 0)
  
  // Find segment outcomes
  const paperOutcome = segmentOutcomes.find(s => s.segment === 'paper')
  const boardOutcome = segmentOutcomes.find(s => s.segment === 'board')
  const tissueOutcome = segmentOutcomes.find(s => s.segment === 'tissue')
  
  return {
    paper: {
      capacity: { 2026: 4500, 2027: 4650, 2028: 4820, 2029: 5010, 2030: 5200, 2031: 5400 },
      output: { 2026: 4100, 2027: 4230, 2028: 4380, 2029: 4500, 2030: 4620, 2031: 4750 },
      supply: paperOutcome?.supply || 4500,
      demand: paperOutcome?.demand || 4400,
      utilization: paperOutcome?.utilization || 91,
      balance: paperOutcome?.supplyDemandBalance || 100,
      marginPressure: (paperOutcome?.utilization || 91) >= 85 ? 'low' : (paperOutcome?.utilization || 91) >= 75 ? 'moderate' : 'high',
    },
    board: {
      capacity: { 2026: 3800, 2027: 3800 + Math.round(appBoardAdd * 0.2), 2028: 3800 + Math.round(appBoardAdd * 0.5), 2029: 3800 + Math.round(appBoardAdd * 0.8), 2030: 3800 + appBoardAdd, 2031: 3800 + appBoardAdd + 200 },
      output: { 2026: 3550, 2027: 3650, 2028: 3800, 2029: 3950, 2030: 4100, 2031: 4250 },
      supply: boardOutcome?.supply || 3800,
      demand: boardOutcome?.demand || 3750,
      utilization: boardOutcome?.utilization || 93,
      balance: boardOutcome?.supplyDemandBalance || 50,
      marginPressure: (boardOutcome?.utilization || 93) >= 85 ? 'low' : (boardOutcome?.utilization || 93) >= 75 ? 'moderate' : 'high',
    },
    tissue: {
      capacity: { 2026: 1200, 2027: 1200 + Math.round(appTissueAdd * 0.2), 2028: 1200 + Math.round(appTissueAdd * 0.5), 2029: 1200 + Math.round(appTissueAdd * 0.8), 2030: 1200 + appTissueAdd, 2031: 1200 + appTissueAdd + 100 },
      output: { 2026: 1140, 2027: 1200, 2028: 1280, 2029: 1360, 2030: 1440, 2031: 1520 },
      supply: tissueOutcome?.supply || 1200,
      demand: tissueOutcome?.demand || 1180,
      utilization: tissueOutcome?.utilization || 95,
      balance: tissueOutcome?.supplyDemandBalance || 20,
      marginPressure: (tissueOutcome?.utilization || 95) >= 85 ? 'low' : (tissueOutcome?.utilization || 95) >= 75 ? 'moderate' : 'high',
    },
  }
}

function MarginIndicator({ level }: { level: 'low' | 'moderate' | 'high' }) {
  const config = {
    low: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Low Pressure' },
    moderate: { color: 'bg-amber-100 text-amber-700', icon: BarChart3, label: 'Moderate' },
    high: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'High Pressure' },
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
  segmentKey,
  data,
  playerOutcomes,
  input,
}: { 
  segmentKey: 'paper' | 'board' | 'tissue'
  data: {
    capacity: Record<number, number>
    output: Record<number, number>
    supply: number
    demand: number
    utilization: number
    balance: number
    marginPressure: 'low' | 'moderate' | 'high'
  }
  playerOutcomes: SimulationResult['playerMarketOutcomes']
  input: SimulationResult['input']
}) {
  const config = SEGMENT_CONFIG[segmentKey]
  const Icon = config.icon
  
  return (
    <Card className={cn('border-2', config.borderColor, config.bgColor)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', config.iconColor)}>
              <Icon className="h-4 w-4" />
            </div>
            <CardTitle className="text-lg font-semibold">{config.label}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <MarginIndicator level={data.marginPressure} />
            <TrafficLight status={data.utilization >= 85 ? 'green' : data.utilization >= 75 ? 'amber' : 'red'} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Key Metrics Summary */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-2.5 rounded-lg bg-white/70 text-center">
            <div className="text-[10px] text-muted-foreground mb-0.5">Supply</div>
            <div className="text-lg font-bold">{data.supply} kt</div>
          </div>
          <div className="p-2.5 rounded-lg bg-white/70 text-center">
            <div className="text-[10px] text-muted-foreground mb-0.5">Demand</div>
            <div className="text-lg font-bold">{data.demand} kt</div>
          </div>
          <div className="p-2.5 rounded-lg bg-white/70 text-center">
            <div className="text-[10px] text-muted-foreground mb-0.5">Utilization</div>
            <div className={cn(
              'text-lg font-bold',
              data.utilization >= 85 ? 'text-emerald-600' : data.utilization >= 75 ? 'text-amber-600' : 'text-red-600'
            )}>
              {data.utilization.toFixed(1)}%
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-white/70 text-center">
            <div className="text-[10px] text-muted-foreground mb-0.5">Balance</div>
            <div className={cn(
              'text-lg font-bold flex items-center justify-center gap-1',
              data.balance > 20 ? 'text-amber-600' : data.balance < -20 ? 'text-emerald-600' : 'text-foreground'
            )}>
              {data.balance > 0 ? <TrendingUp className="h-4 w-4" /> : data.balance < 0 ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
              {data.balance > 0 ? '+' : ''}{data.balance}
            </div>
          </div>
        </div>

        {/* Capacity & Output Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-36">Metric</th>
                {years.map(year => (
                  <th key={year} className="text-center py-2 px-2 font-medium text-muted-foreground min-w-[70px]">
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/30">
                <td className="py-2.5 pr-4 font-medium text-foreground">Capacity (kt)</td>
                {years.map((year, idx) => {
                  const value = data.capacity[year]
                  const prevValue = idx > 0 ? data.capacity[years[idx - 1]] : value
                  const delta = value - prevValue
                  return (
                    <td key={year} className="text-center py-2.5 px-2">
                      <span className="font-mono">{value}</span>
                      {idx > 0 && delta > 0 && (
                        <span className="text-[10px] text-emerald-600 ml-1">+{delta}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-2.5 pr-4 font-medium text-foreground">Output (kt)</td>
                {years.map(year => (
                  <td key={year} className="text-center py-2.5 px-2 font-mono">
                    {data.output[year]}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium text-foreground">Utilization (%)</td>
                {years.map(year => {
                  const util = Math.round((data.output[year] / data.capacity[year]) * 100)
                  return (
                    <td key={year} className={cn(
                      'text-center py-2.5 px-2 font-mono font-medium',
                      util >= 85 ? 'text-emerald-600' : util >= 75 ? 'text-amber-600' : 'text-red-600'
                    )}>
                      {util}%
                    </td>
                  )
                })}
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
  const { segmentOutcomes, playerMarketOutcomes, input } = result

  return (
    <div className="space-y-4">
      {/* Paper Market */}
      <div id="downstream-paper" className="scroll-mt-96">
        <DownstreamTable
          segmentKey="paper"
          data={downstreamData.paper}
          playerOutcomes={playerMarketOutcomes}
          input={input}
        />
      </div>
      
      {/* Packaging / Carton Board Market */}
      <div id="downstream-board" className="scroll-mt-96">
        <DownstreamTable
          segmentKey="board"
          data={downstreamData.board}
          playerOutcomes={playerMarketOutcomes}
          input={input}
        />
      </div>
      
      {/* Tissue Market */}
      <div id="downstream-tissue" className="scroll-mt-96">
        <DownstreamTable
          segmentKey="tissue"
          data={downstreamData.tissue}
          playerOutcomes={playerMarketOutcomes}
          input={input}
        />
      </div>
    </div>
  )
}
