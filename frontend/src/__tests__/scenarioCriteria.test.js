/**
 * Scenario criteria tests (pure). Each criterion's check() is exercised against
 * crafted live contexts.
 */
import { describe, it, expect } from 'vitest'
import {
  noErrors, noWarnings, minActiveSources, backWallAtLeast, fohAtLeast,
  uniformityAtMost, positionsFilled, everyChannelProtected,
} from '../scenarios/criteria'

const validation = (over = {}) => ({
  is_valid: true,
  channel_results: [],
  global_issues: [],
  ...over,
})

const channelResult = (over = {}) => ({
  label: 'Main Left Array', amplifier: { id: 1 }, speakers: [{ id: 2 }],
  power_ratio: 1.0, issues: [], ...over,
})

const coverage = stats => ({ stats })

describe('noErrors / noWarnings', () => {
  it('fails when nothing is built (no validation)', () => {
    expect(noErrors().check({ validation: null })).toBe(false)
  })
  it('passes with zero error-severity issues', () => {
    expect(noErrors().check({ validation: validation() })).toBe(true)
  })
  it('fails when an error issue is present', () => {
    const v = validation({ channel_results: [channelResult({ issues: [{ severity: 'error' }] })] })
    expect(noErrors().check({ validation: v })).toBe(false)
  })
  it('noWarnings ignores info/error and checks warnings', () => {
    const v = validation({ global_issues: [{ severity: 'warning' }] })
    expect(noWarnings().check({ validation: v })).toBe(false)
  })
})

describe('coverage thresholds', () => {
  it('minActiveSources', () => {
    expect(minActiveSources(4).check({ coverage: coverage({ active_source_count: 6 }) })).toBe(true)
    expect(minActiveSources(4).check({ coverage: coverage({ active_source_count: 2 }) })).toBe(false)
    expect(minActiveSources(4).check({ coverage: null })).toBe(false)
  })
  it('backWallAtLeast / fohAtLeast', () => {
    expect(backWallAtLeast(105).check({ coverage: coverage({ back_wall_spl_db: 110 }) })).toBe(true)
    expect(backWallAtLeast(105).check({ coverage: coverage({ back_wall_spl_db: 101 }) })).toBe(false)
    expect(fohAtLeast(108).check({ coverage: coverage({ foh_spl_db: 108 }) })).toBe(true)
  })
  it('uniformityAtMost (lower is better)', () => {
    expect(uniformityAtMost(18).check({ coverage: coverage({ uniformity_db: 17 }) })).toBe(true)
    expect(uniformityAtMost(18).check({ coverage: coverage({ uniformity_db: 20 }) })).toBe(false)
    expect(uniformityAtMost(18).check({ coverage: coverage({ uniformity_db: null }) })).toBe(false)
  })
})

describe('positionsFilled', () => {
  const chan = (positionKey, filled) => ({
    positionKey, amp: filled ? { id: 1 } : null, speakers: filled ? [{ component: { id: 2 }, count: 1 }] : [],
  })
  it('passes only when all named positions hold gear', () => {
    const channels = [chan('MAIN_L', true), chan('MAIN_R', true)]
    expect(positionsFilled(['MAIN_L', 'MAIN_R']).check({ channels })).toBe(true)
  })
  it('fails when one position is empty', () => {
    const channels = [chan('MAIN_L', true), chan('MAIN_R', false)]
    expect(positionsFilled(['MAIN_L', 'MAIN_R']).check({ channels })).toBe(false)
  })
})

describe('everyChannelProtected', () => {
  const ctx = (ratio, limiterMode) => ({
    channels: [{ label: 'Main Left Array', limiterMode }],
    validation: validation({ channel_results: [channelResult({ power_ratio: ratio })] }),
  })
  it('passes when ratio within limit', () => {
    expect(everyChannelProtected(2).check(ctx(1.5, 'none'))).toBe(true)
  })
  it('fails when over the limit with no hardware limiter', () => {
    expect(everyChannelProtected(2).check(ctx(3.0, 'none'))).toBe(false)
  })
  it('passes when over the limit but hardware-limited', () => {
    expect(everyChannelProtected(2).check(ctx(3.0, 'amp_dsp'))).toBe(true)
    expect(everyChannelProtected(2).check(ctx(3.0, 'external_rack'))).toBe(true)
  })
  it('console insert does not count as hardware protection', () => {
    expect(everyChannelProtected(2).check(ctx(3.0, 'console_insert'))).toBe(false)
  })
})
