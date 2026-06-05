/**
 * ChannelEditor regression tests.
 *
 * Covers:
 *   - All four limiter mode buttons are rendered and reachable without scrolling
 *   - "Off" is selected by default (aria-pressed)
 *   - Selecting Amp DSP / Ext Rack shows "hardware protection active" status
 *   - Selecting Console shows "monitoring only" warning
 *   - Switching back to Off clears all status text
 *   - Only one limiter mode is active at a time (mutual exclusivity)
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import App from '../App'

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock('../services/api', () => ({
  fetchManufacturers:    vi.fn(() => Promise.resolve([])),
  fetchComponents:       vi.fn(() => Promise.resolve([])),
  validateConfiguration: vi.fn(() => Promise.resolve(null)),
  fetchCoverage:         vi.fn(() => Promise.resolve(null)),
  fetchSoundcheckInfo:   vi.fn(() => Promise.resolve({ available: false })),
}))

// ── useIsMobile mock ──────────────────────────────────────────────────────────
vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(),
}))

// ── dnd-kit mock ──────────────────────────────────────────────────────────────
vi.mock('@dnd-kit/core', () => ({
  DndContext:    ({ children }) => <>{children}</>,
  DragOverlay:   () => null,
  PointerSensor: class {},
  useSensor:     vi.fn(),
  useSensors:    vi.fn(() => []),
  closestCenter: vi.fn(),
  pointerWithin: vi.fn(),
  useDraggable:  vi.fn(() => ({
    attributes: {},
    listeners:  {},
    setNodeRef: vi.fn(),
    isDragging: false,
  })),
  useDroppable: vi.fn(() => ({
    isOver:     false,
    setNodeRef: vi.fn(),
  })),
}))

import { useIsMobile } from '../hooks/useIsMobile'

// The ChannelEditor is part of the desktop layout only.
// Suppress the demo tour by faking a prior visit in localStorage.
describe('ChannelEditor — limiter controls', () => {
  let originalInnerWidth

  beforeEach(() => {
    vi.clearAllMocks()
    useIsMobile.mockReturnValue(false)
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('1') // sdl_tour_seen
    originalInnerWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true, writable: true })
  })

  it('renders all four limiter mode buttons', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /^off$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^amp dsp$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^ext rack$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^console$/i })).toBeInTheDocument()
  })

  it('Off is selected by default and others are not', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /^off$/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^amp dsp$/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /^ext rack$/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /^console$/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('no limiter status text is shown in the default Off state', () => {
    render(<App />)
    expect(screen.queryByText(/hardware protection active/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/monitoring only/i)).not.toBeInTheDocument()
  })

  it('selecting Amp DSP marks it pressed and shows hardware protection status', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /^amp dsp$/i }))
    expect(screen.getByRole('button', { name: /^amp dsp$/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^off$/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/hardware protection active/i)).toBeInTheDocument()
    expect(screen.queryByText(/monitoring only/i)).not.toBeInTheDocument()
  })

  it('selecting Ext Rack marks it pressed and shows hardware protection status', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /^ext rack$/i }))
    expect(screen.getByRole('button', { name: /^ext rack$/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/hardware protection active/i)).toBeInTheDocument()
  })

  it('selecting Console marks it pressed and shows monitoring-only warning', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /^console$/i }))
    expect(screen.getByRole('button', { name: /^console$/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/monitoring only/i)).toBeInTheDocument()
    expect(screen.queryByText(/hardware protection active/i)).not.toBeInTheDocument()
  })

  it('switching from Amp DSP back to Off clears all status text', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /^amp dsp$/i }))
    expect(screen.getByText(/hardware protection active/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^off$/i }))
    expect(screen.queryByText(/hardware protection active/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/monitoring only/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^off$/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('only one limiter mode is active at a time', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: /^amp dsp$/i }))

    const pressed = ['off', 'amp dsp', 'ext rack', 'console']
      .map(name => screen.getByRole('button', { name: new RegExp(`^${name}$`, 'i') }))
      .filter(btn => btn.getAttribute('aria-pressed') === 'true')

    expect(pressed).toHaveLength(1)
    expect(pressed[0]).toHaveTextContent(/amp dsp/i)
  })
})
