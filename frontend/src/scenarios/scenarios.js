/**
 * Scenario content — guided missions for the Mission Ballroom.
 *
 * Declarative, inlined data (per the project's data-driven convention). Each
 * scenario is a brief plus a rubric built from the pure criteria factories:
 *   required[] — all must pass to COMPLETE the scenario
 *   stretch[]  — optional goals that earn Silver / Gold
 *
 * Ordered to introduce one concept at a time: a valid channel → stereo mains
 * and level → whole-room coverage → driver protection. Thresholds are tuned to
 * be achievable with the seeded gear (see scenarios verification).
 */
import {
  noErrors,
  noWarnings,
  minActiveSources,
  backWallAtLeast,
  fohAtLeast,
  uniformityAtMost,
  positionsFilled,
  everyChannelProtected,
} from './criteria'

export const SCENARIOS = [
  {
    id: 'first-power-up',
    order: 1,
    title: 'First Power-Up',
    concept: 'Impedance & amp/speaker matching',
    brief:
      'Get a single main hang making sound — safely. Place an amplifier and ' +
      'matching speakers on the Main Left position so the channel validates with ' +
      'no errors. Watch the impedance and power ratio as you add cabinets.',
    required: [
      positionsFilled('MAIN_L', 'Main Left position has gear'),
      minActiveSources(1),
      noErrors(),
    ],
    stretch: [noWarnings()],
  },
  {
    id: 'mains-up',
    order: 2,
    title: 'Mains Up',
    concept: 'Stereo mains & front-of-house level',
    brief:
      'Build left and right mains for a full house. Both main hangs must be ' +
      'populated and the rig must hit a solid level at the FOH mix position — ' +
      'with no errors anywhere in the system.',
    required: [
      positionsFilled(['MAIN_L', 'MAIN_R'], 'Both main hangs populated'),
      fohAtLeast(105),
      noErrors(),
    ],
    stretch: [noWarnings(), fohAtLeast(113)],
  },
  {
    id: 'cover-the-back',
    order: 3,
    title: 'Cover the Back',
    concept: 'Coverage, inverse-square & delays',
    brief:
      'The back of the floor is too quiet. Build out the system — mains, subs, ' +
      'fills, and the under-balcony delays — so the back wall stays loud and the ' +
      'coverage is even from front to back.',
    required: [
      noErrors(),
      minActiveSources(6),
      backWallAtLeast(106),
    ],
    stretch: [
      positionsFilled(['DELAY_L', 'DELAY_R'], 'Delay speakers deployed'),
      uniformityAtMost(18),
    ],
  },
  {
    id: 'protect-the-drivers',
    order: 4,
    title: 'Protect the Drivers',
    concept: 'Limiters & safe over-powering',
    brief:
      'Headroom matters — but so do your drivers. Build a rig where every active ' +
      'channel is either within a safe power ratio or backed by a hardware ' +
      'limiter (amp DSP or an external rack), with zero errors.',
    required: [
      noErrors(),
      minActiveSources(2),
      everyChannelProtected(2),
    ],
    stretch: [noWarnings()],
  },
]

export function getScenario(id) {
  return SCENARIOS.find(s => s.id === id) ?? null
}
