'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { DollarSign, TrendingUp, Building2, Globe } from 'lucide-react'
import { TrafficLight } from '../shared/TrafficLight'
import type { SimulationResult, ProjectIRR, APPSystemPL } from '@/lib/types/war-game'
import { PLAYERS, IRR_HURDLE } from '@/lib/data/initial-data'
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  Area,
  AreaChart,
  CartesianGrid,
} from 'recharts'

interface FinancialResultsProps {
  result: SimulationResult
}

// IRR card component
function IRRCard({ project }: { project: ProjectIRR }) {
  return (
    <Card className={cn(
      'border-border/50 bg-card/80',
      project.status === 'green' && 'border-success/30',
      project.status === 'amber' && 'border-warning/30',
      project.status === 'red' && 'border-destructive/30'
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{project.projectName}</p>
            <p className="mt-1 text-2xl font-bold">
              <span className={cn(
                project.status === 'green' && 'text-success',
                project.status === 'amber' && 'text-warning',
                project.status === 'red' && 'text-destructive'
              )}>
                {project.irr}%
              </span>
              <span className="ml-2 text-sm font-normal text-muted-foreground">IRR</span>
            </p>
          </div>
          <TrafficLight 
            status={project.status} 
            label={project.status === 'green' ? 'Above Hurdle' : project.status === 'amber' ? 'Near Hurdle' : 'Below Hurdle'}
          />
        </div>
        
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Hurdle: {IRR_HURDLE}%</span>
          <span>NPV Index: {project.npvIndex.toFixed(2)}</span>
        </div>
        
        {/* Mini cash flow chart */}
        <div className="mt-3 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={project.cashFlows.map((value, index) => ({ year: index, value }))}>
              <Area
                type="monotone"
                dataKey="value"
                stroke={
                  project.status === 'green' ? 'hsl(var(--success))' :
                  project.status === 'amber' ? 'hsl(var(--warning))' :
                  'hsl(var(--destructive))'
                }
                fill={
                  project.status === 'green' ? 'hsl(var(--success) / 0.2)' :
                  project.status === 'amber' ? 'hsl(var(--warning) / 0.2)' :
                  'hsl(var(--destructive) / 0.2)'
                }
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// APP system P&L component
function SystemPLCard({ systemPL }: { systemPL: APPSystemPL }) {
  const data = [
    {
      name: 'China',
      Pulp: systemPL.chinaPulpProfit,
      Downstream: systemPL.chinaDownstreamProfit,
    },
    {
      name: 'Indonesia',
      Pulp: systemPL.indonesiaPulpProfit,
      Downstream: systemPL.indonesiaDownstreamProfit,
    },
  ]

  const totalData = [
    { name: 'China', value: systemPL.chinaProfit, share: systemPL.chinaShare },
    { name: 'Indonesia', value: systemPL.indonesiaProfit, share: 100 - systemPL.chinaShare },
  ]

  return (
    <Card className="border-primary/30 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4 text-primary" />
          APP System P&L (China + Indonesia)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total profit */}
        <div className="rounded-lg bg-primary/10 p-4 text-center">
          <p className="text-sm text-muted-foreground">Total System Profit Index</p>
          <p className="text-3xl font-bold text-primary">{systemPL.totalProfit}</p>
        </div>

        {/* Stacked bar chart */}
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="Pulp" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Downstream" stackId="a" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Profit share */}
        <div className="grid grid-cols-2 gap-3">
          {totalData.map(item => (
            <div key={item.name} className="rounded-lg border border-border/50 bg-card/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">{item.name} Profit</p>
              <p className="text-lg font-semibold">{item.value}</p>
              <p className="text-xs text-muted-foreground">Share {Math.round(item.share)}%</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function FinancialResults({ result }: FinancialResultsProps) {
  const { playerFinancials, projectIRRs, appSystemPL } = result

  // Prepare EBITDA bar chart data
  const ebitdaData = playerFinancials
    .filter(p => p.ebitda > 0)
    .map(financial => {
      const player = PLAYERS.find(p => p.id === financial.playerId)!
      return {
        name: player.nameCn,
        ebitda: financial.ebitda,
        margin: financial.ebitdaMargin,
        color: player.color,
      }
    })
    .sort((a, b) => b.ebitda - a.ebitda)
    .slice(0, 8)

  return (
    <div className="space-y-4">
      {/* APP Project IRR */}
      {projectIRRs.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-primary" />
            APP Project IRR
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {projectIRRs.map(project => (
              <IRRCard key={project.projectId} project={project} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Player EBITDA comparison */}
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              Player EBITDA Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ebitdaData} layout="vertical" margin={{ left: 70 }}>
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  width={65}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string, props: { payload: { margin: number } }) => [
                    `${value} (Margin: ${props.payload.margin}%)`,
                    'EBITDA'
                  ]}
                />
                <Bar dataKey="ebitda" radius={[0, 4, 4, 0]}>
                  {ebitdaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* APP System P&L */}
        <SystemPLCard systemPL={appSystemPL} />
      </div>

      {/* Player financial details table */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            Player Financial Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="text-xs">Player</TableHead>
                <TableHead className="text-right text-xs">Revenue Index</TableHead>
                <TableHead className="text-right text-xs">EBITDA</TableHead>
                <TableHead className="text-right text-xs">EBITDA Margin</TableHead>
                <TableHead className="text-right text-xs">Pulp Profit</TableHead>
                <TableHead className="text-right text-xs">Downstream Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playerFinancials.map(financial => {
                const player = PLAYERS.find(p => p.id === financial.playerId)!
                return (
                  <TableRow key={financial.playerId} className="border-border/30">
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: player.color }}
                        />
                        <span>{player.nameCn}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {financial.revenue}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {financial.ebitda}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      <span className={cn(
                        financial.ebitdaMargin >= 20 ? 'text-success' :
                        financial.ebitdaMargin >= 15 ? 'text-warning' : 'text-muted-foreground'
                      )}>
                        {financial.ebitdaMargin}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {financial.pulpProfit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {financial.downstreamProfit}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
