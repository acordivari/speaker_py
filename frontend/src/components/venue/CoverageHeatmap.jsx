import useStore from '../../store/useStore'
import { splToColor } from './coverageScale'

/**
 * SPL coverage heatmap, rendered as an SVG <g> inside VenueLayout.
 *
 * The backend grid is expressed in the same 0 0 800 560 viewbox as the venue
 * drawing, so each cell maps to SVG coordinates with no translation. Cells
 * outside the audience areas come back as null and are skipped. The group is
 * pointer-transparent so speaker nodes above it still receive clicks/taps.
 */
export default function CoverageHeatmap() {
  const coverageResult = useStore(s => s.coverageResult)
  const showCoverage   = useStore(s => s.showCoverage)

  if (!showCoverage || !coverageResult) return null

  const { cols, cell_size: cell, values } = coverageResult.grid
  // Slight overlap removes hairline seams between adjacent cells.
  const size = cell + 0.5

  const cells = []
  for (let i = 0; i < values.length; i++) {
    const db = values[i]
    if (db == null) continue
    const col = i % cols
    const row = Math.floor(i / cols)
    cells.push(
      <rect
        key={i}
        x={col * cell}
        y={row * cell}
        width={size}
        height={size}
        fill={splToColor(db)}
      />,
    )
  }

  return (
    <g pointerEvents="none" shapeRendering="crispEdges" aria-hidden="true">
      {cells}
    </g>
  )
}
