import type {
  BoardCell,
  ColorScores,
  DieValue,
  FruitColor,
  GameState,
  MissionGoal,
  RankInfo,
} from './types'

export const DIE_UPGRADE: Record<DieValue, DieValue> = {
  1: 3,
  3: 6,
  6: 10,
  10: 10,
}

export const RANKS: RankInfo[] = [
  { minScore: 50, title: 'Fruit God', titleZh: '完美果园' },
  { minScore: 40, title: 'Legendary Picker', titleZh: '传奇果农' },
  { minScore: 35, title: 'Master Gardener', titleZh: '丰收大师' },
  { minScore: 30, title: 'Good Yield', titleZh: '相当不错' },
  { minScore: 25, title: 'Fair Harvest', titleZh: '还可以' },
  { minScore: -Infinity, title: 'Rookie Orchardist', titleZh: '还需要多加练习' },
]

export function upgradeDie(value: DieValue): DieValue {
  return DIE_UPGRADE[value]
}

export function emptyColorScores(): ColorScores {
  return { apple: 0, lemon: 0, plum: 0 }
}

export function sumDiceByColor(board: Map<string, BoardCell>): ColorScores {
  const scores = emptyColorScores()
  for (const cell of board.values()) {
    if (cell.kind === 'tree' && cell.die !== undefined) {
      scores[cell.color] += cell.die
    }
  }
  return scores
}

export function sumDice(board: Map<string, BoardCell>): number {
  const c = sumDiceByColor(board)
  return c.apple + c.lemon + c.plum
}

export function countRotten(board: Map<string, BoardCell>): number {
  let n = 0
  for (const cell of board.values()) {
    if (cell.kind === 'rotten') n += 1
  }
  return n
}

/** 总得分 = ∑骰子面值 − (腐烂标记 × 3) */
export function computeScore(board: Map<string, BoardCell>): {
  score: number
  rottenCount: number
  diceTotal: number
  colorScores: ColorScores
} {
  const colorScores = sumDiceByColor(board)
  const diceTotal = colorScores.apple + colorScores.lemon + colorScores.plum
  const rottenCount = countRotten(board)
  return {
    diceTotal,
    rottenCount,
    colorScores,
    score: diceTotal - rottenCount * 3,
  }
}

export function getRank(score: number): RankInfo {
  for (const rank of RANKS) {
    if (score >= rank.minScore) return rank
  }
  return RANKS[RANKS.length - 1]!
}

export function refreshScore(state: GameState): GameState {
  const { score, rottenCount, colorScores } = computeScore(state.board)
  return { ...state, score, rottenCount, colorScores }
}

export function missionGoalsMet(goal: MissionGoal, colors: ColorScores): boolean {
  return (
    colors.apple >= goal.apple &&
    colors.lemon >= goal.lemon &&
    colors.plum >= goal.plum
  )
}

export function generateMissionGoal(rng: () => number = Math.random): MissionGoal {
  const roll = () => 4 + Math.floor(rng() * 8) // 4..11
  return {
    apple: roll(),
    lemon: roll(),
    plum: roll(),
    maxRotten: 2 + Math.floor(rng() * 3), // 2..4
  }
}

export const FRUIT_NAME: Record<FruitColor, string> = {
  apple: '红苹果',
  lemon: '黄柠檬',
  plum: '紫李子',
}
