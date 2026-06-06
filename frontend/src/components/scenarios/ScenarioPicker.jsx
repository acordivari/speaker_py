import { useState, useEffect } from 'react'
import useStore from '../../store/useStore'
import { SCENARIOS } from '../../scenarios/scenarios'
import { MEDAL_META } from './ScenarioBar'

/**
 * Mission picker modal. Lists the guided scenarios with their concept, brief,
 * and any earned medal. Starting a mission optionally clears the stage first
 * (objectives-over-free-sandbox: the student builds the rig themselves).
 */
export default function ScenarioPicker({ onClose }) {
  const startScenario = useStore(s => s.startScenario)
  const resetAll      = useStore(s => s.resetAll)
  const completed     = useStore(s => s.completedScenarios)
  const [cleanStart, setCleanStart] = useState(true)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const begin = id => {
    if (cleanStart) resetAll()
    startScenario(id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: '#000000cc', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-label="Choose a mission"
    >
      <div
        className="relative flex flex-col overflow-hidden rounded-xl border"
        style={{
          width: 'min(94vw, 720px)', maxHeight: '88vh',
          background: 'var(--color-surface-alt)', borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
             style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00e5ff' }}>
              Missions
            </div>
            <div className="text-sm font-bold font-mono" style={{ color: 'var(--color-text)' }}>
              Guided training scenarios
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close missions"
            className="w-9 h-9 rounded flex items-center justify-center font-mono text-lg hover:bg-white/10"
            style={{ color: 'var(--color-muted)' }}
          >
            ×
          </button>
        </div>

        {/* Clean-start toggle */}
        <label className="flex items-center gap-2 px-5 py-2 text-[10px] font-mono cursor-pointer flex-shrink-0 border-b"
               style={{ color: 'var(--color-text-2)', borderColor: 'var(--color-border-dim)' }}>
          <input
            type="checkbox"
            checked={cleanStart}
            onChange={e => setCleanStart(e.target.checked)}
          />
          Start with a clean stage (clear all current components)
        </label>

        {/* Scenario list */}
        <div className="overflow-y-auto p-3 space-y-2">
          {SCENARIOS.map(s => {
            const medal = completed[s.id] ? MEDAL_META[completed[s.id]] : null
            return (
              <div
                key={s.id}
                className="rounded border p-3"
                style={{ borderColor: 'var(--color-border-dim)', background: 'var(--color-panel)' }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                        style={{ color: '#00e5ff', border: '1px solid #00e5ff44' }}>
                    Mission {s.order}
                  </span>
                  <span className="text-xs font-bold font-mono" style={{ color: 'var(--color-text)' }}>
                    {s.title}
                  </span>
                  {medal && (
                    <span className="text-[9px] font-mono font-bold" style={{ color: medal.color }}>
                      {medal.icon} {medal.label}
                    </span>
                  )}
                  <button
                    onClick={() => begin(s.id)}
                    aria-label={`${medal ? 'Replay' : 'Start'} ${s.title}`}
                    className="ml-auto text-[10px] font-mono font-bold tracking-wider px-3 py-1 rounded border"
                    style={{ color: '#00e5ff', borderColor: '#00e5ff66', background: '#00e5ff11' }}
                  >
                    {medal ? 'Replay' : 'Start'} ▸
                  </button>
                </div>
                <div className="text-[9px] font-mono mt-1" style={{ color: 'var(--color-muted)' }}>
                  {s.concept}
                </div>
                <p className="text-[10px] leading-relaxed mt-1" style={{ color: 'var(--color-text-2)' }}>
                  {s.brief}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
