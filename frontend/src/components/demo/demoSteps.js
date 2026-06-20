export const DEMO_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Sound Design Lab',
    body: [
      'This tool lets you design a professional PA system for Mission Ballroom in Denver, CO — the same way a live sound engineer would approach a real venue.',
      'This guided tour walks you through the full workflow, then the three ways you learn here: SEE the coverage, HEAR the faults, and DO the guided missions.',
    ],
    target: null,
    panelSide: 'center',
  },
  {
    id: 'library',
    title: 'The Component Library',
    body: [
      'On the left you have your component library. Browse professional amplifiers and speakers from manufacturers like Funktion-One, L-Acoustics, and d&b audiotechnik.',
      'Each card shows the component type, power handling (in watts), and impedance — the electrical resistance a speaker presents to an amp, measured in ohms (Ω). Matching these correctly is the heart of the job.',
    ],
    target: 'palette',
    panelSide: 'right',
  },
  {
    id: 'drag',
    title: 'Assigning Components',
    body: [
      'Drag a component card from the library and drop it onto the matching slot in the Channel Editor below the venue map.',
      'Slots are type-aware — amplifier slots only accept amps, speaker slots only accept speakers. Cross-type drops are silently rejected.',
    ],
    target: 'palette',
    panelSide: 'right',
    dragAnimation: true,
  },
  {
    id: 'venue',
    title: 'The Venue Map',
    body: [
      'The map shows all 8 speaker positions at Mission Ballroom — main left/right arrays, sub cluster, front fills, delay clusters, and stage monitors.',
      'Click any position ring to select it. The Channel Editor below updates to show that position\'s amplifier and speaker assignments.',
    ],
    target: 'venue',
    panelSide: 'right',
  },
  {
    id: 'coverage',
    title: 'See It: The SPL Coverage Map',
    body: [
      'Click the SPL Map toggle above the venue to paint a heatmap predicting how loud each part of the audience will be. SPL (Sound Pressure Level) is just loudness, measured in decibels (dB).',
      'The readout below the map reports the level at the FOH mix position (where the engineer stands), the front row, the back wall, and Δ — the front-to-back variation. A good design is loud enough everywhere and even (a small Δ), because sound naturally loses about 6 dB every time you double the distance from a speaker.',
    ],
    target: 'venue',
    panelSide: 'right',
  },
  {
    id: 'validation',
    title: 'Real-Time Validation',
    body: [
      'Every configuration change triggers an immediate electrical check: impedance matching, amplifier power ratios, and wiring safety.',
      'The status indicator in the header tells you at a glance whether your rig is valid. Green means all systems go; red means the system found issues to fix.',
    ],
    target: 'validation',
    panelSide: 'left',
  },
  {
    id: 'debugging',
    title: 'Reading the Error Messages',
    body: [
      'When issues appear, each message identifies the affected channel and explains the specific problem — an underpowered amp, an impedance mismatch, or an unsafe wiring configuration. Expand a card for the physics behind the warning and a recommended fix.',
      'Fix issues by swapping to a more powerful amp, adjusting speaker count, switching between parallel and series wiring, or enabling a limiter (a safety circuit that caps power before it can damage a driver) in the Channel Editor.',
    ],
    target: 'validation',
    panelSide: 'left',
  },
  {
    id: 'audition',
    title: 'Hear It: Audition the Fault',
    body: [
      'Many issue cards include a ▶ Hear it button. Press it to play a short loop demonstrating what that fault actually sounds like — clipping, dropout, a limiter clamping down, and more.',
      'While it plays, flip the Clean ↔ Faulted toggle to A/B the same audio with and without the problem. Training your ears to recognize these artifacts is exactly what a live engineer does at soundcheck.',
    ],
    target: 'validation',
    panelSide: 'left',
  },
  {
    id: 'reset',
    title: 'Resetting the Board',
    body: [
      'RESET clears all channel assignments so you can start fresh. Use it when you want to try a completely different configuration.',
      'F1 PRESET instantly loads a reference Funktion-One configuration — a good baseline to learn from or modify.',
    ],
    target: 'header-reset',
    panelSide: 'bottom',
  },
  {
    id: 'missions',
    title: 'Do It: Guided Missions',
    body: [
      'When you are ready to practice, open MISSIONS for a sequence of guided challenges — power up a single hang, build stereo mains, cover the back of the room, then protect your drivers.',
      'Each mission shows its objectives in a bar below the header and grades your live rig as you build — no submit button. Meet every required goal to complete it, and hit the stretch goals to earn silver or gold.',
    ],
    target: 'header-missions',
    panelSide: 'bottom',
  },
  {
    id: 'preset',
    title: "You're All Set",
    body: [
      "You've seen the whole workflow — now it's your turn. Pick how you want to dive in.",
      'START MISSION 1 clears the stage and gives you your first graded challenge: power up a single speaker hang safely. Prefer to poke around first? EXPLORE FREELY loads a complete Funktion-One reference rig across all 8 channels that you can run through soundcheck, view on the SPL Map, and modify.',
    ],
    target: null,
    panelSide: 'center',
    isLast: true,
  },
]
