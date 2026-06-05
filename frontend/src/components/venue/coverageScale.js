/**
 * SPL → color mapping for the coverage heatmap.
 *
 * We use a FIXED absolute-dB domain (not data-driven min/max) so colors mean
 * the same thing across every rig — a red cell is always "very loud," letting
 * students compare configurations directly. The ramp walks the HSL hue wheel
 * from blue (quiet) through green to red (loud), the convention used by real
 * prediction tools (Soundvision, MAPP).
 *
 * These are data-visualization colors, intentionally independent of the
 * light/dark theme tokens — the legend text below them uses theme vars.
 */

export const SPL_DOMAIN = { min: 95, max: 120 } // dB SPL

// Even ticks for the legend (inclusive of both ends).
export const LEGEND_TICKS = [95, 100, 105, 110, 115, 120]

/** Clamp a value to [lo, hi]. */
function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v))
}

/**
 * Normalize a dB value to 0..1 across the fixed SPL domain.
 * @param {number} db
 * @returns {number} 0 (quiet) → 1 (loud)
 */
export function splToFraction(db) {
  const { min, max } = SPL_DOMAIN
  return clamp((db - min) / (max - min), 0, 1)
}

/**
 * Map a dB SPL value to a heatmap color.
 * @param {number} db        predicted SPL
 * @param {number} [alpha]   fill opacity so venue shapes show through
 * @returns {string} an hsla() color string
 */
export function splToColor(db, alpha = 0.55) {
  const t = splToFraction(db)
  // Hue 240° (blue) → 0° (red) as level rises.
  const hue = Math.round(240 * (1 - t))
  return `hsla(${hue}, 80%, 50%, ${alpha})`
}
