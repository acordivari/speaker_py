/**
 * SVG coordinate map for Mission Ballroom speaker positions.
 *
 * The viewBox is "0 0 800 560".
 * Stage is at the bottom; balcony wraps left, back, and right.
 * FOH mix position is at centre-floor, approximately 2/3 back from stage.
 *
 * Coordinates are {cx, cy} (circle centre).
 */
export const POSITION_COORDS = {
  MAIN_L:  { cx: 105,  cy: 215 },  // Left array hang
  MAIN_R:  { cx: 695,  cy: 215 },  // Right array hang
  SUB_C:   { cx: 400,  cy: 375 },  // Centre sub cluster (flown/ground)
  FF_C:    { cx: 400,  cy: 415 },  // Front fill stage lip
  DELAY_L: { cx: 72,   cy: 260 },  // Under-balcony delay left
  DELAY_R: { cx: 728,  cy: 260 },  // Under-balcony delay right
  MON_L:   { cx: 290,  cy: 460 },  // Stage left monitor
  MON_R:   { cx: 510,  cy: 460 },  // Stage right monitor
}

// Type → icon character
export const TYPE_ICON = {
  line_array:  '⬛',
  full_range:  '◉',
  subwoofer:   '◎',
  monitor:     '◈',
  fill:        '◆',
  amplifier:   '⚡',
  processor:   '⚙',
}

// Manufacturer → accent color
export const MFR_COLOR = {
  'Funktion-One':      '#ff8c00',
  'Danley Sound Labs': '#4a90d9',
  'L-Acoustics':       '#cc2222',
  'd&b audiotechnik':  '#ff6b35',
  'Meyer Sound':       '#9b59b6',
  'QSC':               '#2980b9',
  'Lab.gruppen':       '#c0392b',
}

export const getMfrColor = (name) => MFR_COLOR[name] ?? '#888'
