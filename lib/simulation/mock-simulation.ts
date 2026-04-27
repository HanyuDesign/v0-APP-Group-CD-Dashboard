import type {
  SimulationInput,
  SimulationResult,
  WoodchipOutcome,
  PlayerCapacityChange,
  ExporterAllocation,
  SegmentOutcome,
  PlayerMarketOutcome,
  PlayerFinancialOutcome,
  ProjectIRR,
  APPSystemPL,
  UtilizationLevel,
  PriceLevel,
} from '@/lib/types/war-game'
import { PLAYERS, IRR_HURDLE } from '@/lib/data/initial-data'

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 计算木片市场结果
function calculateWoodchipOutcome(input: SimulationInput): WoodchipOutcome {
  const { chinaLoggingPolicy, vietnamExportPolicy, vietnamExportPrice } = input.forestry
  
  let availability: UtilizationLevel = 'medium'
  let priceLevel: PriceLevel = 'medium'
  let domesticSupply = 100
  let vietnamImport = 30
  
  // 中国伐木政策影响
  if (chinaLoggingPolicy === 'tight') {
    domesticSupply = 70
    priceLevel = 'high'
  } else if (chinaLoggingPolicy === 'relaxed') {
    domesticSupply = 130
    priceLevel = 'low'
  }
  
  // 越南出口政策影响
  if (vietnamExportPolicy === 'restricted') {
    vietnamImport = 15
    availability = 'low'
  } else if (vietnamExportPolicy === 'expanded') {
    vietnamImport = 45
    availability = 'high'
  }
  
  // 价格调整
  if (vietnamExportPrice === 'low') {
    priceLevel = priceLevel === 'high' ? 'medium' : 'low'
  } else if (vietnamExportPrice === 'high') {
    priceLevel = priceLevel === 'low' ? 'medium' : 'high'
  }
  
  return { availability, priceLevel, domesticSupply, vietnamImport }
}

// AI模拟竞争对手响应
function simulateCompetitorChanges(input: SimulationInput): PlayerCapacityChange[] {
  const appTotalNewPulp = input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  const changes: PlayerCapacityChange[] = []
  
  // Sun Paper 响应
  if (appTotalNewPulp > 300) {
    changes.push({
      playerId: 'sun-paper',
      pulpChange: -50,
      boardChange: 0,
      tissueChange: 0,
      action: 'delay',
      reasoning: 'APP大规模扩产导致市场过剩预期，延迟新产能投放',
    })
  } else if (appTotalNewPulp > 200) {
    changes.push({
      playerId: 'sun-paper',
      pulpChange: 30,
      boardChange: 20,
      tissueChange: 0,
      action: 'add',
      reasoning: '跟随市场扩张，保持竞争地位',
    })
  } else {
    changes.push({
      playerId: 'sun-paper',
      pulpChange: 60,
      boardChange: 40,
      tissueChange: 20,
      action: 'add',
      reasoning: 'APP扩产保守，加速自身扩张抢占份额',
    })
  }
  
  // Chenming 响应
  if (appTotalNewPulp > 250) {
    changes.push({
      playerId: 'chenming',
      pulpChange: -30,
      boardChange: 0,
      tissueChange: 0,
      action: 'delay',
      reasoning: '市场竞争加剧，暂缓浆产能项目',
    })
  } else {
    changes.push({
      playerId: 'chenming',
      pulpChange: 40,
      boardChange: 30,
      tissueChange: 15,
      action: 'add',
      reasoning: '维持既定扩产计划',
    })
  }
  
  // Liansheng 响应
  changes.push({
    playerId: 'liansheng',
    pulpChange: appTotalNewPulp > 300 ? -20 : 25,
    boardChange: 15,
    tissueChange: 10,
    action: appTotalNewPulp > 300 ? 'delay' : 'add',
    reasoning: appTotalNewPulp > 300 ? '规避过剩风险' : '稳步扩张',
  })
  
  // 其他企业
  changes.push({
    playerId: 'others-china',
    pulpChange: appTotalNewPulp > 300 ? -40 : 20,
    boardChange: 10,
    tissueChange: 20,
    action: appTotalNewPulp > 300 ? 'delay' : 'add',
    reasoning: '跟随市场趋势',
  })
  
  return changes
}

// AI模拟出口商响应
function simulateExporterAllocations(input: SimulationInput, woodchip: WoodchipOutcome): ExporterAllocation[] {
  const appTotalNewPulp = input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  
  // Suzano 分配
  let suzanoChinaShare = 0.35 // 基准35%出口到中国
  if (appTotalNewPulp > 300) {
    suzanoChinaShare = 0.25 // APP大扩产，减少中国出口
  } else if (appTotalNewPulp < 150) {
    suzanoChinaShare = 0.45 // APP扩产保守，增加中国出口
  }
  
  if (woodchip.priceLevel === 'high') {
    suzanoChinaShare += 0.05 // 木片价高，浆价也高，增加出口
  }
  
  // APRIL 分配
  let aprilChinaShare = 0.6 // 基准60%出口到中国
  if (appTotalNewPulp > 250) {
    aprilChinaShare = 0.5
  }
  
  const suzano = PLAYERS.find(p => p.id === 'suzano')!
  const april = PLAYERS.find(p => p.id === 'april')!
  
  return [
    {
      playerId: 'suzano',
      chinaVolume: Math.round(suzano.pulpCapacity * suzanoChinaShare),
      otherRegionsVolume: Math.round(suzano.pulpCapacity * (1 - suzanoChinaShare)),
      chinaShare: suzanoChinaShare,
      reasoning: appTotalNewPulp > 300 
        ? '中国市场过剩预期，转向其他高价地区' 
        : '中国需求稳定，维持出口份额',
    },
    {
      playerId: 'april',
      chinaVolume: Math.round(april.pulpCapacity * aprilChinaShare),
      otherRegionsVolume: Math.round(april.pulpCapacity * (1 - aprilChinaShare)),
      chinaShare: aprilChinaShare,
      reasoning: '根据中国市场竞争态势调整配额',
    },
  ]
}

// 计算细分市场结果
function calculateSegmentOutcomes(
  input: SimulationInput, 
  competitorChanges: PlayerCapacityChange[]
): SegmentOutcome[] {
  const { guangxi, jiangsuFujian } = input.appCapacity
  const { paperDemand, boardDemand, tissueDemand } = input.downstream
  
  // 需求倍数
  const demandMultiplier = { low: 0.85, base: 1, high: 1.15 }
  
  // 计算总产能变化
  let totalBoardChange = 0
  let totalTissueChange = 0
  
  competitorChanges.forEach(change => {
    totalBoardChange += change.boardChange
    totalTissueChange += change.tissueChange
  })
  
  // APP新增产能
  const appNewBoard = (guangxi.includeBoard ? guangxi.boardCapacity : 0) + 
                      (jiangsuFujian.includeBoard ? jiangsuFujian.boardCapacity : 0)
  const appNewTissue = (guangxi.includeTissue ? guangxi.tissueCapacity : 0) + 
                       (jiangsuFujian.includeTissue ? jiangsuFujian.tissueCapacity : 0)
  
  // 基准市场数据
  const baseMarket = {
    paper: { capacity: 900, demand: 750 },
    board: { capacity: 730, demand: 680 },
    tissue: { capacity: 580, demand: 520 },
  }
  
  // 纸张 - 收缩市场
  const paperCapacity = baseMarket.paper.capacity - 30 // 持续关停
  const paperDemandValue = baseMarket.paper.demand * demandMultiplier[paperDemand] * 0.97 // 需求下降
  const paperUtilization = (paperDemandValue / paperCapacity) * 100
  
  // 包装纸板
  const boardCapacity = baseMarket.board.capacity + appNewBoard + totalBoardChange
  const boardDemandValue = baseMarket.board.demand * demandMultiplier[boardDemand]
  const boardUtilization = (boardDemandValue / boardCapacity) * 100
  
  // 生活用纸
  const tissueCapacity = baseMarket.tissue.capacity + appNewTissue + totalTissueChange
  const tissueDemandValue = baseMarket.tissue.demand * demandMultiplier[tissueDemand]
  const tissueUtilization = (tissueDemandValue / tissueCapacity) * 100
  
  const getMarginPressure = (utilization: number): UtilizationLevel => {
    if (utilization >= 90) return 'high'
    if (utilization >= 80) return 'medium'
    return 'low'
  }
  
  return [
    {
      segment: 'paper',
      totalCapacity: paperCapacity,
      totalDemand: paperDemandValue,
      utilization: paperUtilization,
      marginPressure: getMarginPressure(paperUtilization),
      supplyDemandBalance: paperCapacity - paperDemandValue,
    },
    {
      segment: 'board',
      totalCapacity: boardCapacity,
      totalDemand: boardDemandValue,
      utilization: boardUtilization,
      marginPressure: getMarginPressure(boardUtilization),
      supplyDemandBalance: boardCapacity - boardDemandValue,
    },
    {
      segment: 'tissue',
      totalCapacity: tissueCapacity,
      totalDemand: tissueDemandValue,
      utilization: tissueUtilization,
      marginPressure: getMarginPressure(tissueUtilization),
      supplyDemandBalance: tissueCapacity - tissueDemandValue,
    },
  ]
}

// 计算玩家市场结果
function calculatePlayerMarketOutcomes(
  input: SimulationInput,
  competitorChanges: PlayerCapacityChange[],
  exporterAllocations: ExporterAllocation[]
): PlayerMarketOutcome[] {
  const outcomes: PlayerMarketOutcome[] = []
  const { guangxi, jiangsuFujian } = input.appCapacity
  
  // 计算总浆产能（用于市场份额）
  let totalPulpCapacity = 0
  
  PLAYERS.forEach(player => {
    let pulpCapacity = player.pulpCapacity
    let downstreamCapacity = player.boardCapacity + player.tissueCapacity
    
    // APP中国新增产能
    if (player.id === 'app-china') {
      pulpCapacity += guangxi.pulpCapacity + jiangsuFujian.pulpCapacity
      if (guangxi.includeBoard) downstreamCapacity += guangxi.boardCapacity
      if (jiangsuFujian.includeBoard) downstreamCapacity += jiangsuFujian.boardCapacity
      if (guangxi.includeTissue) downstreamCapacity += guangxi.tissueCapacity
      if (jiangsuFujian.includeTissue) downstreamCapacity += jiangsuFujian.tissueCapacity
    }
    
    // 竞争对手产能变化
    const change = competitorChanges.find(c => c.playerId === player.id)
    if (change) {
      pulpCapacity += change.pulpChange
      downstreamCapacity += change.boardChange + change.tissueChange
    }
    
    // 出口商特殊处理
    const allocation = exporterAllocations.find(a => a.playerId === player.id)
    if (allocation) {
      pulpCapacity = allocation.chinaVolume // 只算中国出口量
    }
    
    totalPulpCapacity += pulpCapacity
    
    outcomes.push({
      playerId: player.id,
      pulpCapacity,
      pulpVolume: Math.round(pulpCapacity * 0.88), // 88%利用率
      pulpUtilization: 88,
      pulpMarketShare: 0, // 后续计算
      downstreamCapacity,
      downstreamVolume: Math.round(downstreamCapacity * 0.85),
      downstreamUtilization: 85,
      downstreamMarketShare: 0,
    })
  })
  
  // 计算市场份额
  outcomes.forEach(outcome => {
    outcome.pulpMarketShare = (outcome.pulpCapacity / totalPulpCapacity) * 100
  })
  
  return outcomes
}

// 计算玩家财务结果
function calculatePlayerFinancials(
  input: SimulationInput,
  playerMarketOutcomes: PlayerMarketOutcome[],
  woodchip: WoodchipOutcome
): PlayerFinancialOutcome[] {
  const { guangxi, jiangsuFujian } = input.appCapacity
  const appTotalNewPulp = guangxi.pulpCapacity + jiangsuFujian.pulpCapacity
  
  // 价格/成本影响
  const woodchipCostMultiplier = woodchip.priceLevel === 'high' ? 1.15 : woodchip.priceLevel === 'low' ? 0.9 : 1
  const marketPressure = appTotalNewPulp > 300 ? 0.85 : appTotalNewPulp > 200 ? 0.95 : 1.05
  
  return playerMarketOutcomes.map(market => {
    const player = PLAYERS.find(p => p.id === market.playerId)!
    
    // 基准利润率
    let basePulpMargin = player.type === 'app' ? 0.22 : player.type === 'exporter' ? 0.25 : 0.18
    let baseDownstreamMargin = player.type === 'app' ? 0.15 : 0.12
    
    // 调整因素
    const marginAdjustment = marketPressure * (1 / woodchipCostMultiplier)
    basePulpMargin *= marginAdjustment
    baseDownstreamMargin *= marginAdjustment
    
    // 计算指数化财务数据
    const pulpRevenue = market.pulpVolume * 4.5 // 简化的收入指数
    const downstreamRevenue = market.downstreamVolume * 6
    const revenue = pulpRevenue + downstreamRevenue
    
    const pulpProfit = pulpRevenue * basePulpMargin
    const downstreamProfit = downstreamRevenue * baseDownstreamMargin
    const ebitda = pulpProfit + downstreamProfit
    const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0
    
    return {
      playerId: market.playerId,
      revenue: Math.round(revenue),
      ebitda: Math.round(ebitda),
      ebitdaMargin: Math.round(ebitdaMargin * 10) / 10,
      operatingProfit: Math.round(ebitda * 0.7),
      pulpProfit: Math.round(pulpProfit),
      downstreamProfit: Math.round(downstreamProfit),
    }
  })
}

// 计算项目IRR
function calculateProjectIRRs(input: SimulationInput, woodchip: WoodchipOutcome): ProjectIRR[] {
  const { guangxi, jiangsuFujian } = input.appCapacity
  const appTotalNewPulp = guangxi.pulpCapacity + jiangsuFujian.pulpCapacity
  
  // 基准IRR受市场条件影响
  let baseIRR = 15 // 基准15%
  
  // 木片成本影响
  if (woodchip.priceLevel === 'high') baseIRR -= 2
  if (woodchip.priceLevel === 'low') baseIRR += 1.5
  
  // 市场竞争影响
  if (appTotalNewPulp > 300) baseIRR -= 3
  if (appTotalNewPulp > 250) baseIRR -= 1.5
  
  const projects: ProjectIRR[] = []
  
  // 广西项目
  if (guangxi.pulpCapacity > 0) {
    let guangxiIRR = baseIRR
    // 规模效应
    if (guangxi.pulpCapacity >= 200) guangxiIRR += 1.5
    // 下游整合加成
    if (guangxi.includeBoard) guangxiIRR += 1
    if (guangxi.includeTissue) guangxiIRR += 0.5
    // 时间因素
    if (guangxi.startYear <= 2026) guangxiIRR += 0.5
    
    projects.push({
      projectId: 'guangxi',
      projectName: '广西项目',
      irr: Math.round(guangxiIRR * 10) / 10,
      npvIndex: guangxiIRR > IRR_HURDLE ? 1.2 : guangxiIRR > IRR_HURDLE - 2 ? 1.0 : 0.8,
      status: guangxiIRR >= IRR_HURDLE ? 'green' : guangxiIRR >= IRR_HURDLE - 2 ? 'amber' : 'red',
      cashFlows: [-100, -50, 10, 25, 35, 40, 45, 50],
    })
  }
  
  // 江苏/福建项目
  if (jiangsuFujian.pulpCapacity > 0) {
    let jfIRR = baseIRR - 0.5 // 略低于广西（市场竞争更激烈）
    if (jiangsuFujian.pulpCapacity >= 150) jfIRR += 1
    if (jiangsuFujian.includeBoard) jfIRR += 1
    if (jiangsuFujian.includeTissue) jfIRR += 0.5
    if (jiangsuFujian.startYear >= 2028) jfIRR -= 1
    
    projects.push({
      projectId: 'jiangsu-fujian',
      projectName: '江苏/福建项目',
      irr: Math.round(jfIRR * 10) / 10,
      npvIndex: jfIRR > IRR_HURDLE ? 1.15 : jfIRR > IRR_HURDLE - 2 ? 0.95 : 0.75,
      status: jfIRR >= IRR_HURDLE ? 'green' : jfIRR >= IRR_HURDLE - 2 ? 'amber' : 'red',
      cashFlows: [-80, -40, 5, 20, 30, 35, 40, 42],
    })
  }
  
  return projects
}

// 计算APP系统损益
function calculateAPPSystemPL(playerFinancials: PlayerFinancialOutcome[]): APPSystemPL {
  const appChina = playerFinancials.find(p => p.playerId === 'app-china')!
  const appIndonesia = playerFinancials.find(p => p.playerId === 'app-indonesia')!
  
  const chinaProfit = appChina.ebitda
  const indonesiaProfit = appIndonesia.ebitda
  const totalProfit = chinaProfit + indonesiaProfit
  
  return {
    chinaProfit,
    indonesiaProfit,
    totalProfit,
    chinaPulpProfit: appChina.pulpProfit,
    chinaDownstreamProfit: appChina.downstreamProfit,
    indonesiaPulpProfit: appIndonesia.pulpProfit,
    indonesiaDownstreamProfit: appIndonesia.downstreamProfit,
    chinaShare: totalProfit > 0 ? (chinaProfit / totalProfit) * 100 : 0,
  }
}

// 主模拟函数
export async function runSimulation(input: SimulationInput): Promise<SimulationResult> {
  // 模拟处理时间
  await delay(1500)
  
  // 1. 计算木片市场
  const woodchip = calculateWoodchipOutcome(input)
  
  // 2. AI模拟竞争对手响应
  const competitorChanges = simulateCompetitorChanges(input)
  
  // 3. AI模拟出口商响应
  const exporterAllocations = simulateExporterAllocations(input, woodchip)
  
  // 4. 计算细分市场结果
  const segmentOutcomes = calculateSegmentOutcomes(input, competitorChanges)
  
  // 5. 计算玩家市场结果
  const playerMarketOutcomes = calculatePlayerMarketOutcomes(input, competitorChanges, exporterAllocations)
  
  // 6. 计算玩家财务结果
  const playerFinancials = calculatePlayerFinancials(input, playerMarketOutcomes, woodchip)
  
  // 7. 计算项目IRR
  const projectIRRs = calculateProjectIRRs(input, woodchip)
  
  // 8. 计算APP系统损益
  const appSystemPL = calculateAPPSystemPL(playerFinancials)
  
  return {
    id: `sim-${Date.now()}`,
    timestamp: new Date(),
    input,
    woodchip,
    competitorChanges,
    exporterAllocations,
    segmentOutcomes,
    playerMarketOutcomes,
    playerFinancials,
    projectIRRs,
    appSystemPL,
  }
}
