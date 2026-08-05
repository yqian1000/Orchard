import type { CardDef, Cell, FruitColor } from './types'

const A: Cell = { color: 'apple' }
const L: Cell = { color: 'lemon' }
const P: Cell = { color: 'plum' }

function card(
  id: string,
  c0: Cell,
  c1: Cell,
  c2: Cell,
  c3: Cell,
  c4: Cell,
  c5: Cell,
): CardDef {
  return { id, cells: [c0, c1, c2, c3, c4, c5] }
}

/**
 * 标准 9 种卡牌（任务/无限模式牌库）。
 * 每局将这 9 张洗牌后各出现恰好 1 次（无限模式为多包拼接）。
 */
export const PLAY_CARDS: CardDef[] = [
  card('c01', A, A, L, L, P, P),
  card('c02', A, L, P, A, L, P),
  card('c03', A, A, A, L, L, P),
  card('c04', P, P, P, A, A, L),
  card('c05', L, L, L, P, P, A),
  card('c06', A, L, L, A, P, P),
  card('c07', P, A, A, P, L, L),
  card('c08', L, P, P, L, A, A),
  card('c09', A, A, P, L, L, P),
]

/** @deprecated 兼容旧引用 */
export const ALL_CARDS = PLAY_CARDS

export const FRUIT_LABEL: Record<FruitColor, string> = {
  apple: '苹果',
  lemon: '柠檬',
  plum: '李子',
}

export const FRUIT_SYMBOL: Record<FruitColor, string> = {
  apple: '🍎',
  lemon: '🍋',
  plum: '🟣',
}

export function shuffleCards(
  cards: CardDef[],
  rng: () => number = Math.random,
): CardDef[] {
  const arr = cards.map((c) => ({
    ...c,
    cells: [...c.cells] as CardDef['cells'],
  }))
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

/** 一局 9 张：每种恰好一张，顺序随机 */
export function buildNineCardDeal(rng: () => number = Math.random): CardDef[] {
  return shuffleCards(PLAY_CARDS, rng)
}

/**
 * 无限模式：完整「9 种各 1」的包循环拼接，凑满 target 张。
 * 若 target 不是 9 的倍数，最后一包截断。
 */
export function buildInfiniteDeal(
  target: number,
  rng: () => number = Math.random,
): CardDef[] {
  const out: CardDef[] = []
  let pack = 0
  while (out.length < target) {
    const packCards = shuffleCards(PLAY_CARDS, rng).map((c) => ({
      ...c,
      id: `${c.id}-p${pack}`,
    }))
    out.push(...packCards)
    pack += 1
  }
  return out.slice(0, target)
}
