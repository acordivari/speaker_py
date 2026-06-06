import { useEffect } from 'react'
import useStore from '../../store/useStore'
import { getScenario } from '../../scenarios/scenarios'
import { scoreScenario } from '../../scenarios/scoreScenario'

const GREEN = '#00ff88'

export const MEDAL_META = {
  gold:   { label: 'GOLD',   color: '#ffd24a', icon: '🥇' },
  silver: { label: 'SILVER', color: '#c9d2e3', icon: '🥈' },
  bronze: { label: 'BRONZE', color: '#cd7f32', icon: '🥉' },
}

function Objective({ o }) {
  return (
    <li className="flex items-baseline gap-2 text-[10px] font-mono leading-snug">
      <span aria-hidden style={{ color: o.passed ? GREEN : 'var(--color-text-dim)' }}>
        {o.passed ? '☑' : '☐'}
      </span>
      <span className="flex-1" style={{ color: o.passed ? 'var(--color-text)' : 'var(--color-text-3)' }}>
        {o.label}
      </span>
      <span className="flex-shrink-0" style={{ color: o.passed ? GREEN : 'var(--color-muted)' }}>
        {o.value}
      </span>
    </li>
  )
}

/**
 * Active mission bar. Lives full-width below the header and grades the live rig
 * against the scenario rubric on every change (no submit button). Renders
 * nothing when no scenario is active.
 */
export default function ScenarioBar() {
  const activeScenarioId = useStore(s => s.activeScenarioId)
  const channels         = useStore(s => s.channels)
  const validation       = useStore(s => s.validationResult)
  const coverage         = useStore(s => s.coverageResult)
  const exitScenario     = useStore(s => s.exitScenario)
  const recordCompletion = useStore(s => s.recordCompletion)

  const scenario = getScenario(activeScenarioId)
  const result = scenario ? scoreScenario(scenario, { channels, validation, coverage }) : null

  // Persist completion (best medal kept) whenever the scenario is complete.
  useEffect(() => {
    if (scenario && result?.complete) recordCompletion(scenario.id, result.medal)
  }, [scenario, result?.complete, result?.medal, recordCompletion])

  if (!scenario || !result) return null

  const medal = result.medal ? MEDAL_META[result.medal] : null
  const reqMet = result.required.filter(r => r.passed).length

  return (
    <div className="px-3 pt-3 flex-shrink-0">
      <div
        className="panel px-3 py-2"
        style={result.complete ? { borderColor: `${GREEN}88`, boxShadow: `0 0 16px ${GREEN}22` } : undefined}
        data-testid="scenario-bar"
      >
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ color: '#00e5ff', border: '1px solid #00e5ff44', background: '#00e5ff11' }}
          >
            Mission {scenario.order}
          </span>
          <span className="text-xs font-bold font-mono" style={{ color: 'var(--color-text)' }}>
            {scenario.title}
          </span>
          <span className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>
            · {scenario.concept}
          </span>

          {result.complete ? (
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
              style={{ color: medal.color, border: `1px solid ${medal.color}66`, background: `${medal.color}14` }}
            >
              {medal.icon} COMPLETE · {medal.label}
            </span>
          ) : (
            <span className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>
              {reqMet}/{result.required.length} objectives
            </span>
          )}

          <button
            onClick={exitScenario}
            aria-label="Exit mission"
            className="ml-auto flex-shrink-0 text-[10px] font-mono px-2 py-1 rounded"
            style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
          >
            × Exit
          </button>
        </div>

        {/* Brief */}
        <p className="mt-1.5 text-[10px] leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
          {scenario.brief}
        </p>

        {/* Objectives */}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          <div>
            <div className="text-[8px] uppercase tracking-widest text-venue-muted mb-1">Required</div>
            <ul className="space-y-0.5">
              {result.required.map(o => <Objective key={o.id} o={o} />)}
            </ul>
          </div>
          {result.stretch.length > 0 && (
            <div>
              <div className="text-[8px] uppercase tracking-widest text-venue-muted mb-1">
                Stretch · for gold
              </div>
              <ul className="space-y-0.5">
                {result.stretch.map(o => <Objective key={o.id} o={o} />)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
