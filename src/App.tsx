import { useCallback, useEffect, useMemo, useState } from 'react'
import { Board } from './components/Board'
import { GameOver } from './components/GameOver'
import { Hand } from './components/Hand'
import { MainMenu } from './components/MainMenu'
import { ScoreBar } from './components/ScoreBar'
import { TutorialPanel } from './components/TutorialPanel'
import { nextRotation } from './game/board'
import {
  canPlace,
  createInfiniteGame,
  createMissionGame,
  createTutorialGame,
  getTutorialHighlightCells,
  peekNextCard,
  placeCard,
  restartSameMode,
} from './game/engine'
import { getTutorialGuide } from './game/tutorial'
import type { Coord, GameMode, GameState, Rotation } from './game/types'
import './App.css'

type Screen = 'menu' | 'playing'

function startMode(mode: GameMode): GameState {
  switch (mode) {
    case 'tutorial':
      return createTutorialGame()
    case 'mission':
      return createMissionGame()
    case 'infinite':
      return createInfiniteGame()
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [state, setState] = useState<GameState | null>(null)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [rotation, setRotation] = useState<Rotation>(0)

  const begin = useCallback((mode: GameMode) => {
    const next = startMode(mode)
    setState(next)
    const guide = mode === 'tutorial' ? getTutorialGuide(0) : null
    setSelectedCardId(guide?.requiredCardId ?? next.hand[0]?.id ?? null)
    setRotation(guide?.requiredRotation ?? 0)
    setScreen('playing')
  }, [])

  const goMenu = useCallback(() => {
    setScreen('menu')
    setState(null)
    setSelectedCardId(null)
    setRotation(0)
  }, [])

  const restart = useCallback(() => {
    if (!state) return
    const next = restartSameMode(state)
    setState(next)
    const guide = next.mode === 'tutorial' ? getTutorialGuide(0) : null
    setSelectedCardId(guide?.requiredCardId ?? next.hand[0]?.id ?? null)
    setRotation(guide?.requiredRotation ?? 0)
  }, [state])

  const tutorialGuide =
    state?.mode === 'tutorial' ? getTutorialGuide(state.tutorialStep) : null

  // 教学步骤切换时强制选中目标牌与朝向
  useEffect(() => {
    if (!state || state.mode !== 'tutorial') return
    const guide = getTutorialGuide(state.tutorialStep)
    if (!guide) return
    setSelectedCardId(guide.requiredCardId)
    setRotation(guide.requiredRotation)
  }, [state?.mode, state?.tutorialStep, state])

  const selectedCard = useMemo(() => {
    if (!state) return null
    if (!selectedCardId) return state.hand[0] ?? null
    return state.hand.find((c) => c.id === selectedCardId) ?? state.hand[0] ?? null
  }, [state, selectedCardId])

  const guideCells = useMemo(
    () => (state ? getTutorialHighlightCells(state) : []),
    [state],
  )

  if (screen === 'menu' || !state) {
    return <MainMenu onSelect={begin} />
  }

  const onSelect = (cardId: string) => {
    if (tutorialGuide && cardId !== tutorialGuide.requiredCardId) return
    setSelectedCardId(cardId)
    if (!tutorialGuide) setRotation(0)
  }

  const onRotate = () => {
    if (tutorialGuide && !tutorialGuide.allowRotate) return
    setRotation((r) => nextRotation(r))
  }

  const onPlace = (origin: Coord) => {
    if (!selectedCard) return
    const next = placeCard(state, {
      cardId: selectedCard.id,
      origin,
      rotation,
    })
    if (next === state) return
    setState(next)
    if (next.mode === 'tutorial') {
      const g = getTutorialGuide(next.tutorialStep)
      setSelectedCardId(g?.requiredCardId ?? next.hand[0]?.id ?? null)
      setRotation(g?.requiredRotation ?? 0)
    } else {
      setSelectedCardId(next.hand[0]?.id ?? null)
      setRotation(0)
    }
  }

  const isOriginAllowed = (origin: Coord) => {
    if (!selectedCard) return false
    return canPlace(state, selectedCard.id, origin, rotation)
  }

  return (
    <div className="app">
      <ScoreBar state={state} />
      {state.mode === 'tutorial' && <TutorialPanel step={state.tutorialStep} />}
      <div className="app__main">
        <Board
          state={state}
          selectedCard={selectedCard}
          rotation={rotation}
          onPlace={onPlace}
          guideCells={guideCells}
          isOriginAllowed={isOriginAllowed}
        />
        <Hand
          hand={state.hand}
          selectedCardId={selectedCard?.id ?? null}
          rotation={rotation}
          onSelect={onSelect}
          onRotate={onRotate}
          nextCard={peekNextCard(state)}
          lockedCardId={tutorialGuide?.requiredCardId ?? null}
          allowRotate={tutorialGuide ? tutorialGuide.allowRotate : true}
          highlightRotate={Boolean(
            tutorialGuide?.allowRotate &&
              selectedCard &&
              rotation !== tutorialGuide.requiredRotation,
          )}
        />
      </div>
      <footer className="app__footer">
        <button type="button" className="btn btn-ghost" onClick={goMenu}>
          主界面
        </button>
        {state.mode !== 'tutorial' && (
          <button type="button" className="btn btn-ghost" onClick={restart}>
            重新开始
          </button>
        )}
        <span>
          {state.mode === 'mission' && state.mission
            ? `目标：三色达标，坏果不超过 ${state.mission.maxRotten} 个 · 9 种牌各 1 张`
            : state.mode === 'infinite'
              ? `9 种牌循环洗入，共 ${state.deckLimit} 张`
              : '跟随金色高亮完成强制引导'}
        </span>
      </footer>
      {state.phase === 'finished' && (
        <GameOver state={state} onRestart={restart} onMenu={goMenu} />
      )}
    </div>
  )
}
