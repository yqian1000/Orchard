import { FRUIT_SYMBOL } from '../game/cards'
import { CARD_COLS, CARD_ROWS, rotatedLocalPos } from '../game/board'
import type { CardDef, Cell, Rotation } from '../game/types'
import './CardView.css'

type Props = {
  card: CardDef
  rotation?: Rotation
  selected?: boolean
  compact?: boolean
  onClick?: () => void
}

function cellsForDisplay(card: CardDef, rotation: Rotation): {
  cols: number
  rows: number
  cells: Cell[]
} {
  const upright = rotation === 0 || rotation === 180
  const cols = upright ? CARD_COLS : CARD_ROWS
  const rows = upright ? CARD_ROWS : CARD_COLS
  const cells: Cell[] = Array.from({ length: cols * rows })

  card.cells.forEach((cell, index) => {
    const { x, y } = rotatedLocalPos(index, rotation)
    cells[y * cols + x] = cell
  })

  return { cols, rows, cells: cells as Cell[] }
}

export function CardView({
  card,
  rotation = 0,
  selected = false,
  compact = false,
  onClick,
}: Props) {
  const { cols, cells } = cellsForDisplay(card, rotation)

  return (
    <button
      type="button"
      className={`card-view${selected ? ' is-selected' : ''}${compact ? ' is-compact' : ''}${onClick ? ' is-clickable' : ''}`}
      onClick={onClick}
      disabled={!onClick}
      aria-label={`卡牌 ${card.id}`}
    >
      <div
        className="card-view__grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cells.map((cell, i) => (
          <div
            key={`${card.id}-${rotation}-${i}`}
            className={`card-view__cell fruit-${cell.color}`}
            title={cell.color}
          >
            <span aria-hidden>{FRUIT_SYMBOL[cell.color]}</span>
          </div>
        ))}
      </div>
    </button>
  )
}
