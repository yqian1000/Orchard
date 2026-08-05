import { upgradeDie } from './scoring'
import type {
  BoardCell,
  CardDef,
  Coord,
  FruitColor,
  Rotation,
} from './types'

export const CARD_COLS = 3
export const CARD_ROWS = 2

export function cellKey(x: number, y: number): string {
  return `${x},${y}`
}

export function parseKey(key: string): Coord {
  const [xs, ys] = key.split(',')
  return { x: Number(xs), y: Number(ys) }
}

/** Local (col, row) after clockwise rotation; card is stored as 2×3. */
export function rotatedLocalPos(
  index: number,
  rotation: Rotation,
): Coord {
  const row = Math.floor(index / CARD_COLS)
  const col = index % CARD_COLS
  switch (rotation) {
    case 90:
      // 2×3 → 3×2：newCol = rows-1-row, newRow = col
      return { x: CARD_ROWS - 1 - row, y: col }
    case 180:
      return { x: CARD_COLS - 1 - col, y: CARD_ROWS - 1 - row }
    case 270:
      // 2×3 → 3×2：newCol = row, newRow = cols-1-col
      return { x: row, y: CARD_COLS - 1 - col }
    default:
      return { x: col, y: row }
  }
}

/** Map local cell index (0..5, row-major 2x3) to world coord for a placement. */
export function cellWorldPos(
  origin: Coord,
  rotation: Rotation,
  index: number,
): Coord {
  const local = rotatedLocalPos(index, rotation)
  return { x: origin.x + local.x, y: origin.y + local.y }
}

export function nextRotation(rotation: Rotation): Rotation {
  return ((rotation + 90) % 360) as Rotation
}

export function cardCellsAt(
  card: CardDef,
  origin: Coord,
  rotation: Rotation,
): Array<{ coord: Coord; color: FruitColor }> {
  return card.cells.map((cell, index) => ({
    color: cell.color,
    coord: cellWorldPos(origin, rotation, index),
  }))
}

export function isOccupied(board: Map<string, BoardCell>, x: number, y: number): boolean {
  const cell = board.get(cellKey(x, y))
  return cell !== undefined && cell.kind !== 'empty'
}

export function boardBounds(board: Map<string, BoardCell>): {
  minX: number
  maxX: number
  minY: number
  maxY: number
} | null {
  if (board.size === 0) return null
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const key of board.keys()) {
    const { x, y } = parseKey(key)
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }
  return { minX, maxX, minY, maxY }
}

/**
 * Legal if at least one cell overlaps an existing occupied cell.
 * First placement (empty board) is always legal.
 */
export function isLegalPlacement(
  board: Map<string, BoardCell>,
  card: CardDef,
  origin: Coord,
  rotation: Rotation,
): boolean {
  const cells = cardCellsAt(card, origin, rotation)
  if (board.size === 0) return true

  return cells.some(({ coord }) => isOccupied(board, coord.x, coord.y))
}

export function resolveCellOverlap(
  below: BoardCell | undefined,
  newColor: FruitColor,
): BoardCell {
  if (!below || below.kind === 'empty') {
    return { kind: 'tree', color: newColor }
  }
  if (below.kind === 'rotten') {
    return { kind: 'rotten' }
  }
  // below.kind === 'tree'
  if (below.color === newColor) {
    if (below.die === undefined) {
      return { kind: 'tree', color: newColor, die: 1 }
    }
    return { kind: 'tree', color: newColor, die: upgradeDie(below.die) }
  }
  return { kind: 'rotten' }
}

/** Apply a card onto the board; returns a new Map. */
export function applyCardToBoard(
  board: Map<string, BoardCell>,
  card: CardDef,
  origin: Coord,
  rotation: Rotation,
): Map<string, BoardCell> {
  const next = new Map(board)
  for (const { coord, color } of cardCellsAt(card, origin, rotation)) {
    const key = cellKey(coord.x, coord.y)
    const below = next.get(key)
    next.set(key, resolveCellOverlap(below, color))
  }
  return next
}

/** Clone board map (shallow cell values are immutable). */
export function cloneBoard(board: Map<string, BoardCell>): Map<string, BoardCell> {
  return new Map(board)
}
