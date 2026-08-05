import { describe, expect, it } from 'vitest'
import {
  applyCardToBoard,
  cardCellsAt,
  isLegalPlacement,
  nextRotation,
  resolveCellOverlap,
  rotatedLocalPos,
} from './board'
import {
  buildInfiniteDeal,
  buildNineCardDeal,
  PLAY_CARDS,
} from './cards'
import {
  canPlace,
  createInfiniteGame,
  createMissionGame,
  createTutorialGame,
  INFINITE_DECK_SIZE,
  MISSION_DECK_SIZE,
  peekNextCard,
  placeCard,
} from './engine'
import { computeScore, getRank, upgradeDie } from './scoring'
import { getTutorialGuide, TUTORIAL_GUIDES } from './tutorial'
import type { CardDef, Cell, GameState } from './types'

const A: Cell = { color: 'apple' }
const L: Cell = { color: 'lemon' }
const P: Cell = { color: 'plum' }

function makeCard(
  id: string,
  cells: [Cell, Cell, Cell, Cell, Cell, Cell],
): CardDef {
  return { id, cells }
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('scoring', () => {
  it('upgrades dice along 1→3→6→10 and caps at 10', () => {
    expect(upgradeDie(1)).toBe(3)
    expect(upgradeDie(3)).toBe(6)
    expect(upgradeDie(6)).toBe(10)
    expect(upgradeDie(10)).toBe(10)
  })

  it('maps ranks by score thresholds', () => {
    expect(getRank(50).title).toBe('Fruit God')
  })
})

describe('overlap resolve', () => {
  it('places die 1 on first same-color overlap', () => {
    expect(resolveCellOverlap({ kind: 'tree', color: 'apple' }, 'apple')).toEqual({
      kind: 'tree',
      color: 'apple',
      die: 1,
    })
  })

  it('creates rotten on color mismatch', () => {
    expect(
      resolveCellOverlap({ kind: 'tree', color: 'apple', die: 3 }, 'plum'),
    ).toEqual({ kind: 'rotten' })
  })
})

describe('rotation', () => {
  it('cycles 0→90→180→270→0', () => {
    expect(nextRotation(0)).toBe(90)
    expect(nextRotation(270)).toBe(0)
  })

  it('maps 90° footprint', () => {
    expect(rotatedLocalPos(0, 90)).toEqual({ x: 1, y: 0 })
    const card = makeCard('r90', [A, L, P, A, L, P])
    const cells = cardCellsAt(card, { x: 0, y: 0 }, 90)
    const xs = cells.map((c) => c.coord.x)
    const ys = cells.map((c) => c.coord.y)
    expect(Math.max(...xs) - Math.min(...xs)).toBe(1)
    expect(Math.max(...ys) - Math.min(...ys)).toBe(2)
  })
})

describe('nine-card deal', () => {
  it('has exactly 9 predefined layouts', () => {
    expect(PLAY_CARDS).toHaveLength(9)
  })

  it('shuffles 9 unique card kinds once each', () => {
    const deal = buildNineCardDeal(mulberry32(3))
    expect(deal).toHaveLength(9)
    const baseIds = deal.map((c) => c.id).sort()
    expect(baseIds).toEqual([...PLAY_CARDS.map((c) => c.id)].sort())
  })

  it('infinite deal uses complete 9-packs up to limit', () => {
    const deal = buildInfiniteDeal(INFINITE_DECK_SIZE, mulberry32(5))
    expect(deal).toHaveLength(INFINITE_DECK_SIZE)
    expect(INFINITE_DECK_SIZE % 9).toBe(0)
  })
})

describe('game modes', () => {
  it('mission uses 9-card deal and exposes next card', () => {
    const state = createMissionGame(mulberry32(1))
    expect(state.mode).toBe('mission')
    expect(state.hand).toHaveLength(2)
    expect(state.deck).toHaveLength(MISSION_DECK_SIZE - 3)
    expect(state.placements).toHaveLength(1)
    expect(peekNextCard(state)?.id).toBe(state.deck[0]?.id)
    const used = new Set([
      ...state.hand.map((c) => c.id),
      state.placements[0]!.cardId,
      ...state.deck.map((c) => c.id),
    ])
    expect(used.size).toBe(9)
  })

  it('infinite setup uses 99 cards from 9-kind packs', () => {
    const state = createInfiniteGame(mulberry32(2))
    expect(state.deckLimit).toBe(99)
    expect(state.hand.length + state.deck.length + 1).toBe(99)
  })

  it('tutorial forces guide placement only', () => {
    const state = createTutorialGame()
    const guide = getTutorialGuide(0)!
    expect(state.hand[0]?.id).toBe(guide.requiredCardId)
    expect(
      canPlace(state, guide.requiredCardId, { x: 50, y: 50 }, 0),
    ).toBe(false)
    expect(
      canPlace(
        state,
        guide.requiredCardId,
        guide.requiredOrigin,
        guide.requiredRotation,
      ),
    ).toBe(true)

    const wrong = placeCard(state, {
      cardId: guide.requiredCardId,
      origin: { x: 0, y: 0 },
      rotation: 0,
    })
    expect(wrong).toBe(state)

    const ok = placeCard(state, {
      cardId: guide.requiredCardId,
      origin: guide.requiredOrigin,
      rotation: guide.requiredRotation,
    })
    expect(ok.tutorialStep).toBe(1)
    expect(ok.hand[0]?.id).toBe(TUTORIAL_GUIDES[1]!.requiredCardId)
  })

  it('tutorial completes after three forced places', () => {
    let state = createTutorialGame()
    for (let i = 0; i < TUTORIAL_GUIDES.length; i += 1) {
      const guide = getTutorialGuide(state.tutorialStep)!
      state = placeCard(state, {
        cardId: guide.requiredCardId,
        origin: guide.requiredOrigin,
        rotation: guide.requiredRotation,
      })
    }
    expect(state.phase).toBe('finished')
    expect(state.outcome).toBe('won')
  })

  it('mission loses when rotten exceeds max', () => {
    const appleCard = (id: string) => makeCard(id, [A, A, A, A, A, A])
    const lemonCard = (id: string) => makeCard(id, [L, L, L, L, L, L])

    let state: GameState = {
      mode: 'mission',
      phase: 'playing',
      outcome: null,
      deck: [],
      hand: [lemonCard('bad')],
      board: applyCardToBoard(new Map(), appleCard('start'), { x: 0, y: 0 }, 0),
      placements: [
        { cardId: 'start', origin: { x: 0, y: 0 }, rotation: 0, z: 0 },
      ],
      score: 0,
      rottenCount: 0,
      colorScores: { apple: 0, lemon: 0, plum: 0 },
      mission: { apple: 99, lemon: 99, plum: 99, maxRotten: 0 },
      tutorialStep: 0,
      deckLimit: 2,
    }
    state = { ...state, ...computeScore(state.board) }

    state = placeCard(state, {
      cardId: 'bad',
      origin: { x: 0, y: 0 },
      rotation: 0,
    })

    expect(state.outcome).toBe('lost')
  })

  it('rejects illegal place', () => {
    const state = createMissionGame(() => 0.42)
    const next = placeCard(state, {
      cardId: state.hand[0]!.id,
      origin: { x: 50, y: 50 },
      rotation: 0,
    })
    expect(next).toBe(state)
  })
})

describe('placement legality', () => {
  it('rejects zero-overlap placement', () => {
    const base = makeCard('base', [A, A, A, A, A, A])
    const board = applyCardToBoard(new Map(), base, { x: 0, y: 0 }, 0)
    const other = makeCard('other', [L, L, L, L, L, L])
    expect(isLegalPlacement(board, other, { x: 10, y: 10 }, 0)).toBe(false)
  })
})
