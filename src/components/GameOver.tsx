import { FRUIT_NAME, getRank } from '../game/scoring'
import type { FruitColor, GameState } from '../game/types'
import './GameOver.css'

type Props = {
  state: GameState
  onRestart: () => void
  onMenu: () => void
}

const COLORS: FruitColor[] = ['apple', 'lemon', 'plum']

export function GameOver({ state, onRestart, onMenu }: Props) {
  const rank = getRank(state.score)
  const won = state.outcome === 'won'
  const lost = state.outcome === 'lost'

  let title = '本局结束'
  let headline = `总得分 ${state.score}`
  let sub = `${rank.titleZh}（${rank.title}）`

  if (state.mode === 'tutorial') {
    title = '教程完成'
    headline = '基础规则已掌握'
    sub = '可以去挑战任务或无限模式了'
  } else if (state.mode === 'mission') {
    title = won ? '任务成功' : '任务失败'
    headline = won ? '目标全部达成！' : lost ? '未能完成目标' : '本局结束'
    if (state.mission && lost && state.rottenCount > state.mission.maxRotten) {
      sub = `坏果超过上限（${state.rottenCount}/${state.mission.maxRotten}）`
    } else if (won) {
      sub = `得分 ${state.score}`
    } else {
      sub = '牌已用尽，三色目标未全部达成'
    }
  } else if (state.mode === 'infinite') {
    title = '卡组耗尽'
    headline = `总得分 ${state.score}`
    sub = `${rank.titleZh}（${rank.title}）`
  }

  return (
    <div className="game-over">
      <div className={`game-over__card${won ? ' is-won' : ''}${lost ? ' is-lost' : ''}`}>
        <p className="game-over__eyebrow">{title}</p>
        <h2>{headline}</h2>
        <p className="game-over__rank">{sub}</p>

        {state.mission && (
          <dl className="game-over__meta">
            {COLORS.map((color) => (
              <div key={color}>
                <dt>{FRUIT_NAME[color]}</dt>
                <dd>
                  {state.colorScores[color]} / {state.mission![color]}
                </dd>
              </div>
            ))}
            <div>
              <dt>坏果</dt>
              <dd>
                {state.rottenCount} / {state.mission.maxRotten}
              </dd>
            </div>
          </dl>
        )}

        {!state.mission && (
          <dl className="game-over__meta">
            <div>
              <dt>坏果</dt>
              <dd>
                {state.rottenCount} × 3 = −{state.rottenCount * 3}
              </dd>
            </div>
            <div>
              <dt>放置卡牌</dt>
              <dd>
                {state.placements.length}/{state.deckLimit}
              </dd>
            </div>
          </dl>
        )}

        <div className="game-over__actions">
          {state.mode !== 'tutorial' && (
            <button type="button" className="btn btn-primary" onClick={onRestart}>
              再来一局
            </button>
          )}
          <button type="button" className="btn" onClick={onMenu}>
            返回主界面
          </button>
        </div>
      </div>
    </div>
  )
}
