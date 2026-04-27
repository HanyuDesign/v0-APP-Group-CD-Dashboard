'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3, DollarSign, Clock } from 'lucide-react'
import { MarketResults } from './MarketResults'
import { FinancialResults } from './FinancialResults'
import type { SimulationResult, SimulationStatus } from '@/lib/types/war-game'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

interface ResultsPanelProps {
  result: SimulationResult | null
  status: SimulationStatus
}

export function ResultsPanel({ result, status }: ResultsPanelProps) {
  if (status === 'idle' && !result) {
    return (
      <Card className="border-border/50 bg-card/80">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-secondary/50 p-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            等待模拟
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            设置参数后点击"运行模拟"查看结果
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
            正在运行模拟...
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            AI代理正在分析竞争对手响应
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!result) {
    return null
  }

  return (
    <Tabs defaultValue="market" className="w-full">
      <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="market" className="gap-2">
          <BarChart3 className="h-4 w-4" />
          市场结果
        </TabsTrigger>
        <TabsTrigger value="financial" className="gap-2">
          <DollarSign className="h-4 w-4" />
          财务结果
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="market" className={cn(status === 'running' && 'opacity-50')}>
        <MarketResults result={result} />
      </TabsContent>
      
      <TabsContent value="financial" className={cn(status === 'running' && 'opacity-50')}>
        <FinancialResults result={result} />
      </TabsContent>
    </Tabs>
  )
}
