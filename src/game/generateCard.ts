import type { CardDef, Cell, FruitColor } from './types'

export const CARD_SIZE = 6
export const CARD_COLS = 3
export const CARD_ROWS = 2

const ALL_COLORS: FruitColor[] = ['apple', 'lemon', 'plum']

const ORTHO: Array<[number, number]> = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0],
]

function shuffleInPlace<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

function indexToRC(index: number): { r: number; c: number } {
  return { r: Math.floor(index / CARD_COLS), c: index % CARD_COLS }
}

function rcToIndex(r: number, c: number): number {
  return r * CARD_COLS + c
}

/** 同色格子是否四向连通 */
export function isColorConnected(
  colors: FruitColor[],
  color: FruitColor,
): boolean {
  const indices: number[] = []
  for (let i = 0; i < colors.length; i += 1) {
    if (colors[i] === color) indices.push(i)
  }
  if (indices.length <= 1) return true

  const set = new Set(indices)
  const visited = new Set<number>()
  const queue = [indices[0]!]
  while (queue.length > 0) {
    const cur = queue.pop()!
    if (visited.has(cur)) continue
    visited.add(cur)
    const { r, c } = indexToRC(cur)
    for (const [dr, dc] of ORTHO) {
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nr >= CARD_ROWS || nc < 0 || nc >= CARD_COLS) continue
      const ni = rcToIndex(nr, nc)
      if (set.has(ni) && !visited.has(ni)) queue.push(ni)
    }
  }
  return visited.size === indices.length
}

export function isValidGeneratedLayout(colors: FruitColor[]): boolean {
  if (colors.length !== CARD_SIZE) return false
  const unique = new Set(colors)
  if (unique.size < 2) return false
  for (const color of unique) {
    if (!isColorConnected(colors, color)) return false
  }
  return true
}

function randomLayout(rng: () => number): FruitColor[] {
  const colorCount = rng() < 0.55 ? 2 : 3
  const palette = shuffleInPlace([...ALL_COLORS], rng).slice(0, colorCount)
  const positions = shuffleInPlace([0, 1, 2, 3, 4, 5], rng)
  const colors: FruitColor[] = Array.from({ length: CARD_SIZE }, () => palette[0]!)

  // 每种颜色至少一格
  palette.forEach((color, i) => {
    colors[positions[i]!] = color
  })
  for (let i = palette.length; i < CARD_SIZE; i += 1) {
    colors[positions[i]!] = palette[Math.floor(rng() * palette.length)]!
  }
  return colors
}

const FALLBACK: FruitColor[] = [
  'apple',
  'apple',
  'lemon',
  'apple',
  'lemon',
  'lemon',
]

export function generateCard(id: string, rng: () => number = Math.random): CardDef {
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const colors = randomLayout(rng)
    if (isValidGeneratedLayout(colors)) {
      const cells = colors.map((color) => ({ color })) as CardDef['cells']
      return { id, cells }
    }
  }
  const cells = FALLBACK.map((color) => ({ color })) as CardDef['cells']
  return { id, cells }
}

export function generateDeck(
  count: number,
  rng: () => number = Math.random,
  idPrefix = 'r',
): CardDef[] {
  return Array.from({ length: count }, (_, i) =>
    generateCard(`${idPrefix}${i + 1}`, rng),
  )
}

export function cellsFromColors(
  colors: [FruitColor, FruitColor, FruitColor, FruitColor, FruitColor, FruitColor],
): [Cell, Cell, Cell, Cell, Cell, Cell] {
  return colors.map((color) => ({ color })) as CardDef['cells']
}
