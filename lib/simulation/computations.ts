/**
 * Computation Layer for War Game Simulation
 * These functions derive yearly values from user inputs
 */

import type { 
  SimulationInput, 
  ForestrySettings,
  APPCapacitySettings,
  DownstreamSettings,
  YearlyCapacity,
  PolicyLevel,
  ExportPolicyLevel,
  RealEstateCondition,
  PolicyStartYear
} from '@/lib/types/war-game'

const YEARS = [2026, 2027, 2028, 2029, 2030, 2031] as const
type Year = typeof YEARS[number]

// Base supply values for woodchips
const CHINA_BASE_SUPPLY = 750 // kt
const VIETNAM_BASE_SUPPLY = 400 // kt

// Policy impact multipliers
const CHINA_POLICY_IMPACT: Record<PolicyLevel, number> = {
  tight: -150,
  baseline: 0,
  relaxed: 150,
}

const REAL_ESTATE_IMPACT: Record<RealEstateCondition, number> = {
  downturn: 100,
  stable: 0,
  recovery: -100,
}

const VIETNAM_POLICY_IMPACT: Record<ExportPolicyLevel, number> = {
  restricted: -120,
  baseline: 0,
  expanded: 120,
}

export interface YearlyWoodchipSupply {
  year: Year
  chinaSupply: number
  chinaDelta: number
  chinaIsPolicyActive: boolean
  vietnamSupply: number
  vietnamDelta: number
  vietnamIsPolicyActive: boolean
  totalSupply: number
  totalDelta: number
}

/**
 * Calculate woodchip supply for each year based on forestry settings
 */
export function calculateWoodchipSupply(forestry: ForestrySettings): YearlyWoodchipSupply[] {
  const {
    chinaLoggingPolicy,
    chinaLoggingPolicyStartYear,
    chinaRealEstateCondition,
    vietnamExportPolicy,
    vietnamExportPolicyStartYear
  } = forestry

  return YEARS.map(year => {
    // China supply calculation
    const chinaIsPolicyActive = year >= chinaLoggingPolicyStartYear
    let chinaSupply = CHINA_BASE_SUPPLY
    chinaSupply += REAL_ESTATE_IMPACT[chinaRealEstateCondition]
    if (chinaIsPolicyActive) {
      chinaSupply += CHINA_POLICY_IMPACT[chinaLoggingPolicy]
    }
    const chinaDelta = chinaIsPolicyActive ? CHINA_POLICY_IMPACT[chinaLoggingPolicy] : 0

    // Vietnam supply calculation
    const vietnamIsPolicyActive = year >= vietnamExportPolicyStartYear
    let vietnamSupply = VIETNAM_BASE_SUPPLY
    if (vietnamIsPolicyActive) {
      vietnamSupply += VIETNAM_POLICY_IMPACT[vietnamExportPolicy]
    }
    const vietnamDelta = vietnamIsPolicyActive ? VIETNAM_POLICY_IMPACT[vietnamExportPolicy] : 0

    // Total
    const totalSupply = chinaSupply + vietnamSupply
    const totalDelta = chinaDelta + vietnamDelta

    return {
      year,
      chinaSupply,
      chinaDelta,
      chinaIsPolicyActive,
      vietnamSupply,
      vietnamDelta,
      vietnamIsPolicyActive,
      totalSupply,
      totalDelta
    }
  })
}

export interface YearlyPulpCapacity {
  year: Year
  appAdditions: number
  appTotalCapacity: number
}

/**
 * Calculate APP pulp capacity (additions and cumulative totals)
 */
export function calculatePulpCapacity(appCapacity: APPCapacitySettings): YearlyPulpCapacity[] {
  const BASE_CAPACITY = appCapacity.appChina[2026] || 0
  let cumulative = 0

  return YEARS.map((year, index) => {
    const additions = appCapacity.appChina[year] || 0
    
    if (index === 0) {
      cumulative = additions // 2026 is the base
    } else {
      cumulative += additions
    }

    return {
      year,
      appAdditions: additions,
      appTotalCapacity: cumulative
    }
  })
}

export interface YearlyDownstreamCapacity {
  year: Year
  segment: 'paper' | 'board' | 'tissue'
  appAdditions: number
  appTotalCapacity: number
}

/**
 * Calculate downstream capacity for each segment
 */
export function calculateDownstreamCapacity(downstream: DownstreamSettings): {
  paper: YearlyDownstreamCapacity[]
  board: YearlyDownstreamCapacity[]
  tissue: YearlyDownstreamCapacity[]
} {
  const calculateSegment = (
    segment: 'paper' | 'board' | 'tissue',
    yearlyData: YearlyCapacity
  ): YearlyDownstreamCapacity[] => {
    let cumulative = 0

    return YEARS.map((year, index) => {
      const additions = yearlyData[year] || 0
      
      if (index === 0) {
        cumulative = additions
      } else {
        cumulative += additions
      }

      return {
        year,
        segment,
        appAdditions: additions,
        appTotalCapacity: cumulative
      }
    })
  }

  return {
    paper: calculateSegment('paper', downstream.supply.paper.appChina),
    board: calculateSegment('board', downstream.supply.board.appChina),
    tissue: calculateSegment('tissue', downstream.supply.tissue.appChina)
  }
}

/**
 * Helper function to convert additions to cumulative totals
 */
export function additionsToCumulative(additions: YearlyCapacity): YearlyCapacity {
  let cumulative = 0
  const result: YearlyCapacity = { 2026: 0, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 }
  
  for (const year of YEARS) {
    if (year === 2026) {
      cumulative = additions[year]
    } else {
      cumulative += additions[year]
    }
    result[year] = cumulative
  }
  
  return result
}

/**
 * Get all computed values from simulation input
 */
export function computeAllFromInput(input: SimulationInput) {
  return {
    woodchipSupply: calculateWoodchipSupply(input.forestry),
    pulpCapacity: calculatePulpCapacity(input.appCapacity),
    downstreamCapacity: calculateDownstreamCapacity(input.downstream)
  }
}

// Export constants for reuse
export { YEARS, CHINA_BASE_SUPPLY, VIETNAM_BASE_SUPPLY, CHINA_POLICY_IMPACT, REAL_ESTATE_IMPACT, VIETNAM_POLICY_IMPACT }
