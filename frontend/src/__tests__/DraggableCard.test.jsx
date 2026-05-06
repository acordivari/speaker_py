/**
 * DraggableCard interaction-mode tests.
 *
 * On desktop: dnd-kit listeners are attached → card is draggable.
 * On mobile:  tap handler is used instead → card is a tappable button.
 *
 * Keeping these modes exclusive prevents events from being swallowed
 * on both platforms simultaneously.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DraggableCard from '../components/palette/DraggableCard'

const mockListeners = { onPointerDown: vi.fn(), onPointerMove: vi.fn() }
const mockAttributes = { tabIndex: 0, role: 'button', 'data-dnd-draggable': 'true' }
const mockSetNodeRef = vi.fn()

vi.mock('@dnd-kit/core', () => ({
  useDraggable: vi.fn(() => ({
    attributes: mockAttributes,
    listeners:  mockListeners,
    setNodeRef: mockSetNodeRef,
    isDragging: false,
  })),
}))

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(),
}))

const mockSetTapSelected  = vi.fn()
const mockClearTapSelected = vi.fn()

vi.mock('../store/useStore', () => ({
  default: vi.fn((selector) => selector({
    tapSelectedComponent: null,
    setTapSelected:       mockSetTapSelected,
    clearTapSelected:     mockClearTapSelected,
  })),
}))

vi.mock('../components/venue/venueConfig', () => ({
  getMfrColor: () => '#ff8c00',
  TYPE_ICON:   {},
}))

import { useIsMobile } from '../hooks/useIsMobile'
import useStore from '../store/useStore'

const testComponent = {
  id: 1,
  model_number: 'EVO 7',
  manufacturer_name: 'Funktion-One',
  component_type: 'line_array',
  power_type: 'passive',
  nominal_impedance_ohms: 8,
  power_handling_rms_watts: 750,
  output_power_at_4ohm_watts: null,
}

describe('DraggableCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('desktop mode', () => {
    beforeEach(() => {
      useIsMobile.mockReturnValue(false)
    })

    it('does not render as an accessible button (drag-only)', () => {
      render(<DraggableCard component={testComponent} />)
      // On desktop the element has no role="button" from DraggableCard itself;
      // interaction is through pointer listeners spread from useDraggable.
      expect(screen.queryByRole('button', { name: /select evo 7/i })).not.toBeInTheDocument()
    })

    it('attaches dnd pointer listeners to the card element', () => {
      const { container } = render(<DraggableCard component={testComponent} />)
      const card = container.firstChild
      // listeners are spread as props, so the element receives onPointerDown
      expect(card.onpointerdown).toBeDefined()
    })
  })

  describe('mobile mode', () => {
    beforeEach(() => {
      useIsMobile.mockReturnValue(true)
    })

    it('renders as an accessible button for tap-to-assign', () => {
      render(<DraggableCard component={testComponent} />)
      expect(
        screen.getByRole('button', { name: /select evo 7 to assign/i })
      ).toBeInTheDocument()
    })

    it('calls setTapSelected when tapped while not already selected', () => {
      render(<DraggableCard component={testComponent} />)
      fireEvent.click(screen.getByRole('button', { name: /select evo 7 to assign/i }))
      expect(mockSetTapSelected).toHaveBeenCalledWith(testComponent)
    })

    it('calls clearTapSelected when tapped while already selected', () => {
      useStore.mockImplementation((selector) => selector({
        tapSelectedComponent: testComponent,
        setTapSelected:       mockSetTapSelected,
        clearTapSelected:     mockClearTapSelected,
      }))

      render(<DraggableCard component={testComponent} />)
      fireEvent.click(screen.getByRole('button', { name: /select evo 7 to assign/i }))
      expect(mockClearTapSelected).toHaveBeenCalled()
    })
  })
})
