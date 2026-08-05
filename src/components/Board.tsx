import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  guideCells?: Coord[]
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
  const [pan, setPan] = useState({ x: 24, y: 24 })
  const [zoom, setZoom] = useState(1)
  const [panMode, setPanMode] = useState(false)
  const [hoverOrigin, setHoverOrigin] = useState<Coord | null>(null)

  const pointersRef = useRef(
    new Map<number, { x: number; y: number }>(),
  )
  const dragRef = useRef<{
    panning: boolean
    placed: boolean
    startX: number
    startY: number
    panX: number
    panY: number
    pinchDist: number
    pinchZoom: number
  }>({
    panning: false,
    placed: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
    pinchDist: 0,
    pinchZoom: 1,
  })

  const guideKeys = useMemo(() => coordSet(guideCells), [guideCells])

  const bounds = useMemo(() => {
    const b = boardBounds(state.board)
    let minX = b?.minX ?? 0
    let maxX = b?.maxX ?? 3
    let minY = b?.minY ?? 0
    let maxY = b?.maxY ?? 2
    for (const c of guideCells) {
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
    if (!selectedCard || !hoverOrigin || panMode) return null
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
  }, [selectedCard, hoverOrigin, rotation, state.board, isOriginAllowed, panMode])

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

  const isOriginLegal = useCallback(
    (origin: Coord) => {
      if (!selectedCard) return false
      const base = isLegalPlacement(state.board, selectedCard, origin, rotation)
      if (!base) return false
      return isOriginAllowed ? isOriginAllowed(origin) : true
    },
    [selectedCard, state.board, rotation, isOriginAllowed],
  )

  // 开局时自适应缩放居中，方便手机可视
  useEffect(() => {
    if (state.placements.length > 1) return
    const el = viewportRef.current
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    if (w < 40 || h < 40) return
    const worldW = cols * STEP
    const worldH = rows * STEP
    const fit = Math.min(
      1.15,
      Math.max(0.55, Math.min(w / worldW, h / worldH) * 0.92),
    )
    setZoom(fit)
    setPan({
      x: Math.max(12, (w - worldW * fit) / 2),
      y: Math.max(12, (h - worldH * fit) / 2),
    })
  }, [state.placements.length, state.mode, cols, rows])

  const onPointerDown = (e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const multi = pointersRef.current.size >= 2
    const shouldPan =
      panMode || multi || e.button === 1 || e.button === 2 || e.altKey || !selectedCard

    if (shouldPan) {
      dragRef.current.panning = true
      dragRef.current.placed = false
      dragRef.current.startX = e.clientX
      dragRef.current.startY = e.clientY
      dragRef.current.panX = pan.x
      dragRef.current.panY = pan.y
      if (multi) {
        const pts = [...pointersRef.current.values()]
        const a = pts[0]!
        const b = pts[1]!
        dragRef.current.pinchDist = Math.hypot(a.x - b.x, a.y - b.y)
        dragRef.current.pinchZoom = zoom
      }
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
      setHoverOrigin(null)
      return
    }

    dragRef.current.panning = false
    dragRef.current.placed = false
    setHoverOrigin(screenToOrigin(e.clientX, e.clientY))
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    }

    if (dragRef.current.panning) {
      if (pointersRef.current.size >= 2) {
        const pts = [...pointersRef.current.values()]
        const a = pts[0]!
        const b = pts[1]!
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        if (dragRef.current.pinchDist > 0) {
          const scale = dist / dragRef.current.pinchDist
          setZoom(
            Math.min(1.8, Math.max(0.45, dragRef.current.pinchZoom * scale)),
          )
        }
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        setPan({
          x: dragRef.current.panX + dx * 0.5,
          y: dragRef.current.panY + dy * 0.5,
        })
      } else {
        const dx = e.clientX - dragRef.current.startX
        const dy = e.clientY - dragRef.current.startY
        setPan({
          x: dragRef.current.panX + dx,
          y: dragRef.current.panY + dy,
        })
      }
      return
    }

    if (selectedCard && !panMode) {
      setHoverOrigin(screenToOrigin(e.clientX, e.clientY))
    }
  }

  const endPointer = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId)

    if (dragRef.current.panning) {
      if (pointersRef.current.size === 0) {
        dragRef.current.panning = false
      }
      return
    }

    if (dragRef.current.placed || panMode || !selectedCard) {
      setHoverOrigin(null)
      return
    }

    const origin = screenToOrigin(e.clientX, e.clientY)
    if (origin && isOriginLegal(origin)) {
      dragRef.current.placed = true
      onPlace(origin)
    }
    setHoverOrigin(null)
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((z) => Math.min(1.8, Math.max(0.45, z - e.deltaY * 0.001)))
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
        <span className="board-toolbar__hint board-toolbar__hint--desktop">
          滚轮缩放 · 未选牌拖拽平移 · 双指缩放平移
        </span>
        <span className="board-toolbar__hint board-toolbar__hint--mobile">
          点按放置 · 平移模式/双指拖动棋盘
        </span>
        <div className="board-toolbar__actions">
          <button
            type="button"
            className={`btn btn-ghost${panMode ? ' is-active' : ''}`}
            onClick={() => {
              setPanMode((v) => !v)
              setHoverOrigin(null)
            }}
          >
            {panMode ? '放置模式' : '平移模式'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
          >
            +
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setZoom((z) => Math.max(0.45, z - 0.15))}
          >
            −
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setZoom(1)
              setPan({ x: 24, y: 24 })
            }}
          >
            复位
          </button>
        </div>
      </div>
      <div
        ref={viewportRef}
        className={`board-viewport${panMode ? ' is-pan-mode' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
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
