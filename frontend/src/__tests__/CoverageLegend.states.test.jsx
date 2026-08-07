/**
 * CoverageLegend error/computing states — regression guard for the store's
 * coverageError/isComputingCoverage flags being maintained but never rendered.
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import useStore from '../store/useStore'
import CoverageLegend from '../components/venue/CoverageLegend'

vi.mock('../services/api', () => ({
  fetchManufacturers:    vi.fn(() => Promise.resolve([])),
  fetchComponents:       vi.fn(() => Promise.resolve([])),
  validateConfiguration: vi.fn(() => Promise.resolve(null)),
  fetchCoverage:         vi.fn(() => Promise.resolve(null)),
  fetchSoundcheckInfo:   vi.fn(() => Promise.resolve({ available: false })),
}))

describe('CoverageLegend states', () => {
  beforeEach(() => {
    useStore.setState({
      showCoverage: true,
      coverageResult: null,
      coverageError: null,
      isComputingCoverage: false,
    })
  })

  it('shows the error notice when the coverage fetch failed', () => {
    useStore.setState({ coverageError: 'Network Error' })
    render(<CoverageLegend />)
    expect(screen.getByTestId('coverage-error')).toBeInTheDocument()
    expect(screen.getByText(/SPL map unavailable — Network Error/)).toBeInTheDocument()
  })

  it('shows a computing indicator before the first result arrives', () => {
    useStore.setState({ isComputingCoverage: true })
    render(<CoverageLegend />)
    expect(screen.getByText(/computing spl map/i)).toBeInTheDocument()
  })

  it('renders nothing when coverage is hidden, even with an error', () => {
    useStore.setState({ showCoverage: false, coverageError: 'Network Error' })
    const { container } = render(<CoverageLegend />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when idle with no result', () => {
    const { container } = render(<CoverageLegend />)
    expect(container).toBeEmptyDOMElement()
  })
})
