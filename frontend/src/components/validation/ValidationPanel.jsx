import useStore from '../../store/useStore'
import IssueCard from './IssueCard'

function MetricRow({ label, value, unit, color }) {
  return (
    <div className="flex items-baseline justify-between py-0.5">
      <span className="text-[9px] font-mono text-venue-muted">{label}</span>
      <span className="text-xs font-mono font-bold" style={{ color: color ?? '#e2e8f0' }}>
        {value}
        {unit && <span className="text-[9px] font-normal text-venue-muted ml-1">{unit}</span>}
      </span>
    </div>
  )
}

export default function ValidationPanel() {
  const validationResult = useStore(s => s.validationResult)
  const isValidating     = useStore(s => s.isValidating)
  const validationError  = useStore(s => s.validationError)
  const validate         = useStore(s => s.validate)

  // Flatten all issues across all channels
  const allIssues = validationResult
    ? [
        ...validationResult.global_issues,
        ...validationResult.channel_results.flatMap(ch =>
          ch.issues.map(issue => ({
            ...issue,
            channelLabel: ch.label,
          }))
        ),
      ]
    : []

  const errors   = allIssues.filter(i => i.severity === 'error')
  const warnings = allIssues.filter(i => i.severity === 'warning')
  const infos    = allIssues.filter(i => i.severity === 'info')

  const statusColor = !validationResult
    ? '#4a4a6a'
    : validationResult.is_valid
      ? errors.length === 0 && warnings.length === 0
        ? '#00ff88'
        : '#ffb300'
      : '#ff3d00'

  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-venue-border flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-venue-muted uppercase tracking-widest">
            Validation
          </span>
          <button
            onClick={validate}
            disabled={isValidating}
            className="text-[9px] font-mono px-2 py-0.5 rounded border transition-colors"
            style={{
              borderColor: '#00e5ff44',
              color:       isValidating ? '#3a3a5a' : '#00e5ff',
              background:  isValidating ? 'transparent' : '#00e5ff0a',
            }}
          >
            {isValidating ? 'CHECKING…' : '↻ RE-RUN'}
          </button>
        </div>

        {/* Status bar */}
        <div
          className="rounded px-3 py-2 border text-xs font-mono font-bold tracking-wider text-center"
          style={{
            borderColor: statusColor + '44',
            color:       statusColor,
            background:  statusColor + '0d',
          }}
        >
          {isValidating
            ? '⟳  VALIDATING…'
            : !validationResult
              ? '— DRAG COMPONENTS TO BEGIN —'
              : validationResult.is_valid
                ? '✔  SYSTEM VALID'
                : `✖  ${errors.length} ERROR${errors.length !== 1 ? 'S' : ''}  ·  ${warnings.length} WARN`
          }
        </div>

        {/* Counters */}
        {validationResult && (
          <div className="flex gap-3 mt-2">
            {errors.length > 0 && (
              <span className="badge-error">{errors.length} error{errors.length !== 1 && 's'}</span>
            )}
            {warnings.length > 0 && (
              <span className="badge-warning">{warnings.length} warn{warnings.length !== 1 && 'ings'}</span>
            )}
            {errors.length === 0 && warnings.length === 0 && (
              <span className="badge-ok">✔ clean</span>
            )}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* System metrics */}
        {validationResult && (
          <div className="px-3 py-2 border-b border-venue-border">
            <div className="text-[9px] font-mono text-venue-muted uppercase tracking-widest mb-1">
              System Metrics
            </div>
            <MetricRow
              label="Total speaker load"
              value={validationResult.system_metrics.total_speaker_rms_watts.toLocaleString()}
              unit="W RMS"
            />
            <MetricRow
              label="Total amp output"
              value={validationResult.system_metrics.total_amp_output_watts.toLocaleString()}
              unit="W"
              color="#ffb300"
            />
            <MetricRow
              label="Channels configured"
              value={validationResult.system_metrics.total_channels}
            />
            {validationResult.system_metrics.estimated_max_spl_db && (
              <MetricRow
                label="Est. system SPL"
                value={validationResult.system_metrics.estimated_max_spl_db}
                unit="dB SPL"
                color="#00ff88"
              />
            )}
          </div>
        )}

        {/* Summary sentence */}
        {validationResult && (
          <div className="px-3 py-2 border-b border-venue-border">
            <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
              {validationResult.summary}
            </p>
          </div>
        )}

        {/* Per-channel results */}
        {validationResult && validationResult.channel_results.length > 0 && (
          <div className="px-3 py-2 border-b border-venue-border">
            <div className="text-[9px] font-mono text-venue-muted uppercase tracking-widest mb-2">
              Per-Channel Metrics
            </div>
            <div className="space-y-1">
              {validationResult.channel_results.map((ch, i) => {
                const ok = ch.is_valid
                const dot = ok ? '#00ff88' : '#ff3d00'
                return (
                  <div key={i}
                       className="flex items-center gap-2 text-[9px] font-mono py-0.5">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                         style={{ backgroundColor: dot }} />
                    <span className="text-slate-300 flex-1 truncate">{ch.label}</span>
                    {ch.total_speaker_impedance_ohms != null && (
                      <span className="text-venue-muted flex-shrink-0">
                        {ch.total_speaker_impedance_ohms.toFixed(1)}Ω
                      </span>
                    )}
                    {ch.power_ratio != null && (
                      <span
                        className="flex-shrink-0"
                        style={{
                          color: ch.power_ratio > 4
                            ? '#ff3d00'
                            : ch.power_ratio > 2 || ch.power_ratio < 0.5
                              ? '#ffb300'
                              : '#00ff88',
                        }}
                      >
                        {ch.power_ratio.toFixed(1)}×
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Issue cards */}
        {allIssues.length > 0 && (
          <div className="px-3 py-2 space-y-2">
            <div className="text-[9px] font-mono text-venue-muted uppercase tracking-widest">
              Issues — click to expand explanation
            </div>
            {[...errors, ...warnings, ...infos].map((issue, i) => (
              <div key={i}>
                {issue.channelLabel && (
                  <div className="text-[8px] font-mono text-venue-muted mb-0.5 ml-1">
                    {issue.channelLabel}
                  </div>
                )}
                <IssueCard issue={issue} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!validationResult && !isValidating && (
          <div className="flex flex-col items-center justify-center h-48 text-venue-muted font-mono text-xs text-center px-6 gap-3">
            <div className="text-3xl opacity-20">⚡</div>
            <div>
              <div className="font-bold mb-1">No configuration yet</div>
              <div className="text-[10px] opacity-60 leading-relaxed">
                Drag components from the library into the channel slots below the venue map.
                Validation runs automatically.
              </div>
            </div>
          </div>
        )}

        {validationError && (
          <div className="px-3 py-3 text-xs font-mono text-red-400">
            Validation error: {validationError}
          </div>
        )}
      </div>
    </div>
  )
}
