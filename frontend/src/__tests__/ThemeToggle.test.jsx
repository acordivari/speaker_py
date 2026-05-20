/**
 * ThemeToggle tests.
 *
 * Verifies that:
 *   - The toggle button renders in the header with the correct initial icon
 *   - Clicking it switches data-theme on <html> to "light" and saves to localStorage
 *   - Clicking again switches back to "dark"
 *   - On mount with "light" in localStorage, the theme is initialized correctly
 *   - The toggle is present in both desktop and mobile header layouts
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import App from '../App'

vi.mock('../services/api', () => ({
  fetchManufacturers:    vi.fn(() => Promise.resolve([])),
  fetchComponents:       vi.fn(() => Promise.resolve([])),
  validateConfiguration: vi.fn(() => Promise.resolve(null)),
  fetchSoundcheckInfo:   vi.fn(() => Promise.resolve({ available: false })),
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
  useDraggable:  vi.fn(() => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), isDragging: false })),
  useDroppable:  vi.fn(() => ({ isOver: false, setNodeRef: vi.fn() })),
}))

import { useIsMobile } from '../hooks/useIsMobile'

describe('Theme toggle', () => {
  let originalDataset

  beforeEach(() => {
    vi.clearAllMocks()
    useIsMobile.mockReturnValue(false)
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('1') // suppress demo tour
    vi.spyOn(Storage.prototype, 'setItem')
    originalDataset = document.documentElement.dataset.theme
    delete document.documentElement.dataset.theme
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (originalDataset) {
      document.documentElement.dataset.theme = originalDataset
    } else {
      delete document.documentElement.dataset.theme
    }
  })

  // jsdom doesn't process CSS media queries, so both the desktop and mobile
  // header action bars are always mounted — helpers use getAllByRole and [0].
  function getFirstToggle(namePattern) {
    return screen.getAllByRole('button', { name: namePattern })[0]
  }

  it('renders at least one theme toggle button in the header', () => {
    render(<App />)
    const toggles = screen.getAllByRole('button', { name: /switch to (light|dark) theme/i })
    expect(toggles.length).toBeGreaterThanOrEqual(1)
  })

  it('defaults to dark mode (☀ icon) when no localStorage preference', () => {
    Storage.prototype.getItem.mockImplementation(key => key === 'sdl_tour_seen' ? '1' : null)
    render(<App />)
    const toggle = getFirstToggle(/switch to light theme/i)
    expect(toggle).toBeInTheDocument()
    expect(toggle.textContent).toBe('☀')
  })

  it('clicking the toggle switches to light theme and saves preference', () => {
    Storage.prototype.getItem.mockImplementation(key => key === 'sdl_tour_seen' ? '1' : null)
    render(<App />)

    fireEvent.click(getFirstToggle(/switch to light theme/i))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(Storage.prototype.setItem).toHaveBeenCalledWith('sdl_theme', 'light')
  })

  it('clicking the toggle twice returns to dark theme', () => {
    Storage.prototype.getItem.mockImplementation(key => key === 'sdl_tour_seen' ? '1' : null)
    render(<App />)

    fireEvent.click(getFirstToggle(/switch to light theme/i))
    expect(document.documentElement.dataset.theme).toBe('light')

    fireEvent.click(getFirstToggle(/switch to dark theme/i))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(Storage.prototype.setItem).toHaveBeenLastCalledWith('sdl_theme', 'dark')
  })

  it('initializes to light mode when localStorage contains "light"', () => {
    Storage.prototype.getItem.mockImplementation(key => {
      if (key === 'sdl_tour_seen') return '1'
      if (key === 'sdl_theme') return 'light'
      return null
    })
    render(<App />)
    // Icon should be ☾ (moon = currently light, click to go dark)
    const toggle = getFirstToggle(/switch to dark theme/i)
    expect(toggle).toBeInTheDocument()
    expect(toggle.textContent).toBe('☾')
  })

  it('light mode toggle icon shows ☾ (moon), dark mode shows ☀ (sun)', () => {
    Storage.prototype.getItem.mockImplementation(key => key === 'sdl_tour_seen' ? '1' : null)
    render(<App />)

    // Start dark → ☀ shown
    expect(getFirstToggle(/switch to light theme/i).textContent).toBe('☀')

    fireEvent.click(getFirstToggle(/switch to light theme/i))

    // Now light → ☾ shown
    expect(getFirstToggle(/switch to dark theme/i).textContent).toBe('☾')
  })

  it('both desktop and mobile header bars have theme toggles', () => {
    render(<App />)
    const toggles = screen.getAllByRole('button', { name: /switch to (light|dark) theme/i })
    // Header renders desktop + mobile action bars simultaneously in jsdom
    expect(toggles.length).toBe(2)
  })
})
