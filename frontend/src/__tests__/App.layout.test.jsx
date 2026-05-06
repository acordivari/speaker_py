/**
 * App layout exclusivity tests.
 *
 * Regression guard for the duplicate dnd-kit ID bug:
 * Desktop and mobile layouts must never be mounted simultaneously.
 * When both were mounted (one hidden by CSS), every DraggableCard
 * registered two useDraggable hooks with the same ID; dnd-kit used
 * the hidden element's zero-rect, placing the drag ghost at the
 * viewport origin hundreds of pixels above the cursor.
 */
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'

vi.mock('../services/api', () => ({
  fetchManufacturers:   vi.fn(() => Promise.resolve([])),
  fetchComponents:      vi.fn(() => Promise.resolve([])),
  validateConfiguration: vi.fn(() => Promise.resolve(null)),
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
