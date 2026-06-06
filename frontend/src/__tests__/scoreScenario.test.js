/**
 * Scenario scoring + medal tier tests (pure).
 */
import { describe, it, expect } from 'vitest'
import { scoreScenario, bestMedal } from '../scenarios/scoreScenario'

const pass = id => ({ id, label: id, check: () => true, format: () => 'ok' })
const fail = id => ({ id, label: id, check: () => false, format: () => 'no' })

describe('scoreScenario medal tiers', () => {
  it('not complete when a required objective fails', () => {
    const s = { required: [pass('a'), fail('b')], stretch: [pass('s')] }
    const r = scoreScenario(s, {})
    expect(r.complete).toBe(false)
    expect(r.medal).toBeNull()
  })

  it('bronze: required met, zero stretch passed', () => {
    const s = { required: [pass('a')], stretch: [fail('s1'), fail('s2')] }
    expect(scoreScenario(s, {}).medal).toBe('bronze')
  })

  it('silver: required met, some stretch passed', () => {
    const s = { required: [pass('a')], stretch: [pass('s1'), fail('s2')] }
    expect(scoreScenario(s, {}).medal).toBe('silver')
  })

  it('gold: required met, all stretch passed', () => {
    const s = { required: [pass('a')], stretch: [pass('s1'), pass('s2')] }
    expect(scoreScenario(s, {}).medal).toBe('gold')
  })

  it('gold: required met, no stretch goals at all', () => {
    const s = { required: [pass('a')], stretch: [] }
    expect(scoreScenario(s, {}).medal).toBe('gold')
  })

  it('reports per-objective pass and live value', () => {
    const r = scoreScenario({ required: [pass('a')], stretch: [] }, {})
    expect(r.required[0]).toMatchObject({ id: 'a', passed: true, value: 'ok' })
  })
})

describe('bestMedal', () => {
  it('keeps the higher rank', () => {
    expect(bestMedal(null, 'silver')).toBe('silver')
    expect(bestMedal('silver', null)).toBe('silver')
    expect(bestMedal('bronze', 'gold')).toBe('gold')
    expect(bestMedal('gold', 'silver')).toBe('gold')
  })
  it('returns null when both are null', () => {
    expect(bestMedal(null, null)).toBeNull()
  })
})
