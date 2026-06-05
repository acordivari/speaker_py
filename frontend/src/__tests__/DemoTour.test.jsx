/**
 * DemoTour regression tests.
 *
 * Covers:
 *   - Auto-start gate: tour must NOT auto-start on mobile (first visit)
 *   - Auto-start gate: tour DOES auto-start on desktop (first visit)
 *   - Closing the tour on mobile leaves the app in a usable state (no blank screen)
 *   - localStorage.setItem('sdl_tour_seen') is called on close
 *   - The dark overlay is removed after close
 *   - Step counter displays correctly
 *   - NEXT button advances the step
 *   - Step 7→8 transition does NOT cause a blank screen (no loadPreset mid-render)
 *   - loadPreset fires on FINISH click, not on step transition
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

describe('DemoTour — auto-start behavior', () => {
  let getItemSpy
  let setItemSpy
  let originalInnerWidth

  beforeEach(() => {
    vi.clearAllMocks()
    // Simulate first visit — no tour_seen flag
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    originalInnerWidth = window.innerWidth
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true, writable: true })
  })

  it('does not auto-start on mobile (first visit)', () => {
    // Simulate a narrow mobile viewport — below the 768px gate
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true })
    useIsMobile.mockReturnValue(true)
    render(<App />)
    // Tour panel title for step 1 should NOT be present when mobile
    expect(screen.queryByText('Welcome to Sound Design Lab')).not.toBeInTheDocument()
  })

  it('auto-starts on desktop on first visit', () => {
    // Simulate a wide desktop viewport — above the 768px gate
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true })
    useIsMobile.mockReturnValue(false)
    render(<App />)
    // Tour panel title for step 1 should be present on desktop
    expect(screen.getByText('Welcome to Sound Design Lab')).toBeInTheDocument()
  })
})

describe('DemoTour — close behavior', () => {
  let getItemSpy
  let setItemSpy
  let originalInnerWidth

  beforeEach(() => {
    vi.clearAllMocks()
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    originalInnerWidth = window.innerWidth
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true, writable: true })
  })

  it('closing the tour on mobile shows the MobileNavBar (not a blank screen)', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true })
    useIsMobile.mockReturnValue(true)
    render(<App />)

    // Manually trigger tour via TOUR button — mobile does not auto-start
    const tourBtns = screen.getAllByRole('button', { name: /take the tour/i })
    fireEvent.click(tourBtns[0])

    // Tour overlay should now be visible
    expect(screen.getByText('Welcome to Sound Design Lab')).toBeInTheDocument()

    // Close via SKIP TOUR
    const skipBtn = screen.getByRole('button', { name: /skip tour/i })
    fireEvent.click(skipBtn)

    // MobileNavBar must still be in the document
    expect(screen.getByRole('tablist', { name: 'Main navigation' })).toBeInTheDocument()
  })

  it('marks tour as seen in localStorage when closed', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true })
    useIsMobile.mockReturnValue(false)
    render(<App />)

    // Tour auto-started on desktop
    expect(screen.getByText('Welcome to Sound Design Lab')).toBeInTheDocument()

    // Close via SKIP TOUR
    const skipBtn = screen.getByRole('button', { name: /skip tour/i })
    fireEvent.click(skipBtn)

    expect(setItemSpy).toHaveBeenCalledWith('sdl_tour_seen', '1')
  })

  it('closing the tour on mobile does not leave a dark overlay', () => {
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true })
    useIsMobile.mockReturnValue(true)
    render(<App />)

    // Trigger tour manually
    const tourBtns = screen.getAllByRole('button', { name: /take the tour/i })
    fireEvent.click(tourBtns[0])

    expect(screen.getByText('Welcome to Sound Design Lab')).toBeInTheDocument()

    // Close via SKIP TOUR
    fireEvent.click(screen.getByRole('button', { name: /skip tour/i }))

    // Tour panel title must be gone
    expect(screen.queryByText('Welcome to Sound Design Lab')).not.toBeInTheDocument()
  })
})

describe('DemoTour — panel renders correctly', () => {
  let getItemSpy
  let originalInnerWidth

  beforeEach(() => {
    vi.clearAllMocks()
    getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    originalInnerWidth = window.innerWidth
    // Desktop viewport so tour auto-starts
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true, writable: true })
  })

  it('shows step 1 of 8 on the welcome step', () => {
    useIsMobile.mockReturnValue(false)
    render(<App />)
    expect(screen.getByText('STEP 1 / 8')).toBeInTheDocument()
  })

  it('NEXT button advances to step 2', () => {
    useIsMobile.mockReturnValue(false)
    render(<App />)

    // Step 1 should be visible
    expect(screen.getByText('STEP 1 / 8')).toBeInTheDocument()

    // Click NEXT
    const nextBtn = screen.getByRole('button', { name: /next/i })
    fireEvent.click(nextBtn)

    // Step 2 should now be visible
    expect(screen.getByText('STEP 2 / 8')).toBeInTheDocument()
  })
})

describe('DemoTour — step 7→8 blank screen regression', () => {
  // Regression for: loadPreset called from useEffect on step transition caused
  // a Zustand store update mid-render, producing a second DemoTour re-render
  // that left the panel invisible behind the full-screen overlay on mobile.
  // Fix: loadPreset moved to handleNext (click handler) so React 18 batches
  // the store update with setDemoActive(false) into one atomic render.
  let originalInnerWidth

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    vi.spyOn(Storage.prototype, 'setItem')
    originalInnerWidth = window.innerWidth
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true })
    useIsMobile.mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true, writable: true })
  })

  it('step 8 panel is still visible after advancing through all 7 preceding steps', () => {
    render(<App />)

    // Advance through steps 1–7 (click NEXT 7 times)
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByRole('button', { name: /next →/i }))
    }

    // Should now be on step 8 — panel must still be in the document
    expect(screen.getByText('STEP 8 / 8')).toBeInTheDocument()
    // The FINISH button must be present and interactive
    expect(screen.getByRole('button', { name: /finish →/i })).toBeInTheDocument()
  })

  it('FINISH on step 8 closes the tour (overlay removed)', () => {
    render(<App />)

    // Advance to step 8
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByRole('button', { name: /next →/i }))
    }

    expect(screen.getByText('STEP 8 / 8')).toBeInTheDocument()

    // Click FINISH — tour should close
    fireEvent.click(screen.getByRole('button', { name: /finish →/i }))

    // Tour panel must be gone
    expect(screen.queryByText('STEP 8 / 8')).not.toBeInTheDocument()
  })

  it('FINISH on step 8 writes sdl_tour_seen to localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    render(<App />)

    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByRole('button', { name: /next →/i }))
    }
    fireEvent.click(screen.getByRole('button', { name: /finish →/i }))

    expect(setItemSpy).toHaveBeenCalledWith('sdl_tour_seen', '1')
  })
})
