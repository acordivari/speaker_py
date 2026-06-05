/**
 * Coverage heatmap tests.
 *
 * Covers the pure SPL→color scale, the heatmap grid renderer (cell count,
 * null masking, visibility gating), and the legend/stats readout. The map is
 * theme-sensitive UI, so we assert content/aria rather than pixel colors.
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { splToFraction, splToColor, SPL_DOMAIN } from '../components/venue/coverageScale'
import CoverageHeatmap from '../components/venue/CoverageHeatmap'
import CoverageLegend from '../components/venue/CoverageLegend'
import useStore from '../store/useStore'

vi.mock('../store/useStore', () => ({ default: vi.fn() }))

function mockStore(state) {
  useStore.mockImplementation(selector => selector(state))
}

const renderInSvg = ui => render(<svg>{ui}</svg>)

// ── Color scale (pure) ───────────────────────────────────────────────────────

describe('coverageScale', () => {
  it('maps the domain endpoints to 0 and 1', () => {
    expect(splToFraction(SPL_DOMAIN.min)).toBe(0)
    expect(splToFraction(SPL_DOMAIN.max)).toBe(1)
  })

  it('clamps values outside the domain', () => {
    expect(splToFraction(SPL_DOMAIN.min - 30)).toBe(0)
    expect(splToFraction(SPL_DOMAIN.max + 30)).toBe(1)
  })

  it('places the midpoint at 0.5', () => {
    const mid = (SPL_DOMAIN.min + SPL_DOMAIN.max) / 2
    expect(splToFraction(mid)).toBeCloseTo(0.5, 5)
  })

  it('ramps hue from blue (quiet) to red (loud)', () => {
    expect(splToColor(SPL_DOMAIN.min)).toContain('hsla(240')
    expect(splToColor(SPL_DOMAIN.max)).toContain('hsla(0')
  })
})

// ── Heatmap renderer ─────────────────────────────────────────────────────────

describe('CoverageHeatmap', () => {
  const grid = {
    grid: { cols: 2, rows: 2, cell_size: 10, values: [100, null, null, 115] },
  }

  it('renders one rect per non-null cell and skips nulls', () => {
    mockStore({ showCoverage: true, coverageResult: grid })
    const { container } = renderInSvg(<CoverageHeatmap />)
    expect(container.querySelectorAll('rect')).toHaveLength(2)
  })

  it('is pointer-transparent so speaker nodes stay clickable', () => {
    mockStore({ showCoverage: true, coverageResult: grid })
    const { container } = renderInSvg(<CoverageHeatmap />)
    expect(container.querySelector('g')).toHaveAttribute('pointer-events', 'none')
  })

  it('renders nothing when coverage is toggled off', () => {
    mockStore({ showCoverage: false, coverageResult: grid })
    const { container } = renderInSvg(<CoverageHeatmap />)
    expect(container.querySelectorAll('rect')).toHaveLength(0)
  })

  it('renders nothing before a result arrives', () => {
    mockStore({ showCoverage: true, coverageResult: null })
    const { container } = renderInSvg(<CoverageHeatmap />)
    expect(container.querySelectorAll('rect')).toHaveLength(0)
  })
})

// ── Legend + stats ───────────────────────────────────────────────────────────

describe('CoverageLegend', () => {
  const withStats = {
    grid: { cols: 1, rows: 1, cell_size: 10, values: [110] },
    stats: {
      foh_spl_db: 121, front_row_spl_db: 120, back_wall_spl_db: 112,
      uniformity_db: 17, active_source_count: 8,
    },
    summary: 'Predicted coverage from 8 cabinet(s).',
  }

  it('shows headline SPL stats when sources are present', () => {
    mockStore({ showCoverage: true, coverageResult: withStats })
    render(<CoverageLegend />)
    expect(screen.getByText('121 dB')).toBeInTheDocument()
    expect(screen.getByText('112 dB')).toBeInTheDocument()
    expect(screen.getByText('17 dB')).toBeInTheDocument()
  })

  it('falls back to the summary when no sources are placed', () => {
    mockStore({
      showCoverage: true,
      coverageResult: {
        grid: { cols: 1, rows: 1, cell_size: 10, values: [null] },
        stats: { active_source_count: 0 },
        summary: 'No active sources placed.',
      },
    })
    render(<CoverageLegend />)
    expect(screen.getByText(/No active sources placed/)).toBeInTheDocument()
  })

  it('renders nothing when coverage is toggled off', () => {
    mockStore({ showCoverage: false, coverageResult: withStats })
    const { container } = render(<CoverageLegend />)
    expect(container).toBeEmptyDOMElement()
  })
})
