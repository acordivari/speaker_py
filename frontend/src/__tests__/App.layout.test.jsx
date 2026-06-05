/**
 * App layout exclusivity and mobile UX tests.
 *
 * Regression guard for the duplicate dnd-kit ID bug:
 * Desktop and mobile layouts must never be mounted simultaneously.
 * When both were mounted (one hidden by CSS), every DraggableCard
 * registered two useDraggable hooks with the same ID; dnd-kit used
 * the hidden element's zero-rect, placing the drag ghost at the
 * viewport origin hundreds of pixels above the cursor.
 *
 * Also verifies mobile UX requirements:
 *   - Critical header actions (TOUR, F1) are directly accessible —
 *     no hidden overflow menu required
 *   - Onboarding card shown on the Library tab when no channels are
 *     configured, guiding new users through the assignment flow
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import App from '../App'

vi.mock('../services/api', () => ({
  fetchManufacturers:   vi.fn(() => Promise.resolve([])),
  fetchComponents:      vi.fn(() => Promise.resolve([])),
  validateConfiguration: vi.fn(() => Promise.resolve(null)),
  fetchCoverage:         vi.fn(() => Promise.resolve(null)),
  fetchSoundcheckInfo:  vi.fn(() => Promise.resolve({ available: false })),
}))

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(),
}))

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

describe('App layout exclusivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mounts ComponentPalette exactly once on desktop', () => {
    useIsMobile.mockReturnValue(false)
    render(<App />)
    // "Component Library" heading only exists inside ComponentPalette.
    // Two instances would mean both layouts are mounted — the original bug.
    expect(screen.getAllByText('Component Library')).toHaveLength(1)
  })

  it('mounts ComponentPalette exactly once on mobile', () => {
    useIsMobile.mockReturnValue(true)
    render(<App />)
    expect(screen.getAllByText('Component Library')).toHaveLength(1)
  })

  it('shows MobileNavBar only on mobile', () => {
    useIsMobile.mockReturnValue(true)
    render(<App />)
    expect(screen.getByRole('tablist', { name: 'Main navigation' })).toBeInTheDocument()
  })

  it('hides MobileNavBar on desktop', () => {
    useIsMobile.mockReturnValue(false)
    render(<App />)
    expect(screen.queryByRole('tablist', { name: 'Main navigation' })).not.toBeInTheDocument()
  })
})

describe('Mobile header direct actions (no hidden menu required)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useIsMobile.mockReturnValue(true)
  })

  it('one or more TOUR buttons are directly accessible on mobile (header chip + onboarding)', () => {
    render(<App />)
    // Header chip has aria-label="Take the tour"; MobileOnboarding has the same.
    // Both are valid entry points — at least one must be present without any menu.
    const tourBtns = screen.getAllByRole('button', { name: /take the tour/i })
    expect(tourBtns.length).toBeGreaterThanOrEqual(1)
  })

  it('one or more F1 preset buttons are directly accessible on mobile (header chip + onboarding)', () => {
    render(<App />)
    // Header chip has aria-label="Load F1 Preset"; MobileOnboarding shares the label.
    const f1Btns = screen.getAllByRole('button', { name: /load f1 preset/i })
    expect(f1Btns.length).toBeGreaterThanOrEqual(1)
  })

  it('mobile layout renders MobileNavBar with action-oriented tab labels', () => {
    render(<App />)
    // ASSIGN (not "Channels") and CHECK (not "Results") confirm the new labels are live
    expect(screen.getByRole('tab', { name: 'ASSIGN' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'CHECK' })).toBeInTheDocument()
  })
})

describe('Mobile library onboarding card', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useIsMobile.mockReturnValue(true)
  })

  it('shows the GETTING STARTED card when no channels are configured', () => {
    // Real Zustand store initialises all channels with amp=null and speakers=[],
    // so hasConfig is false and MobileOnboarding renders.
    render(<App />)
    expect(screen.getByText(/getting started/i)).toBeInTheDocument()
  })

  it('onboarding card is not shown on desktop', () => {
    useIsMobile.mockReturnValue(false)
    render(<App />)
    expect(screen.queryByText(/getting started/i)).not.toBeInTheDocument()
  })
})

describe('DemoTour auto-start gating (App.jsx initialiser)', () => {
  let originalInnerWidth

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    originalInnerWidth = window.innerWidth
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true, writable: true })
  })

  it('demoActive does not auto-start on mobile', () => {
    // Narrow mobile viewport — below the 768px gate
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true })
    useIsMobile.mockReturnValue(true)
    render(<App />)
    // Tour panel title for step 1 must NOT be present on mobile
    expect(screen.queryByText('Welcome to Sound Design Lab')).not.toBeInTheDocument()
  })

  it('demoActive auto-starts on desktop with no tour_seen flag', () => {
    // Wide desktop viewport — above the 768px gate
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true })
    useIsMobile.mockReturnValue(false)
    render(<App />)
    // Tour panel title for step 1 must be present on desktop first visit
    expect(screen.getByText('Welcome to Sound Design Lab')).toBeInTheDocument()
  })
})
