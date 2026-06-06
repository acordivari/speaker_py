/**
 * Scenario criteria — pure, declarative objective factories.
 *
 * Each factory returns a criterion:
 *   { id, label, check(ctx) → boolean, format(ctx) → string }
 *
 * `ctx` is the live evaluation context:
 *   { channels, validation, coverage }
 *     channels   — store channels (positionKey, amp, speakers, limiterMode, …)
 *     validation — ValidationResponse | null
 *     coverage   — CoverageResponse | null
 *
 * `check` decides pass/fail; `format` returns the current measured value for the
 * live readout. Everything here is side-effect-free so it's trivially testable
 * and re-runs cheaply on every rig change (live auto-grading).
 */

const HARDWARE_LIMITERS = new Set(['amp_dsp', 'external_rack'])

// ── Shared accessors ─────────────────────────────────────────────────────────

export function allIssues(validation) {
  if (!validation) return []
  const perChannel = validation.channel_results.flatMap(r => r.issues || [])
  return [...perChannel, ...(validation.global_issues || [])]
}

export function countSeverity(validation, severity) {
  return allIssues(validation).filter(i => i.severity === severity).length
}

export function activeChannels(channels) {
  return channels.filter(ch => ch.amp || ch.speakers.length > 0)
}

function stat(coverage, key) {
  return coverage?.stats?.[key] ?? null
}

function dbText(v) {
  return v == null ? '—' : `${Math.round(v)} dB`
}

// ── Criterion factories ──────────────────────────────────────────────────────

/** No error-severity issues (warnings are allowed). Requires something built. */
export function noErrors() {
  return {
    id: 'no-errors',
    label: 'No configuration errors',
    check: ({ validation }) => !!validation && countSeverity(validation, 'error') === 0,
    format: ({ validation }) =>
      validation ? `${countSeverity(validation, 'error')} errors` : 'nothing built',
  }
}

/** No warnings either — a fully clean bill of health. */
export function noWarnings() {
  return {
    id: 'no-warnings',
    label: 'No warnings',
    check: ({ validation }) => !!validation && countSeverity(validation, 'warning') === 0,
    format: ({ validation }) =>
      validation ? `${countSeverity(validation, 'warning')} warnings` : '—',
  }
}

/** At least `n` radiating cabinets reach the audience. */
export function minActiveSources(n) {
  return {
    id: `min-sources-${n}`,
    label: `At least ${n} speaker${n === 1 ? '' : 's'} covering the audience`,
    check: ({ coverage }) => (stat(coverage, 'active_source_count') ?? 0) >= n,
    format: ({ coverage }) => `${stat(coverage, 'active_source_count') ?? 0} sources`,
  }
}

/** Back-of-floor SPL at or above `db`. */
export function backWallAtLeast(db) {
  return {
    id: `back-wall-${db}`,
    label: `Back wall ≥ ${db} dB SPL`,
    check: ({ coverage }) => (stat(coverage, 'back_wall_spl_db') ?? -Infinity) >= db,
    format: ({ coverage }) => dbText(stat(coverage, 'back_wall_spl_db')),
  }
}

/** FOH SPL at or above `db`. */
export function fohAtLeast(db) {
  return {
    id: `foh-${db}`,
    label: `FOH ≥ ${db} dB SPL`,
    check: ({ coverage }) => (stat(coverage, 'foh_spl_db') ?? -Infinity) >= db,
    format: ({ coverage }) => dbText(stat(coverage, 'foh_spl_db')),
  }
}

/** Front-to-back evenness: p90−p10 spread at or below `db`. */
export function uniformityAtMost(db) {
  return {
    id: `uniformity-${db}`,
    label: `Front-to-back variation ≤ ${db} dB`,
    check: ({ coverage }) => {
      const u = stat(coverage, 'uniformity_db')
      return u != null && u <= db
    },
    format: ({ coverage }) => dbText(stat(coverage, 'uniformity_db')),
  }
}

/** Every named venue position holds at least one component. */
export function positionsFilled(positionKeys, label) {
  const keys = Array.isArray(positionKeys) ? positionKeys : [positionKeys]
  return {
    id: `positions-${keys.join('-')}`,
    label: label ?? `Fill: ${keys.join(', ')}`,
    check: ({ channels }) =>
      keys.every(k => {
        const ch = channels.find(c => c.positionKey === k)
        return ch && (ch.amp || ch.speakers.length > 0)
      }),
    format: ({ channels }) => {
      const filled = keys.filter(k => {
        const ch = channels.find(c => c.positionKey === k)
        return ch && (ch.amp || ch.speakers.length > 0)
      }).length
      return `${filled}/${keys.length} placed`
    },
  }
}

/**
 * Every active channel is safe: its amp/speaker power ratio is within `maxRatio`,
 * OR it carries a hardware limiter (amp DSP / external rack). Teaches that
 * over-powering is acceptable only when protected.
 */
export function everyChannelProtected(maxRatio) {
  return {
    id: `protected-${maxRatio}`,
    label: `Every channel ≤ ${maxRatio}× or hardware-limited`,
    check: ({ channels, validation }) => {
      if (!validation) return false
      const limiterByLabel = new Map(channels.map(ch => [ch.label, ch.limiterMode]))
      const active = validation.channel_results.filter(r => r.amplifier || r.speakers.length > 0)
      if (active.length === 0) return false
      return active.every(r => {
        const ratio = r.power_ratio
        const limited = HARDWARE_LIMITERS.has(limiterByLabel.get(r.label))
        return ratio == null || ratio <= maxRatio || limited
      })
    },
    format: ({ validation }) => {
      if (!validation) return '—'
      const ratios = validation.channel_results
        .map(r => r.power_ratio)
        .filter(v => v != null)
      if (ratios.length === 0) return 'no ratios'
      return `max ${Math.max(...ratios).toFixed(1)}×`
    },
  }
}
