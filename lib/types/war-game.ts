// 战争模拟工具类型定义

// 政策等级
export type PolicyLevel = 'tight' | 'baseline' | 'relaxed'
export type ExportPolicyLevel = 'restricted' | 'baseline' | 'expanded'
export type PriceLevel = 'low' | 'medium' | 'high'
export type DemandScenario = 'low' | 'base' | 'high'
export type UtilizationLevel = 'low' | 'medium' | 'high'
export type RealEstateCondition = 'downturn' | 'stable' | 'recovery'

// 玩家类型
export type PlayerType = 'app' | 'competitor' | 'exporter'
export type PlayerRegion = 'china' | 'indonesia' | 'latam'

// 玩家信息
export interface Player {
  id: string
  name: string
  nameCn: string
  type: PlayerType
  region: PlayerRegion
  isAIDriven: boolean
  color: string
  pulpCapacity: number // 万吨/年
  paperCapacity: number
  boardCapacity: number
  tissueCapacity: number
}

// 林业与木片政策设置
export interface ForestrySettings {
  chinaLoggingPolicy: PolicyLevel
  chinaRealEstateCondition: RealEstateCondition
  vietnamExportPolicy: ExportPolicyLevel
}

// APP产能设置
export interface APPCapacitySettings {
  guangxi: {
    pulpCapacity: number // 万吨/年
    startYear: number
    includeBoard: boolean
    boardCapacity: number
    includeTissue: boolean
    tissueCapacity: number
  }
  jiangsuFujian: {
    pulpCapacity: number
    startYear: number
    includeBoard: boolean
    boardCapacity: number
    includeTissue: boolean
    tissueCapacity: number
  }
}

// 下游需求设置
export interface DownstreamSettings {
  paperDemand: DemandScenario
  boardDemand: DemandScenario
  tissueDemand: DemandScenario
}

// 完整的模拟输入
export interface SimulationInput {
  forestry: ForestrySettings
  appCapacity: APPCapacitySettings
  downstream: DownstreamSettings
}

// 木片市场结果
export interface WoodchipOutcome {
  availability: UtilizationLevel
  priceLevel: PriceLevel
  domesticSupply: number
  vietnamImport: number
}

// 玩家产能变化（AI决策）
export interface PlayerCapacityChange {
  playerId: string
  pulpChange: number
  boardChange: number
  tissueChange: number
  action: 'add' | 'delay' | 'cancel' | 'none'
  reasoning: string
}

// 出口商分配决策
export interface ExporterAllocation {
  playerId: string
  chinaVolume: number
  otherRegionsVolume: number
  chinaShare: number
  reasoning: string
}

// 细分市场结果
export interface SegmentOutcome {
  segment: 'paper' | 'board' | 'tissue'
  totalCapacity: number
  totalDemand: number
  utilization: number
  marginPressure: UtilizationLevel
  supplyDemandBalance: number // 正数为过剩，负数为短缺
}

// 玩家市场结果
export interface PlayerMarketOutcome {
  playerId: string
  pulpCapacity: number
  pulpVolume: number
  pulpUtilization: number
  pulpMarketShare: number
  downstreamCapacity: number
  downstreamVolume: number
  downstreamUtilization: number
  downstreamMarketShare: number
}

// 玩家财务结果
export interface PlayerFinancialOutcome {
  playerId: string
  revenue: number // 指数
  ebitda: number // 指数
  ebitdaMargin: number // 百分比
  operatingProfit: number
  pulpProfit: number
  downstreamProfit: number
}

// APP项目IRR
export interface ProjectIRR {
  projectId: string
  projectName: string
  irr: number // 百分比
  npvIndex: number
  status: 'green' | 'amber' | 'red'
  cashFlows: number[] // 简化的现金流序列
}

// APP系统损益
export interface APPSystemPL {
  chinaProfit: number
  indonesiaProfit: number
  totalProfit: number
  chinaPulpProfit: number
  chinaDownstreamProfit: number
  indonesiaPulpProfit: number
  indonesiaDownstreamProfit: number
  chinaShare: number // 中国利润占比
}

// 完整的模拟结果
export interface SimulationResult {
  id: string
  timestamp: Date
  input: SimulationInput
  
  // 木片市场
  woodchip: WoodchipOutcome
  
  // AI决策
  competitorChanges: PlayerCapacityChange[]
  exporterAllocations: ExporterAllocation[]
  
  // 市场结果
  segmentOutcomes: SegmentOutcome[]
  playerMarketOutcomes: PlayerMarketOutcome[]
  
  // 财务结果
  playerFinancials: PlayerFinancialOutcome[]
  projectIRRs: ProjectIRR[]
  appSystemPL: APPSystemPL
}

// 模拟状态
export type SimulationStatus = 'idle' | 'running' | 'completed' | 'error'

// 应用状态
export interface WarGameState {
  input: SimulationInput
  status: SimulationStatus
  result: SimulationResult | null
  history: SimulationResult[]
}
