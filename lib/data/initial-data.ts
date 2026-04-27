import type {
  Player,
  SimulationInput,
  ForestrySettings,
  APPCapacitySettings,
  DownstreamSettings,
} from '@/lib/types/war-game'

// 玩家数据
export const PLAYERS: Player[] = [
  {
    id: 'app-china',
    name: 'APP China',
    nameCn: 'APP中国',
    type: 'app',
    region: 'china',
    isAIDriven: false,
    color: 'hsl(var(--chart-1))',
    pulpCapacity: 350,
    paperCapacity: 200,
    boardCapacity: 280,
    tissueCapacity: 120,
  },
  {
    id: 'app-indonesia',
    name: 'APP Indonesia',
    nameCn: 'APP印尼',
    type: 'app',
    region: 'indonesia',
    isAIDriven: false,
    color: 'hsl(var(--chart-1))',
    pulpCapacity: 800,
    paperCapacity: 150,
    boardCapacity: 200,
    tissueCapacity: 80,
  },
  {
    id: 'sun-paper',
    name: 'Sun Paper',
    nameCn: '太阳纸业',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: 'hsl(var(--chart-3))',
    pulpCapacity: 180,
    paperCapacity: 250,
    boardCapacity: 150,
    tissueCapacity: 60,
  },
  {
    id: 'chenming',
    name: 'Chenming',
    nameCn: '晨鸣纸业',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: 'hsl(var(--chart-4))',
    pulpCapacity: 120,
    paperCapacity: 180,
    boardCapacity: 100,
    tissueCapacity: 40,
  },
  {
    id: 'liansheng',
    name: 'Liansheng',
    nameCn: '联盛纸业',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: 'hsl(var(--chart-5))',
    pulpCapacity: 80,
    paperCapacity: 60,
    boardCapacity: 80,
    tissueCapacity: 30,
  },
  {
    id: 'others-china',
    name: 'Others',
    nameCn: '其他中国企业',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: 'hsl(var(--muted-foreground))',
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
    color: 'hsl(var(--chart-2))',
    pulpCapacity: 1100,
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
    color: 'hsl(var(--accent))',
    pulpCapacity: 280,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 50,
  },
  {
    id: 'vinda',
    name: 'Vinda',
    nameCn: '维达',
    type: 'competitor',
    region: 'china',
    isAIDriven: true,
    color: 'hsl(220 70% 50%)',
    pulpCapacity: 0,
    paperCapacity: 0,
    boardCapacity: 0,
    tissueCapacity: 150,
  },
]

// 默认林业设置
export const DEFAULT_FORESTRY_SETTINGS: ForestrySettings = {
  chinaLoggingPolicy: 'baseline',
  vietnamExportPolicy: 'baseline',
  vietnamExportPrice: 'medium',
}

// 默认APP产能设置
export const DEFAULT_APP_CAPACITY_SETTINGS: APPCapacitySettings = {
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

// 默认下游设置
export const DEFAULT_DOWNSTREAM_SETTINGS: DownstreamSettings = {
  paperDemand: 'base',
  boardDemand: 'base',
  tissueDemand: 'base',
}

// 默认完整输入
export const DEFAULT_SIMULATION_INPUT: SimulationInput = {
  forestry: DEFAULT_FORESTRY_SETTINGS,
  appCapacity: DEFAULT_APP_CAPACITY_SETTINGS,
  downstream: DEFAULT_DOWNSTREAM_SETTINGS,
}

// 政策选项标签
export const POLICY_LABELS = {
  chinaLoggingPolicy: {
    tight: '紧缩',
    baseline: '基准',
    relaxed: '宽松',
  },
  vietnamExportPolicy: {
    restricted: '限制',
    baseline: '基准',
    expanded: '扩大',
  },
  priceLevel: {
    low: '低',
    medium: '中',
    high: '高',
  },
  demandScenario: {
    low: '低需求',
    base: '基准',
    high: '高需求',
  },
}

// IRR门槛
export const IRR_HURDLE = 12 // 12%

// 年份选项
export const YEAR_OPTIONS = [2025, 2026, 2027, 2028, 2029, 2030]

// 产能范围
export const CAPACITY_RANGE = {
  pulp: { min: 0, max: 400, step: 25 },
  board: { min: 0, max: 200, step: 20 },
  tissue: { min: 0, max: 100, step: 10 },
}
