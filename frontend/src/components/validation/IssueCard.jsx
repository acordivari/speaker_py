import { useState } from 'react'
import { getFaultProfile } from '../../audio/faultProfiles'
import AuditionControl from './AuditionControl'

const SEVERITY_STYLES = {
  error:   { badge: 'badge-error',   icon: '✖', borderColor: '#ff3d0044' },
  warning: { badge: 'badge-warning', icon: '⚠', borderColor: '#ffb30044' },
  info:    { badge: 'badge-info',    icon: 'ℹ', borderColor: '#2980b944' },
}

export default function IssueCard({ issue }) {
  const [expanded, setExpanded] = useState(false)
  const style = SEVERITY_STYLES[issue.severity] ?? SEVERITY_STYLES.info
  const profile = getFaultProfile(issue.code)

  return (
    <div
      className="rounded border text-xs font-mono overflow-hidden transition-all duration-200"
      style={{
        borderColor: style.borderColor,
        background:  `linear-gradient(135deg, var(--color-panel) 0%, var(--color-surface) 100%)`,
      }}
    >
      {/* Summary row — toggle and audition control are siblings (no nested buttons) */}
      <div className="flex items-start gap-2 px-3 py-2">
        <button
          className="flex items-start gap-2 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
          onClick={() => setExpanded(e => !e)}
          aria-expanded={expanded}
        >
          <span className={style.badge}>{style.icon} {issue.severity.toUpperCase()}</span>
          <span className="flex-1 leading-snug" style={{ color: 'var(--color-text)' }}>{issue.message}</span>
        </button>

        {profile && <AuditionControl code={issue.code} />}

        <button
          className="flex-shrink-0 mt-0.5"
          style={{ color: 'var(--color-muted)' }}
          onClick={() => setExpanded(e => !e)}
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Educational detail */}
      {expanded && (
        <div className="border-t px-3 py-2 space-y-2 animate-fade-in"
             style={{ borderColor: style.borderColor }}>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-venue-muted mb-1">
              Why this matters
            </div>
            <p className="text-[10px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--color-text-2)' }}>
              {issue.educational_explanation}
            </p>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-venue-muted mb-1">
              Recommendation
            </div>
            <p className="text-brand-cyan text-[10px] leading-relaxed">
              {issue.recommendation}
            </p>
          </div>
          {profile && (
            <div>
              <div className="text-[9px] uppercase tracking-widest text-venue-muted mb-1">
                Hear the fault
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
                {profile.blurb}
              </p>
            </div>
          )}
          <div className="text-[9px] text-slate-500">
            Code: {issue.code}
          </div>
        </div>
      )}
    </div>
  )
}
