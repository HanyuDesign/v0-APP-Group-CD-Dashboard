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

// Simulation delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Calculate woodchip market outcome
function calculateWoodchipOutcome(input: SimulationInput): WoodchipOutcome {
  const { chinaLoggingPolicy, vietnamExportPolicy, vietnamExportPrice } = input.forestry
  
  let availability: UtilizationLevel = 'medium'
  let priceLevel: PriceLevel = 'medium'
  let domesticSupply = 100
  let vietnamImport = 30
  
  // China logging policy impact
  if (chinaLoggingPolicy === 'tight') {
    domesticSupply = 70
    priceLevel = 'high'
  } else if (chinaLoggingPolicy === 'relaxed') {
    domesticSupply = 130
    priceLevel = 'low'
  }
  
  // Vietnam export policy impact
  if (vietnamExportPolicy === 'restricted') {
    vietnamImport = 15
    availability = 'low'
  } else if (vietnamExportPolicy === 'expanded') {
    vietnamImport = 45
    availability = 'high'
  }
  
  // Price adjustment
  if (vietnamExportPrice === 'low') {
    priceLevel = priceLevel === 'high' ? 'medium' : 'low'
  } else if (vietnamExportPrice === 'high') {
    priceLevel = priceLevel === 'low' ? 'medium' : 'high'
  }
  
  return { availability, priceLevel, domesticSupply, vietnamImport }
}

// AI simulate competitor responses
function simulateCompetitorChanges(input: SimulationInput): PlayerCapacityChange[] {
  const appTotalNewPulp = input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  const changes: PlayerCapacityChange[] = []
  
  // Sun Paper response
  if (appTotalNewPulp > 300) {
    changes.push({
      playerId: 'sun-paper',
      pulpChange: -50,
      boardChange: 0,
      tissueChange: 0,
      action: 'delay',
      reasoning: 'Large-scale APP expansion leads to expected market oversupply, delaying new capacity',
    })
  } else if (appTotalNewPulp > 200) {
    changes.push({
      playerId: 'sun-paper',
      pulpChange: 30,
      boardChange: 20,
      tissueChange: 0,
      action: 'add',
      reasoning: 'Following market expansion to maintain competitive position',
    })
  } else {
    changes.push({
      playerId: 'sun-paper',
      pulpChange: 60,
      boardChange: 40,
      tissueChange: 20,
      action: 'add',
      reasoning: 'Conservative APP expansion allows accelerated growth to capture market share',
    })
  }
  
  // Chenming response
  if (appTotalNewPulp > 250) {
    changes.push({
      playerId: 'chenming',
      pulpChange: -30,
      boardChange: 0,
      tissueChange: 0,
      action: 'delay',
      reasoning: 'Intensified market competition, postponing pulp capacity projects',
    })
  } else {
    changes.push({
      playerId: 'chenming',
      pulpChange: 40,
      boardChange: 30,
      tissueChange: 15,
      action: 'add',
      reasoning: 'Maintaining planned expansion schedule',
    })
  }
  
  // Liansheng response
  changes.push({
    playerId: 'liansheng',
    pulpChange: appTotalNewPulp > 300 ? -20 : 25,
    boardChange: 15,
    tissueChange: 10,
    action: appTotalNewPulp > 300 ? 'delay' : 'add',
    reasoning: appTotalNewPulp > 300 ? 'Avoiding oversupply risk' : 'Steady expansion',
  })
  
  // Others
  changes.push({
    playerId: 'others-china',
    pulpChange: appTotalNewPulp > 300 ? -40 : 20,
    boardChange: 10,
    tissueChange: 20,
    action: appTotalNewPulp > 300 ? 'delay' : 'add',
    reasoning: 'Following market trends',
  })
  
  return changes
}

// AI simulate exporter responses
function simulateExporterAllocations(input: SimulationInput, woodchip: WoodchipOutcome): ExporterAllocation[] {
  const appTotalNewPulp = input.appCapacity.guangxi.pulpCapacity + input.appCapacity.jiangsuFujian.pulpCapacity
  const allocations: ExporterAllocation[] = []
  
  // Get all exporters
  const exporters = PLAYERS.filter(p => p.type === 'exporter')
  
  exporters.forEach(exporter => {
    let chinaShare = 0.35 // Default baseline
    let reasoning = ''
    
    // LatAm exporters (Suzano, CMPC, Arauco)
    if (exporter.region === 'latam') {
      chinaShare = 0.35 // Baseline 35% exports to China
      
      if (appTotalNewPulp > 300) {
        chinaShare = 0.25 // Large APP expansion, reduce China exports
        reasoning = 'Expected China oversupply from APP expansion, shifting to higher-priced regions (Europe, NA)'
      } else if (appTotalNewPulp < 150) {
        chinaShare = 0.45 // Conservative APP expansion, increase China exports
        reasoning = 'Conservative APP expansion maintains China demand, increasing export share'
      } else {
        reasoning = 'Stable China demand, maintaining balanced regional allocation'
      }
      
      // Woodchip/pulp price impact
      if (woodchip.priceLevel === 'high') {
        chinaShare += 0.05
        reasoning += '. High pulp prices favor China market.'
      }
      
      // Exporter-specific adjustments
      if (exporter.id === 'suzano') {
        // Suzano is the largest, most diversified
        chinaShare = Math.min(chinaShare, 0.4)
      } else if (exporter.id === 'cmpc') {
        // CMPC has strong Europe ties
        chinaShare -= 0.05
        reasoning = reasoning.replace('China demand', 'China demand (CMPC prioritizes Europe)')
      } else if (exporter.id === 'arauco') {
        // Arauco has US focus
        chinaShare -= 0.03
      }
    }
    
    // Indonesia exporter (APRIL)
    if (exporter.region === 'indonesia') {
      chinaShare = 0.6 // Baseline 60% exports to China (proximity)
      
      if (appTotalNewPulp > 250) {
        chinaShare = 0.5
        reasoning = 'Increased competition from APP China, diversifying to other Asian markets'
      } else {
        reasoning = 'Maintaining strong China focus due to proximity and logistics advantages'
      }
    }
    
    allocations.push({
      playerId: exporter.id,
      chinaVolume: Math.round(exporter.pulpCapacity * chinaShare),
      otherRegionsVolume: Math.round(exporter.pulpCapacity * (1 - chinaShare)),
      chinaShare,
      reasoning,
    })
  })
  
  return allocations
}

// Calculate segment outcomes
function calculateSegmentOutcomes(
  input: SimulationInput, 
  competitorChanges: PlayerCapacityChange[]
): SegmentOutcome[] {
  const { guangxi, jiangsuFujian } = input.appCapacity
  const { paperDemand, boardDemand, tissueDemand } = input.downstream
  
  // Demand multiplier
  const demandMultiplier = { low: 0.85, base: 1, high: 1.15 }
  
  // Calculate total capacity changes
  let totalBoardChange = 0
  let totalTissueChange = 0
  
  competitorChanges.forEach(change => {
    totalBoardChange += change.boardChange
    totalTissueChange += change.tissueChange
  })
  
  // APP new capacity
  const appNewBoard = (guangxi.includeBoard ? guangxi.boardCapacity : 0) + 
                      (jiangsuFujian.includeBoard ? jiangsuFujian.boardCapacity : 0)
  const appNewTissue = (guangxi.includeTissue ? guangxi.tissueCapacity : 0) + 
                       (jiangsuFujian.includeTissue ? jiangsuFujian.tissueCapacity : 0)
  
  // Base market data
  const baseMarket = {
    paper: { capacity: 900, demand: 750 },
    board: { capacity: 730, demand: 680 },
    tissue: { capacity: 580, demand: 520 },
  }
  
  // Paper - shrinking market
  const paperCapacity = baseMarket.paper.capacity - 30 // Ongoing closures
  const paperDemandValue = baseMarket.paper.demand * demandMultiplier[paperDemand] * 0.97 // Declining demand
  const paperUtilization = (paperDemandValue / paperCapacity) * 100
  
  // Packaging / Cartonboard
  const boardCapacity = baseMarket.board.capacity + appNewBoard + totalBoardChange
  const boardDemandValue = baseMarket.board.demand * demandMultiplier[boardDemand]
  const boardUtilization = (boardDemandValue / boardCapacity) * 100
  
  // Tissue
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

// Calculate player market outcomes
function calculatePlayerMarketOutcomes(
  input: SimulationInput,
  competitorChanges: PlayerCapacityChange[],
  exporterAllocations: ExporterAllocation[]
): PlayerMarketOutcome[] {
  const outcomes: PlayerMarketOutcome[] = []
  const { guangxi, jiangsuFujian } = input.appCapacity
  
  // Calculate total pulp capacity (for market share)
  let totalPulpCapacity = 0
  
  PLAYERS.forEach(player => {
    let pulpCapacity = player.pulpCapacity
    let downstreamCapacity = player.boardCapacity + player.tissueCapacity
    
    // APP China new capacity
    if (player.id === 'app-china') {
      pulpCapacity += guangxi.pulpCapacity + jiangsuFujian.pulpCapacity
      if (guangxi.includeBoard) downstreamCapacity += guangxi.boardCapacity
      if (jiangsuFujian.includeBoard) downstreamCapacity += jiangsuFujian.boardCapacity
      if (guangxi.includeTissue) downstreamCapacity += guangxi.tissueCapacity
      if (jiangsuFujian.includeTissue) downstreamCapacity += jiangsuFujian.tissueCapacity
    }
    
    // Competitor capacity changes
    const change = competitorChanges.find(c => c.playerId === player.id)
    if (change) {
      pulpCapacity += change.pulpChange
      downstreamCapacity += change.boardChange + change.tissueChange
    }
    
    // Exporter special handling
    const allocation = exporterAllocations.find(a => a.playerId === player.id)
    if (allocation) {
      pulpCapacity = allocation.chinaVolume // Only count China exports
    }
    
    totalPulpCapacity += pulpCapacity
    
    outcomes.push({
      playerId: player.id,
      pulpCapacity,
      pulpVolume: Math.round(pulpCapacity * 0.88), // 88% utilization
      pulpUtilization: 88,
      pulpMarketShare: 0, // Calculate later
      downstreamCapacity,
      downstreamVolume: Math.round(downstreamCapacity * 0.85),
      downstreamUtilization: 85,
      downstreamMarketShare: 0,
    })
  })
  
  // Calculate market share
  outcomes.forEach(outcome => {
    outcome.pulpMarketShare = (outcome.pulpCapacity / totalPulpCapacity) * 100
  })
  
  return outcomes
}

// Calculate player financials
function calculatePlayerFinancials(
  input: SimulationInput,
  playerMarketOutcomes: PlayerMarketOutcome[],
  woodchip: WoodchipOutcome
): PlayerFinancialOutcome[] {
  const { guangxi, jiangsuFujian } = input.appCapacity
  const appTotalNewPulp = guangxi.pulpCapacity + jiangsuFujian.pulpCapacity
  
  // Price/cost impact
  const woodchipCostMultiplier = woodchip.priceLevel === 'high' ? 1.15 : woodchip.priceLevel === 'low' ? 0.9 : 1
  const marketPressure = appTotalNewPulp > 300 ? 0.85 : appTotalNewPulp > 200 ? 0.95 : 1.05
  
  return playerMarketOutcomes.map(market => {
    const player = PLAYERS.find(p => p.id === market.playerId)!
    
    // Base margin
    let basePulpMargin = player.type === 'app' ? 0.22 : player.type === 'exporter' ? 0.25 : 0.18
    let baseDownstreamMargin = player.type === 'app' ? 0.15 : 0.12
    
    // Adjustment factors
    const marginAdjustment = marketPressure * (1 / woodchipCostMultiplier)
    basePulpMargin *= marginAdjustment
    baseDownstreamMargin *= marginAdjustment
    
    // Calculate indexed financials
    const pulpRevenue = market.pulpVolume * 4.5 // Simplified revenue index
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

// Calculate project IRRs
function calculateProjectIRRs(input: SimulationInput, woodchip: WoodchipOutcome): ProjectIRR[] {
  const { guangxi, jiangsuFujian } = input.appCapacity
  const appTotalNewPulp = guangxi.pulpCapacity + jiangsuFujian.pulpCapacity
  
  // Base IRR affected by market conditions
  let baseIRR = 15 // Baseline 15%
  
  // Woodchip cost impact
  if (woodchip.priceLevel === 'high') baseIRR -= 2
  if (woodchip.priceLevel === 'low') baseIRR += 1.5
  
  // Market competition impact
  if (appTotalNewPulp > 300) baseIRR -= 3
  if (appTotalNewPulp > 250) baseIRR -= 1.5
  
  const projects: ProjectIRR[] = []
  
  // Guangxi project
  if (guangxi.pulpCapacity > 0) {
    let guangxiIRR = baseIRR
    // Scale effect
    if (guangxi.pulpCapacity >= 200) guangxiIRR += 1.5
    // Downstream integration bonus
    if (guangxi.includeBoard) guangxiIRR += 1
    if (guangxi.includeTissue) guangxiIRR += 0.5
    // Timing factor
    if (guangxi.startYear <= 2026) guangxiIRR += 0.5
    
    projects.push({
      projectId: 'guangxi',
      projectName: 'Guangxi Project',
      irr: Math.round(guangxiIRR * 10) / 10,
      npvIndex: guangxiIRR > IRR_HURDLE ? 1.2 : guangxiIRR > IRR_HURDLE - 2 ? 1.0 : 0.8,
      status: guangxiIRR >= IRR_HURDLE ? 'green' : guangxiIRR >= IRR_HURDLE - 2 ? 'amber' : 'red',
      cashFlows: [-100, -50, 10, 25, 35, 40, 45, 50],
    })
  }
  
  // Jiangsu/Fujian project
  if (jiangsuFujian.pulpCapacity > 0) {
    let jfIRR = baseIRR - 0.5 // Slightly lower than Guangxi (more intense market competition)
    if (jiangsuFujian.pulpCapacity >= 150) jfIRR += 1
    if (jiangsuFujian.includeBoard) jfIRR += 1
    if (jiangsuFujian.includeTissue) jfIRR += 0.5
    if (jiangsuFujian.startYear >= 2028) jfIRR -= 1
    
    projects.push({
      projectId: 'jiangsu-fujian',
      projectName: 'Jiangsu/Fujian Project',
      irr: Math.round(jfIRR * 10) / 10,
      npvIndex: jfIRR > IRR_HURDLE ? 1.15 : jfIRR > IRR_HURDLE - 2 ? 0.95 : 0.75,
      status: jfIRR >= IRR_HURDLE ? 'green' : jfIRR >= IRR_HURDLE - 2 ? 'amber' : 'red',
      cashFlows: [-80, -40, 5, 20, 30, 35, 40, 42],
    })
  }
  
  return projects
}

// Calculate APP system P&L
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

// Main simulation function
export async function runSimulation(input: SimulationInput): Promise<SimulationResult> {
  // Simulate processing time
  await delay(1500)
  
  // 1. Calculate woodchip market
  const woodchip = calculateWoodchipOutcome(input)
  
  // 2. AI simulate competitor responses
  const competitorChanges = simulateCompetitorChanges(input)
  
  // 3. AI simulate exporter responses
  const exporterAllocations = simulateExporterAllocations(input, woodchip)
  
  // 4. Calculate segment outcomes
  const segmentOutcomes = calculateSegmentOutcomes(input, competitorChanges)
  
  // 5. Calculate player market outcomes
  const playerMarketOutcomes = calculatePlayerMarketOutcomes(input, competitorChanges, exporterAllocations)
  
  // 6. Calculate player financials
  const playerFinancials = calculatePlayerFinancials(input, playerMarketOutcomes, woodchip)
  
  // 7. Calculate project IRRs
  const projectIRRs = calculateProjectIRRs(input, woodchip)
  
  // 8. Calculate APP system P&L
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
