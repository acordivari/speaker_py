/**
 * AuditionControl tests.
 *
 * Web Audio doesn't exist in jsdom, so we mock the useAudition hook and assert
 * the component's gating, controls, and wiring — not real audio.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import AuditionControl from '../components/validation/AuditionControl'

// Hoisted mock state so the vi.mock factory can reference it.
const h = vi.hoisted(() => ({
  state: {
    activeCode: null,
    playing: false,
    mode: 'fault',
    audition: vi.fn(),
    setMode: vi.fn(),
    stop: vi.fn(),
    isSupported: true,
  },
}))

vi.mock('../audio/useAudition', () => ({ useAudition: () => h.state }))

beforeEach(() => {
  h.state = {
    activeCode: null, playing: false, mode: 'fault',
    audition: vi.fn(), setMode: vi.fn(), stop: vi.fn(), isSupported: true,
  }
})

describe('AuditionControl', () => {
  it('renders nothing for a code with no audible profile', () => {
    const { container } = render(<AuditionControl code="CONNECTOR_MISMATCH" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when Web Audio is unsupported', () => {
    h.state.isSupported = false
    const { container } = render(<AuditionControl code="AMP_UNDERPOWERED" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a Hear it button for an audible code', () => {
    render(<AuditionControl code="AMP_UNDERPOWERED" />)
    expect(screen.getByRole('button', { name: /hear it/i })).toBeInTheDocument()
  })

  it('calls audition with the code and its profile on click', () => {
    render(<AuditionControl code="AMP_UNDERPOWERED" />)
    fireEvent.click(screen.getByRole('button', { name: /hear it/i }))
    expect(h.state.audition).toHaveBeenCalledWith(
      'AMP_UNDERPOWERED',
      expect.objectContaining({ effect: 'clip' }),
    )
  })

  it('shows Stop + Clean/Faulted toggle while this code is playing', () => {
    h.state.activeCode = 'AMP_UNDERPOWERED'
    h.state.playing = true
    render(<AuditionControl code="AMP_UNDERPOWERED" />)
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clean' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Faulted' })).toBeInTheDocument()
  })

  it('does not show the toggle when a different code is playing', () => {
    h.state.activeCode = 'IMPEDANCE_VERY_HIGH'
    h.state.playing = true
    render(<AuditionControl code="AMP_UNDERPOWERED" />)
    expect(screen.queryByRole('button', { name: 'Clean' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hear it/i })).toBeInTheDocument()
  })

  it('switches mode via the Clean/Faulted toggle', () => {
    h.state.activeCode = 'AMP_UNDERPOWERED'
    h.state.playing = true
    render(<AuditionControl code="AMP_UNDERPOWERED" />)
    fireEvent.click(screen.getByRole('button', { name: 'Clean' }))
    expect(h.state.setMode).toHaveBeenCalledWith('clean')
  })
})
