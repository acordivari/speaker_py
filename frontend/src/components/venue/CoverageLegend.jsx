import useStore from '../../store/useStore'
import { LEGEND_TICKS, splToColor, splToFraction } from './coverageScale'

/**
 * Color-scale legend plus the headline coverage statistics. Rendered in normal
 * document flow beneath the venue SVG (not an absolute overlay), so the dB
 * labels stay legible in both themes.
 */
export default function CoverageLegend() {
  const coverageResult      = useStore(s => s.coverageResult)
  const showCoverage        = useStore(s => s.showCoverage)
  const coverageError       = useStore(s => s.coverageError)
  const isComputingCoverage = useStore(s => s.isComputingCoverage)

  if (!showCoverage) return null

  // A failed fetch leaves no heatmap at all — say so rather than rendering
  // nothing. The next channel change retries automatically.
  if (coverageError && !coverageResult) {
    return (
      <div
        className="px-3 py-2 flex-shrink-0 border-t border-venue-border"
        data-testid="coverage-error"
      >
        <p className="text-[10px] font-mono" style={{ color: '#ffb300' }}>
          ⚠ SPL map unavailable — {coverageError}. Retries on your next change.
        </p>
      </div>
    )
  }

  if (!coverageResult) {
    if (!isComputingCoverage) return null
    return (
      <div className="px-3 py-2 flex-shrink-0 border-t border-venue-border">
        <p className="text-[10px] font-mono animate-pulse" style={{ color: 'var(--color-muted)' }}>
          Computing SPL map…
        </p>
      </div>
    )
  }

  const { stats } = coverageResult
  const hasSources = stats.active_source_count > 0

  // Build the gradient from the same hue ramp the heatmap uses.
  const gradient = `linear-gradient(to right, ${LEGEND_TICKS.map(
    db => `${splToColor(db, 1)} ${splToFraction(db) * 100}%`,
  ).join(', ')})`

  const fmt = v => (v == null ? '—' : `${Math.round(v)} dB`)

  return (
    <div
      className="px-3 py-2 flex-shrink-0 border-t border-venue-border"
      data-testid="coverage-legend"
    >
      {hasSources ? (
        <>
          {/* Headline stats */}
          <div
            className="flex items-center gap-x-3 gap-y-0.5 flex-wrap text-[10px] font-mono"
            style={{ color: 'var(--color-text-2)' }}
          >
            <span>FOH <strong style={{ color: 'var(--color-text)' }}>{fmt(stats.foh_spl_db)}</strong></span>
            <span>Front <strong style={{ color: 'var(--color-text)' }}>{fmt(stats.front_row_spl_db)}</strong></span>
            <span>Back <strong style={{ color: 'var(--color-text)' }}>{fmt(stats.back_wall_spl_db)}</strong></span>
            <span title="Front-to-back variation (p90 − p10). Lower is more even.">
              Δ <strong style={{ color: 'var(--color-text)' }}>{fmt(stats.uniformity_db)}</strong>
            </span>
          </div>

          {/* Gradient scale */}
          <div className="mt-1.5">
            <div className="h-2 rounded-sm" style={{ background: gradient }} />
            <div
              className="flex justify-between mt-0.5 text-[8px] font-mono"
              style={{ color: 'var(--color-muted)' }}
            >
              {LEGEND_TICKS.map(db => (
                <span key={db}>{db}</span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>
          {coverageResult.summary}
        </p>
      )}
    </div>
  )
}
