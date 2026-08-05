import { FRUIT_NAME, getRank } from '../game/scoring'
import type { FruitColor, GameState } from '../game/types'
import './ScoreBar.css'

type Props = {
  state: GameState
}

const COLORS: FruitColor[] = ['apple', 'lemon', 'plum']

const MODE_LABEL = {
  tutorial: '教学模式',
  mission: '任务模式',
  infinite: '无限模式',
} as const

export function ScoreBar({ state }: Props) {
  const rank = getRank(state.score)
  const totalCards = state.deckLimit
  const placed = state.placements.length

  return (
    <header className="score-bar">
      <div className="score-bar__brand">
        <h1>Orchard</h1>
        <span>{MODE_LABEL[state.mode]}</span>
      </div>
      <div className="score-bar__stats">
        <div className="stat">
          <span className="stat__label">得分</span>
          <strong className="stat__value">{state.score}</strong>
        </div>
        {COLORS.map((color) => (
          <div key={color} className={`stat color-${color}`}>
            <span className="stat__label">{FRUIT_NAME[color]}</span>
            <strong className="stat__value">
              {state.colorScores[color]}
              {state.mission ? (
                <span className="stat__goal">/{state.mission[color]}</span>
              ) : null}
            </strong>
          </div>
        ))}
        <div className="stat">
          <span className="stat__label">坏果</span>
          <strong className="stat__value rotten">
            {state.rottenCount}
            {state.mission ? (
              <span className="stat__goal">/{state.mission.maxRotten}</span>
            ) : null}
          </strong>
        </div>
        <div className="stat">
          <span className="stat__label">牌堆</span>
          <strong className="stat__value">{state.deck.length}</strong>
        </div>
        <div className="stat">
          <span className="stat__label">已放置</span>
          <strong className="stat__value">
            {placed}/{totalCards}
          </strong>
        </div>
        {state.mode === 'infinite' && (
          <div className="stat rank">
            <span className="stat__label">评价</span>
            <strong className="stat__value">{rank.titleZh}</strong>
          </div>
        )}
      </div>
    </header>
  )
}
