export const DEMO_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Sound Design Lab',
    body: [
      'This tool lets you design a professional PA system for Mission Ballroom in Denver, CO — the same way a live sound engineer would approach a real venue.',
      'This 2-minute tour walks you through the full workflow from picking components to validating your rig.',
    ],
    target: null,
    panelSide: 'center',
  },
  {
    id: 'library',
    title: 'The Component Library',
    body: [
      'On the left you have your component library. Browse professional amplifiers and speakers from manufacturers like Funktion-One, L-Acoustics, and d&b audiotechnik.',
      'Each card shows the component type, power handling, and impedance rating so you can make informed choices.',
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
    id: 'validation',
    title: 'Real-Time Validation',
    body: [
      'Every configuration change triggers an immediate electrical check: impedance matching, amplifier power ratios, and wiring safety.',
      'The status indicator in the header tells you at a glance whether your rig is valid. Green means all systems go.',
    ],
    target: 'validation',
    panelSide: 'left',
  },
  {
    id: 'debugging',
    title: 'Reading the Error Messages',
    body: [
      'When issues appear, each message identifies the affected channel and explains the specific problem — an underpowered amp, an impedance mismatch, or an unsafe wiring configuration.',
      'Fix issues by swapping to a more powerful amp, adjusting speaker count, or toggling between parallel and series wiring in the Channel Editor.',
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
    id: 'preset',
    title: "You're All Set",
    body: [
      "We've loaded a complete Funktion-One configuration across all 8 channels of Mission Ballroom. The validation panel is showing the full system health.",
      'Try RUN SOUNDCHECK to hear the system, or dig into the Channel Editor to explore and modify the configuration yourself.',
    ],
    target: null,
    panelSide: 'center',
    isLast: true,
  },
]
