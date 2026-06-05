/**
 * Fault audition profiles.
 *
 * Maps each backend IssueCode to an honest, demonstrable audio effect. Codes
 * whose real-world consequence has no clear sound (connector adapters, lost
 * factory DSP voicing, informational/nominal notices) are intentionally absent
 * — those cards show no audition button. This is a teaching tool, so we never
 * invent a sound that wouldn't actually happen.
 *
 * `effect` names are implemented by the audition engine's DSP graph.
 * `label`  is the short name of what you're hearing.
 * `blurb`  is one line explaining the faulted sound.
 */

export const FAULT_PROFILES = {
  // ── Clipping: amp out of headroom / unprotected peaks ──────────────────────
  AMP_UNDERPOWERED: {
    effect: 'clip',
    label: 'Clipping',
    blurb: 'The amp runs out of headroom and clips the peaks into harsh distortion.',
  },
  AMP_CLIPPING_RISK: {
    effect: 'clip',
    label: 'Clipping',
    blurb: 'Chronic under-powering drives the amp into clipping on every transient.',
  },
  LIMITER_CONSOLE_ONLY: {
    effect: 'clip',
    label: 'Unprotected peaks',
    blurb: 'With no hardware limiter, transient peaks pass straight through and clip.',
  },

  // ── Driver stress: too much power, harsh breakup ───────────────────────────
  AMP_OVERPOWERED: {
    effect: 'stress',
    label: 'Driver stress',
    blurb: 'Excess power pushes the driver into harsh, edgy distortion.',
  },
  AMP_SEVERELY_OVERPOWERED: {
    effect: 'breakup',
    label: 'Driver breakup',
    blurb: 'Severe over-powering tears the driver apart — gross distortion and dropouts.',
  },
  ACTIVE_CONNECTED_TO_AMP: {
    effect: 'breakup',
    label: 'Overdriven',
    blurb: 'Feeding amp output into a self-powered speaker overloads it into damage.',
  },

  // ── Weak / power-starved ───────────────────────────────────────────────────
  IMPEDANCE_VERY_HIGH: {
    effect: 'weak',
    label: 'Weak output',
    blurb: 'A high load impedance starves the amp — far less power, thin and quiet.',
  },
  SPEAKER_LEVEL_ON_LINE_LEVEL: {
    effect: 'weak',
    label: 'No drive',
    blurb: 'Line-level signal cannot drive a speaker — barely any output reaches it.',
  },

  // ── Dropouts: amp protection cycling ───────────────────────────────────────
  IMPEDANCE_BELOW_AMP_MINIMUM: {
    effect: 'dropout',
    label: 'Protection cutout',
    blurb: 'Below the amp’s minimum load it overheats and cuts in and out to protect itself.',
  },

  // ── Limiter working (the healthy comparison) ───────────────────────────────
  LIMITER_ENGAGED: {
    effect: 'pump',
    label: 'Limiter pumping',
    blurb: 'A proper limiter catches the peaks — controlled "pumping," not destruction.',
  },

  // ── Silence: no signal path ────────────────────────────────────────────────
  PASSIVE_NEEDS_AMP: {
    effect: 'mute',
    label: 'Silence',
    blurb: 'A passive speaker with no amplifier produces nothing at all.',
  },
  NO_SPEAKERS_ON_CHANNEL: {
    effect: 'mute',
    label: 'Silence',
    blurb: 'An amplifier driving no speakers makes no sound.',
  },
}

/**
 * Return the audition profile for an IssueCode, or null if the fault has no
 * honest audible demonstration.
 * @param {string} code
 * @returns {{effect: string, label: string, blurb: string} | null}
 */
export function getFaultProfile(code) {
  return FAULT_PROFILES[code] ?? null
}
