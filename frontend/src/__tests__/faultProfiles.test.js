/**
 * Fault profile mapping tests (pure).
 *
 * Verifies the curated, honest subset: audible faults map to a known effect,
 * and faults with no genuine sound map to null (no audition button).
 */
import { describe, it, expect } from 'vitest'
import { FAULT_PROFILES, getFaultProfile } from '../audio/faultProfiles'

const KNOWN_EFFECTS = new Set(['clip', 'stress', 'breakup', 'weak', 'dropout', 'pump', 'mute'])

describe('getFaultProfile', () => {
  it('maps clipping faults to the clip effect', () => {
    expect(getFaultProfile('AMP_UNDERPOWERED').effect).toBe('clip')
    expect(getFaultProfile('LIMITER_CONSOLE_ONLY').effect).toBe('clip')
  })

  it('maps power and protection faults to their effects', () => {
    expect(getFaultProfile('IMPEDANCE_VERY_HIGH').effect).toBe('weak')
    expect(getFaultProfile('IMPEDANCE_BELOW_AMP_MINIMUM').effect).toBe('dropout')
    expect(getFaultProfile('AMP_SEVERELY_OVERPOWERED').effect).toBe('breakup')
    expect(getFaultProfile('LIMITER_ENGAGED').effect).toBe('pump')
    expect(getFaultProfile('PASSIVE_NEEDS_AMP').effect).toBe('mute')
  })

  it('returns null for faults with no honest audible demonstration', () => {
    expect(getFaultProfile('CONNECTOR_MISMATCH')).toBeNull()
    expect(getFaultProfile('CROSS_MANUFACTURER_DSP')).toBeNull()
    expect(getFaultProfile('IMPEDANCE_NOMINAL')).toBeNull()
    expect(getFaultProfile('ACTIVE_NO_EXTERNAL_AMP')).toBeNull()
  })

  it('returns null for unknown codes', () => {
    expect(getFaultProfile('NOPE')).toBeNull()
    expect(getFaultProfile(undefined)).toBeNull()
  })

  it('every profile has a known effect, a label, and a blurb', () => {
    for (const [code, p] of Object.entries(FAULT_PROFILES)) {
      expect(KNOWN_EFFECTS.has(p.effect), `${code} effect`).toBe(true)
      expect(p.label, `${code} label`).toBeTruthy()
      expect(p.blurb, `${code} blurb`).toBeTruthy()
    }
  })
})
