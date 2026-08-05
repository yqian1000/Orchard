export type FruitColor = 'apple' | 'lemon' | 'plum'
export type DieValue = 1 | 3 | 6 | 10
export type Rotation = 0 | 90 | 180 | 270

export type GameMode = 'tutorial' | 'mission' | 'infinite'
export type GamePhase = 'playing' | 'finished'
export type GameOutcome = 'won' | 'lost' | null

export type Cell = { color: FruitColor }

export type CardDef = {
  id: string
  cells: [Cell, Cell, Cell, Cell, Cell, Cell] // row-major 2x3
}

export type BoardCell =
  | { kind: 'empty' }
  | { kind: 'tree'; color: FruitColor; die?: DieValue }
  | { kind: 'rotten' }

export type Coord = { x: number; y: number }

export type PlacedCard = {
  cardId: string
  origin: Coord
  rotation: Rotation
  z: number
}

export type ColorScores = Record<FruitColor, number>

export type MissionGoal = {
  apple: number
  lemon: number
  plum: number
  /** 坏果数量上限；超过则失败 */
  maxRotten: number
}

export type GameState = {
  mode: GameMode
  phase: GamePhase
  outcome: GameOutcome
  deck: CardDef[]
  hand: CardDef[]
  board: Map<string, BoardCell>
  placements: PlacedCard[]
  score: number
  rottenCount: number
  colorScores: ColorScores
  mission?: MissionGoal
  /** 教学模式当前步骤 0..n */
  tutorialStep: number
  deckLimit: number
}

export type PlaceIntent = {
  cardId: string
  origin: Coord
  rotation: Rotation
}

export type RankInfo = {
  title: string
  titleZh: string
  minScore: number
}
