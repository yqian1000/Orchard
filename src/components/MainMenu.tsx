import './MainMenu.css'

type Props = {
  onSelect: (mode: 'tutorial' | 'mission' | 'infinite') => void
}

const MODES = [
  {
    id: 'tutorial' as const,
    title: '教学模式',
    desc: '学习放置、果实得分与坏果规则',
  },
  {
    id: 'mission' as const,
    title: '任务模式',
    desc: '达成三色果实目标，坏果超限即失败',
  },
  {
    id: 'infinite' as const,
    title: '无限模式',
    desc: '9 种牌循环洗入约百张，打完冲高分',
  },
]

export function MainMenu({ onSelect }: Props) {
  return (
    <div className="main-menu">
      <div className="main-menu__hero">
        <p className="main-menu__eyebrow">九卡拼叠 · 果园经营</p>
        <h1>Orchard</h1>
        <p className="main-menu__subtitle">果园九树</p>
        <p className="main-menu__lead">
          将卡牌重叠同色果树收获骰子，避开坏果，种出你的高分果园。
        </p>
      </div>
      <div className="main-menu__actions">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className="main-menu__btn"
            onClick={() => onSelect(mode.id)}
          >
            <span className="main-menu__btn-title">{mode.title}</span>
            <span className="main-menu__btn-desc">{mode.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
