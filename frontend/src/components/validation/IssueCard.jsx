import { useState } from 'react'

const SEVERITY_STYLES = {
  error:   { badge: 'badge-error',   icon: '✖', borderColor: '#ff3d0044' },
  warning: { badge: 'badge-warning', icon: '⚠', borderColor: '#ffb30044' },
  info:    { badge: 'badge-info',    icon: 'ℹ', borderColor: '#2980b944' },
}

export default function IssueCard({ issue }) {
  const [expanded, setExpanded] = useState(false)
  const style = SEVERITY_STYLES[issue.severity] ?? SEVERITY_STYLES.info

  return (
    <div
      className="rounded border text-xs font-mono overflow-hidden transition-all duration-200"
      style={{
        borderColor: style.borderColor,
        background:  `linear-gradient(135deg, #161626 0%, #1e1e36 100%)`,
      }}
    >
      {/* Summary row */}
      <button
        className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className={style.badge}>{style.icon} {issue.severity.toUpperCase()}</span>
        <span className="flex-1 text-slate-300 leading-snug">{issue.message}</span>
        <span className="flex-shrink-0 text-venue-muted mt-0.5">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Educational detail */}
      {expanded && (
        <div className="border-t px-3 py-2 space-y-2 animate-fade-in"
             style={{ borderColor: style.borderColor }}>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-venue-muted mb-1">
              Why this matters
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed whitespace-pre-line">
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
          <div className="text-[9px] text-venue-muted opacity-50">
            Code: {issue.code}
          </div>
        </div>
      )}
    </div>
  )
}
