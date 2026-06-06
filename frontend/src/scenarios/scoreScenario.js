/**
 * Scenario scoring — pure evaluation of a rubric against the live rig context.
 *
 * Returns per-objective pass/fail plus the overall completion + medal:
 *   - not all required passed  → not complete, medal: null
 *   - all required passed      → complete
 *       · no stretch goals, or all stretch passed → 'gold'
 *       · some (but not all) stretch passed        → 'silver'
 *       · zero stretch passed                       → 'bronze'
 */

export const MEDAL_RANK = { bronze: 1, silver: 2, gold: 3 }

function evaluate(criteria, ctx) {
  return criteria.map(c => ({
    id: c.id,
    label: c.label,
    passed: Boolean(c.check(ctx)),
    value: c.format ? c.format(ctx) : '',
  }))
}

export function scoreScenario(scenario, ctx) {
  const required = evaluate(scenario.required ?? [], ctx)
  const stretch = evaluate(scenario.stretch ?? [], ctx)

  const requiredMet = required.every(r => r.passed)
  const stretchPassed = stretch.filter(s => s.passed).length
  const stretchTotal = stretch.length

  let medal = null
  if (requiredMet) {
    if (stretchTotal === 0 || stretchPassed === stretchTotal) medal = 'gold'
    else if (stretchPassed > 0) medal = 'silver'
    else medal = 'bronze'
  }

  return {
    required,
    stretch,
    requiredMet,
    complete: requiredMet,
    stretchPassed,
    stretchTotal,
    medal,
  }
}

/** Return the higher-ranked of two medals (either may be null). */
export function bestMedal(a, b) {
  if (!a) return b ?? null
  if (!b) return a
  return MEDAL_RANK[a] >= MEDAL_RANK[b] ? a : b
}
