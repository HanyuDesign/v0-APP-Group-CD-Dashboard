import type {
  Player,
  SimulationInput,
  ForestrySettings,
  APPCapacitySettings,
  DownstreamSettings,
  ReactionSettings,
} from '@/lib/types/war-game'

// Player data with Bain-style colors (red primary, professional palette)
export const PLAYERS: Player[] = [
  {
    id: 'app-china',
    name: 'APP China',
    nameCn: 'APP China',
    type: 'app',
    region: 'china',
    isAIDriven: false,
    color: '#cc0000', // Bain Red - APP primary
    pulpCapacity: 350,
    paperCapacity: 200,
    boardCapacity: 280,
    tissueCapacity: 120,
  },
  {
    id: 'app-indonesia',
    name: 'APP Indonesia',
    nameCn: 'APP Indonesia',
    type: 'app',
    region: 'indonesia',
    isAIDriven: false,
    color: '#e63946', // Lighter red - APP secondary
    pulpCapacity: 800,
    paperCapacity: 150,
    boardCapacity: 200,
    tissueCapacity: 80,
  },
  {
    id: 'sun-paper',
    name: 'Sun Paper',
    nameCn: 'Sun Paper',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: '#1d4e89', // Navy blue
    pulpCapacity: 180,
    paperCapacity: 250,
    boardCapacity: 150,
    tissueCapacity: 60,
  },
  {
    id: 'chenming',
    name: 'Chenming',
    nameCn: 'Chenming',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: '#2a9d8f', // Teal
    pulpCapacity: 120,
    paperCapacity: 180,
    boardCapacity: 100,
    tissueCapacity: 40,
  },
  {
    id: 'liansheng',
    name: 'Liansheng',
    nameCn: 'Liansheng',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: '#e9c46a', // Gold/Amber
    pulpCapacity: 80,
    paperCapacity: 60,
    boardCapacity: 80,
    tissueCapacity: 30,
  },
  {
    id: 'others-china',
    name: 'Others China',
    nameCn: 'Others China',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: '#6c757d', // Gray
    pulpCapacity: 150,
    paperCapacity: 200,
    boardCapacity: 120,
    tissueCapacity: 100,
  },
  {
    id: 'suzano',
    name: 'Suzano',
    nameCn: 'Suzano',
    type: 'exporter',
    region: 'latam',
    isAIDriven: true,
    color: '#264653', // Dark teal
    pulpCapacity: 1100,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 0,
  },
  {
    id: 'cmpc',
    name: 'CMPC',
    nameCn: 'CMPC',
    type: 'exporter',
    region: 'latam',
    isAIDriven: true,
    color: '#457b9d', // Steel blue
    pulpCapacity: 450,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 0,
  },
  {
    id: 'arauco',
    name: 'Arauco',
    nameCn: 'Arauco',
    type: 'exporter',
    region: 'latam',
    isAIDriven: true,
    color: '#588157', // Forest green
    pulpCapacity: 380,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 0,
  },
  {
    id: 'april',
    name: 'APRIL',
    nameCn: 'APRIL',
    type: 'exporter',
    region: 'indonesia',
    isAIDriven: true,
    color: '#f4a261', // Orange
    pulpCapacity: 280,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 50,
  },
  {
    id: 'vinda',
    name: 'Vinda',
    nameCn: 'Vinda',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: '#7b2d8e', // Purple
    pulpCapacity: 0,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 150,
  },
]

// Default forestry settings - Time-based policy inputs
export const DEFAULT_FORESTRY_SETTINGS: ForestrySettings = {
  // Section 1: Micro Demand Driver (China)
  chinaRealEstateCondition: 'stable',
  
  // Section 2: Policy Drivers (Time-based)
  chinaLoggingPolicy: 'baseline',
  chinaLoggingPolicyStartYear: 2026,
  vietnamExportPolicy: 'baseline',
  vietnamExportPolicyStartYear: 2026,
}

// Default APP capacity settings
export const DEFAULT_APP_CAPACITY_SETTINGS: APPCapacitySettings = {
  appChina: {
    2026: 350, // Existing capacity
    2027: 0,
    2028: 0,
    2029: 0,
    2030: 0,
    2031: 0,
  },
  guangxi: {
    pulpCapacity: 200,
    startYear: 2026,
    includeBoard: true,
    boardCapacity: 100,
    includeTissue: false,
    tissueCapacity: 0,
  },
  jiangsuFujian: {
    pulpCapacity: 150,
    startYear: 2027,
    includeBoard: false,
    boardCapacity: 0,
    includeTissue: true,
    tissueCapacity: 60,
  },
}

// Competitor capacity additions by year (AI-driven projections)
export const COMPETITOR_CAPACITY_PROJECTIONS = [
  {
    playerId: 'sun-paper',
    playerName: 'Sun Paper',
    capacity: { 2026: 180, 2027: 50, 2028: 80, 2029: 0, 2030: 100, 2031: 0 },
  },
  {
    playerId: 'chenming',
    playerName: 'Chenming',
    capacity: { 2026: 120, 2027: 0, 2028: 60, 2029: 40, 2030: 0, 2031: 50 },
  },
  {
    playerId: 'liansheng',
    playerName: 'Liansheng',
    capacity: { 2026: 80, 2027: 30, 2028: 0, 2029: 50, 2030: 0, 2031: 0 },
  },
  {
    playerId: 'others-china',
    playerName: 'Others China',
    capacity: { 2026: 150, 2027: 20, 2028: 30, 2029: 40, 2030: 25, 2031: 35 },
  },
]

// Default downstream settings
export const DEFAULT_DOWNSTREAM_SETTINGS: DownstreamSettings = {
  paperDemand: 'base',
  boardDemand: 'base',
  tissueDemand: 'base',
  supply: {
    paper: {
      appChina: { 2026: 120, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 },
    },
    board: {
      appChina: { 2026: 200, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 },
    },
    tissue: {
      appChina: { 2026: 80, 2027: 0, 2028: 0, 2029: 0, 2030: 0, 2031: 0 },
    },
  },
}

// Downstream competitor supply projections by segment
export const DOWNSTREAM_COMPETITOR_SUPPLY = {
  paper: [
    { playerId: 'sun-paper', playerName: 'Sun Paper', capacity: { 2026: 150, 2027: 0, 2028: -20, 2029: -15, 2030: 0, 2031: -10 } },
    { playerId: 'chenming', playerName: 'Chenming', capacity: { 2026: 100, 2027: -10, 2028: 0, 2029: -20, 2030: 0, 2031: 0 } },
    { playerId: 'liansheng', playerName: 'Liansheng', capacity: { 2026: 60, 2027: 0, 2028: 0, 2029: 0, 2030: -10, 2031: 0 } },
    { playerId: 'others-china', playerName: 'Others China', capacity: { 2026: 200, 2027: -30, 2028: -40, 2029: -25, 2030: -20, 2031: -15 } },
  ],
  board: [
    { playerId: 'sun-paper', playerName: 'Sun Paper', capacity: { 2026: 180, 2027: 40, 2028: 60, 2029: 30, 2030: 50, 2031: 20 } },
    { playerId: 'chenming', playerName: 'Chenming', capacity: { 2026: 140, 2027: 20, 2028: 30, 2029: 40, 2030: 25, 2031: 35 } },
    { playerId: 'liansheng', playerName: 'Liansheng', capacity: { 2026: 90, 2027: 15, 2028: 25, 2029: 20, 2030: 10, 2031: 15 } },
    { playerId: 'others-china', playerName: 'Others China', capacity: { 2026: 250, 2027: 30, 2028: 45, 2029: 35, 2030: 40, 2031: 30 } },
  ],
  tissue: [
    { playerId: 'sun-paper', playerName: 'Sun Paper', capacity: { 2026: 60, 2027: 10, 2028: 15, 2029: 20, 2030: 10, 2031: 15 } },
    { playerId: 'chenming', playerName: 'Chenming', capacity: { 2026: 40, 2027: 5, 2028: 10, 2029: 8, 2030: 12, 2031: 5 } },
    { playerId: 'liansheng', playerName: 'Liansheng', capacity: { 2026: 30, 2027: 8, 2028: 5, 2029: 10, 2030: 5, 2031: 8 } },
    { playerId: 'others-china', playerName: 'Others China', capacity: { 2026: 100, 2027: 15, 2028: 20, 2029: 25, 2030: 18, 2031: 22 } },
  ],
}

// Default reaction settings
export const DEFAULT_REACTION_SETTINGS: ReactionSettings = {
  competitorBehavior: 'neutral',
  exporterStrategy: 'balanced',
  downstreamReaction: 'maintain',
}

// Default full simulation input
export const DEFAULT_SIMULATION_INPUT: SimulationInput = {
  forestry: DEFAULT_FORESTRY_SETTINGS,
  appCapacity: DEFAULT_APP_CAPACITY_SETTINGS,
  downstream: DEFAULT_DOWNSTREAM_SETTINGS,
  reactionSettings: DEFAULT_REACTION_SETTINGS,
}

// Policy option labels
export const POLICY_LABELS = {
  chinaLoggingPolicy: {
    tight: 'Tight',
    baseline: 'Baseline',
    relaxed: 'Relaxed',
  },
  chinaRealEstateCondition: {
    downturn: 'Downturn',
    stable: 'Stable',
    recovery: 'Recovery',
  },
  vietnamExportPolicy: {
    restricted: 'Restricted',
    baseline: 'Baseline',
    expanded: 'Expanded',
  },
  priceLevel: {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  },
  demandScenario: {
    low: 'Low Demand',
    base: 'Baseline',
    high: 'High Demand',
  },
}

// IRR hurdle rate
export const IRR_HURDLE = 12 // 12%

// Year options
export const YEAR_OPTIONS = [2025, 2026, 2027, 2028, 2029, 2030]

// Capacity range settings
export const CAPACITY_RANGE = {
  pulp: { min: 0, max: 400, step: 25 },
  board: { min: 0, max: 200, step: 20 },
  tissue: { min: 0, max: 100, step: 10 },
}
