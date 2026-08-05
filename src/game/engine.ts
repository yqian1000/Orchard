import {
  applyCardToBoard,
  cardCellsAt,
  isLegalPlacement,
} from './board'
import { buildInfiniteDeal, buildNineCardDeal } from './cards'
import {
  computeScore,
  generateMissionGoal,
  missionGoalsMet,
  refreshScore,
} from './scoring'
import {
  getTutorialGuide,
  TUTORIAL_CARD_FRUIT,
  TUTORIAL_CARD_PLACE,
  TUTORIAL_CARD_ROTTEN,
  TUTORIAL_GUIDES,
  TUTORIAL_STARTER,
} from './tutorial'
import type {
  CardDef,
  Coord,
  GameMode,
  GameState,
  PlaceIntent,
  Rotation,
} from './types'

export const MISSION_DECK_SIZE = 9
export const INFINITE_DECK_SIZE = 99 // 11 × 9，完整包

function sameCoord(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y
}

function baseState(
  mode: GameMode,
  deckLimit: number,
  cards: CardDef[],
  extras: Partial<GameState> = {},
): GameState {
  const hand = cards.slice(0, 2)
  const starter = cards[2]!
  const deck = cards.slice(3)
  const board = applyCardToBoard(new Map(), starter, { x: 0, y: 0 }, 0)
  const { score, rottenCount, colorScores } = computeScore(board)

  return {
    mode,
    phase: 'playing',
    outcome: null,
    deck,
    hand,
    board,
    placements: [
      {
        cardId: starter.id,
        origin: { x: 0, y: 0 },
        rotation: 0,
        z: 0,
      },
    ],
    score,
    rottenCount,
    colorScores,
    tutorialStep: 0,
    deckLimit,
    ...extras,
  }
}

export function createMissionGame(rng: () => number = Math.random): GameState {
  const cards = buildNineCardDeal(rng)
  return baseState('mission', MISSION_DECK_SIZE, cards, {
    mission: generateMissionGoal(rng),
  })
}

export function createInfiniteGame(rng: () => number = Math.random): GameState {
  const cards = buildInfiniteDeal(INFINITE_DECK_SIZE, rng)
  return baseState('infinite', INFINITE_DECK_SIZE, cards)
}

/** 教学：固定牌序，手牌每次只有当前步骤的一张 */
export function createTutorialGame(): GameState {
  const board = applyCardToBoard(new Map(), TUTORIAL_STARTER, { x: 0, y: 0 }, 0)
  const { score, rottenCount, colorScores } = computeScore(board)

  return {
    mode: 'tutorial',
    phase: 'playing',
    outcome: null,
    deck: [TUTORIAL_CARD_FRUIT, TUTORIAL_CARD_ROTTEN],
    hand: [TUTORIAL_CARD_PLACE],
    board,
    placements: [
      {
        cardId: TUTORIAL_STARTER.id,
        origin: { x: 0, y: 0 },
        rotation: 0,
        z: 0,
      },
    ],
    score,
    rottenCount,
    colorScores,
    tutorialStep: 0,
    deckLimit: 4,
  }
}

export function createGame(rng: () => number = Math.random): GameState {
  return createMissionGame(rng)
}

export function findCardInHand(state: GameState, cardId: string): CardDef | undefined {
  return state.hand.find((c) => c.id === cardId)
}

export function canPlace(
  state: GameState,
  cardId: string,
  origin: Coord,
  rotation: Rotation,
): boolean {
  if (state.phase !== 'playing') return false
  const card = findCardInHand(state, cardId)
  if (!card) return false

  if (state.mode === 'tutorial') {
    const guide = getTutorialGuide(state.tutorialStep)
    if (!guide) return false
    if (cardId !== guide.requiredCardId) return false
    if (rotation !== guide.requiredRotation) return false
    if (!sameCoord(origin, guide.requiredOrigin)) return false
  }

  return isLegalPlacement(state.board, card, origin, rotation)
}

/** 教学步骤高亮占用的格子 */
export function getTutorialHighlightCells(state: GameState): Coord[] {
  if (state.mode !== 'tutorial') return []
  const guide = getTutorialGuide(state.tutorialStep)
  if (!guide) return []
  const card = state.hand.find((c) => c.id === guide.requiredCardId)
  if (!card) return []
  return cardCellsAt(card, guide.requiredOrigin, guide.requiredRotation).map(
    (c) => c.coord,
  )
}

function resolveOutcome(state: GameState): GameState {
  if (state.mode === 'tutorial') {
    if (state.tutorialStep >= TUTORIAL_GUIDES.length) {
      return { ...state, phase: 'finished', outcome: 'won' }
    }
    return state
  }

  if (state.mode === 'mission' && state.mission) {
    if (state.rottenCount > state.mission.maxRotten) {
      return { ...state, phase: 'finished', outcome: 'lost' }
    }
    if (missionGoalsMet(state.mission, state.colorScores)) {
      return { ...state, phase: 'finished', outcome: 'won' }
    }
    if (state.hand.length === 0 && state.deck.length === 0) {
      return { ...state, phase: 'finished', outcome: 'lost' }
    }
    return state
  }

  if (state.hand.length === 0 && state.deck.length === 0) {
    return { ...state, phase: 'finished', outcome: 'won' }
  }
  return state
}

export function placeCard(state: GameState, intent: PlaceIntent): GameState {
  if (state.phase !== 'playing') return state

  const cardIndex = state.hand.findIndex((c) => c.id === intent.cardId)
  if (cardIndex < 0) return state

  const card = state.hand[cardIndex]!

  if (state.mode === 'tutorial') {
    const guide = getTutorialGuide(state.tutorialStep)
    if (!guide) return state
    if (intent.cardId !== guide.requiredCardId) return state
    if (intent.rotation !== guide.requiredRotation) return state
    if (!sameCoord(intent.origin, guide.requiredOrigin)) return state
  }

  if (!isLegalPlacement(state.board, card, intent.origin, intent.rotation)) {
    return state
  }

  const board = applyCardToBoard(
    state.board,
    card,
    intent.origin,
    intent.rotation,
  )

  const hand = state.hand.filter((_, i) => i !== cardIndex)
  const placements = [
    ...state.placements,
    {
      cardId: card.id,
      origin: intent.origin,
      rotation: intent.rotation,
      z: state.placements.length,
    },
  ]

  let deck = state.deck
  let nextHand = hand
  if (deck.length > 0) {
    const [drawn, ...rest] = deck
    nextHand = [...hand, drawn!]
    deck = rest
  }

  let next = refreshScore({
    ...state,
    board,
    hand: nextHand,
    deck,
    placements,
  })

  if (state.mode === 'tutorial') {
    next = { ...next, tutorialStep: state.tutorialStep + 1 }
  }

  return resolveOutcome(next)
}

export function cardsRemaining(state: GameState): number {
  return state.hand.length + state.deck.length
}

export function placedCount(state: GameState): number {
  return state.placements.length
}

export function peekNextCard(state: GameState): CardDef | null {
  return state.deck[0] ?? null
}

export function restartSameMode(
  state: GameState,
  rng: () => number = Math.random,
): GameState {
  switch (state.mode) {
    case 'tutorial':
      return createTutorialGame()
    case 'mission':
      return createMissionGame(rng)
    case 'infinite':
      return createInfiniteGame(rng)
  }
}
