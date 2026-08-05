import { CardView } from './CardView'
import type { CardDef, Rotation } from '../game/types'
import './Hand.css'

type Props = {
  hand: CardDef[]
  selectedCardId: string | null
  rotation: Rotation
  onSelect: (cardId: string) => void
  onRotate: () => void
  nextCard?: CardDef | null
  /** 教学：只允许点这张牌 */
  lockedCardId?: string | null
  allowRotate?: boolean
  highlightRotate?: boolean
}

export function Hand({
  hand,
  selectedCardId,
  rotation,
  onSelect,
  onRotate,
  nextCard = null,
  lockedCardId = null,
  allowRotate = true,
  highlightRotate = false,
}: Props) {
  return (
    <aside className="hand-panel">
      <div className="hand-panel__header">
        <h2>手牌</h2>
        <button
          type="button"
          className={`btn${highlightRotate ? ' is-guide-btn' : ''}`}
          onClick={onRotate}
          disabled={!selectedCardId || !allowRotate}
        >
          旋转 90°
        </button>
      </div>
      <p className="hand-panel__hint">
        {lockedCardId
          ? '请使用高亮手牌，放到棋盘金色区域。'
          : '选一张牌，移动到棋盘预览，点击合法位置放置。'}
      </p>
      <div className="hand-panel__cards">
        {hand.map((card) => {
          const lockedOut = lockedCardId !== null && card.id !== lockedCardId
          const guided = lockedCardId === card.id
          return (
            <div
              key={card.id}
              className={`hand-panel__card-wrap${guided ? ' is-guided' : ''}${lockedOut ? ' is-locked-out' : ''}`}
            >
              <CardView
                card={card}
                rotation={selectedCardId === card.id ? rotation : 0}
                selected={selectedCardId === card.id}
                onClick={lockedOut ? undefined : () => onSelect(card.id)}
              />
            </div>
          )
        })}
        {hand.length === 0 && <p className="hand-panel__empty">手牌已打完</p>}
      </div>

      {nextCard && (
        <div className="hand-panel__next">
          <h3>下一张</h3>
          <CardView card={nextCard} compact />
        </div>
      )}

      {selectedCardId && (
        <div className="hand-panel__preview">
          <span>当前朝向：{rotation}°</span>
        </div>
      )}
    </aside>
  )
}
