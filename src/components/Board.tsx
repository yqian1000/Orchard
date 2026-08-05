import { useCallback, useMemo, useRef, useState } from 'react'
import { FRUIT_SYMBOL } from '../game/cards'
import {
  boardBounds,
  cardCellsAt,
  cellKey,
  isLegalPlacement,
} from '../game/board'
import type { CardDef, Coord, GameState, Rotation } from '../game/types'
import './Board.css'

const CELL = 56
const GAP = 4
const STEP = CELL + GAP

type Props = {
  state: GameState
  selectedCard: CardDef | null
  rotation: Rotation
  onPlace: (origin: Coord) => void
  /** 教学高亮格子 */
  guideCells?: Coord[]
  /** 额外合法性（教学强制落点） */
  isOriginAllowed?: (origin: Coord) => boolean
}

function coordSet(cells: Coord[]): Set<string> {
  return new Set(cells.map((c) => cellKey(c.x, c.y)))
}

export function Board({
  state,
  selectedCard,
  rotation,
  onPlace,
  guideCells = [],
  isOriginAllowed,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 40, y: 40 })
  const [zoom, setZoom] = useState(1)
  const [hoverOrigin, setHoverOrigin] = useState<Coord | null>(null)
  const dragRef = useRef<{
    active: boolean
    startX: number
    startY: number
    panX: number
    panY: number
  }>({ active: false, startX: 0, startY: 0, panX: 0, panY: 0 })

  const guideKeys = useMemo(() => coordSet(guideCells), [guideCells])

  const bounds = useMemo(() => {
    const b = boardBounds(state.board)
    const extras = guideCells
    let minX = b?.minX ?? 0
    let maxX = b?.maxX ?? 3
    let minY = b?.minY ?? 0
    let maxY = b?.maxY ?? 2
    for (const c of extras) {
      minX = Math.min(minX, c.x)
      maxX = Math.max(maxX, c.x)
      minY = Math.min(minY, c.y)
      maxY = Math.max(maxY, c.y)
    }
    return {
      minX: minX - 2,
      maxX: maxX + 2,
      minY: minY - 2,
      maxY: maxY + 2,
    }
  }, [state.board, guideCells])

  const cols = bounds.maxX - bounds.minX + 1
  const rows = bounds.maxY - bounds.minY + 1

  const preview = useMemo(() => {
    if (!selectedCard || !hoverOrigin) return null
    const baseLegal = isLegalPlacement(
      state.board,
      selectedCard,
      hoverOrigin,
      rotation,
    )
    const allowed = isOriginAllowed ? isOriginAllowed(hoverOrigin) : true
    const legal = baseLegal && allowed
    const cells = cardCellsAt(selectedCard, hoverOrigin, rotation)
    return { legal, cells }
  }, [selectedCard, hoverOrigin, rotation, state.board, isOriginAllowed])

  const screenToOrigin = useCallback(
    (clientX: number, clientY: number): Coord | null => {
      const el = viewportRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      const localX = (clientX - rect.left - pan.x) / zoom
      const localY = (clientY - rect.top - pan.y) / zoom
      const col = Math.floor(localX / STEP)
      const row = Math.floor(localY / STEP)
      return {
        x: bounds.minX + col,
        y: bounds.minY + row,
      }
    },
    [bounds.minX, bounds.minY, pan.x, pan.y, zoom],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || e.altKey || !selectedCard) {
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      }
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setPan({
        x: dragRef.current.panX + dx,
        y: dragRef.current.panY + dy,
      })
      return
    }
    if (selectedCard) {
      setHoverOrigin(screenToOrigin(e.clientX, e.clientY))
    }
  }

  const onPointerUp = () => {
    if (dragRef.current.active) {
      dragRef.current.active = false
      return
    }
    if (!selectedCard || !preview?.legal || !hoverOrigin) return
    onPlace(hoverOrigin)
    setHoverOrigin(null)
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((z) => Math.min(1.8, Math.max(0.5, z - e.deltaY * 0.001)))
  }

  const cells: React.ReactNode[] = []
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      const key = cellKey(x, y)
      const cell = state.board.get(key)
      const left = (x - bounds.minX) * STEP
      const top = (y - bounds.minY) * STEP

      let previewClass = ''
      if (preview) {
        const hit = preview.cells.find(
          (c) => c.coord.x === x && c.coord.y === y,
        )
        if (hit) {
          previewClass = preview.legal ? ' is-preview-ok' : ' is-preview-bad'
        }
      }

      const isGuide = guideKeys.has(key)

      cells.push(
        <div
          key={key}
          className={`board-cell${cell ? ' is-filled' : ''}${previewClass}${isGuide ? ' is-guide' : ''}`}
          style={{ left, top, width: CELL, height: CELL }}
        >
          {cell?.kind === 'tree' && (
            <>
              <div className={`board-cell__tree fruit-${cell.color}`}>
                {FRUIT_SYMBOL[cell.color]}
              </div>
              {cell.die !== undefined && (
                <span className="board-cell__die">{cell.die}</span>
              )}
            </>
          )}
          {cell?.kind === 'rotten' && (
            <div className="board-cell__rotten" title="腐烂果实">
              🪱
            </div>
          )}
        </div>,
      )
    }
  }

  return (
    <div className="board-wrap">
      <div className="board-toolbar">
        <span>滚轮缩放 · 未选牌时拖拽平移 · Alt+拖拽也可平移</span>
        <div className="board-toolbar__actions">
          <button type="button" className="btn btn-ghost" onClick={() => setZoom(1)}>
            重置缩放
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setPan({ x: 40, y: 40 })}
          >
            重置位置
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className="board-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          dragRef.current.active = false
          setHoverOrigin(null)
        }}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className="board-world"
          style={{
            width: cols * STEP,
            height: rows * STEP,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {cells}
        </div>
      </div>
    </div>
  )
}
