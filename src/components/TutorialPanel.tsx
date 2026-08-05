import { getTutorialGuide, TUTORIAL_DONE, TUTORIAL_GUIDES } from '../game/tutorial'
import './TutorialPanel.css'

type Props = {
  step: number
}

export function TutorialPanel({ step }: Props) {
  const done = step >= TUTORIAL_GUIDES.length
  const current = getTutorialGuide(step)

  return (
    <div className="tutorial-panel">
      <div className="tutorial-panel__progress">
        {TUTORIAL_GUIDES.map((s, i) => (
          <span
            key={s.id}
            className={`tutorial-dot${i < step ? ' is-done' : ''}${i === step ? ' is-active' : ''}`}
          />
        ))}
      </div>
      {done || !current ? (
        <>
          <h3>{TUTORIAL_DONE.title}</h3>
          <p>{TUTORIAL_DONE.body}</p>
        </>
      ) : (
        <>
          <h3>{current.title}</h3>
          <p>{current.body}</p>
          <p className="tutorial-panel__action">{current.highlightHint}</p>
        </>
      )}
    </div>
  )
}
