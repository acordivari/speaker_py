/**
 * DroppableSlot placeholder-text and tap-assign tests.
 *
 * Desktop: empty slot should show "drag … here" instructional text.
 * Mobile:  when a compatible component is held (tapSelected), slot
 *          should prompt "tap to assign <model>" and execute the
 *          assignment on click.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DroppableSlot from '../components/channel/DroppableSlot'

vi.mock('@dnd-kit/core', () => ({
  useDroppable: vi.fn(() => ({
    isOver:     false,
    setNodeRef: vi.fn(),
  })),
}))

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(),
}))

const mockAssignAmp      = vi.fn()
const mockAddSpeaker     = vi.fn()
const mockClearTapSelected = vi.fn()

const ampComponent = {
  id: 10,
  model_number: 'F1000 SERIES II',
  manufacturer_name: 'Funktion-One',
  component_type: 'amplifier',
}

const speakerComponent = {
  id: 20,
  model_number: 'EVO 7',
  manufacturer_name: 'Funktion-One',
  component_type: 'line_array',
}

function makeStoreMock(tapSelected = null) {
  return vi.fn((selector) => selector({
    tapSelectedComponent: tapSelected,
    assignAmp:            mockAssignAmp,
    addSpeaker:           mockAddSpeaker,
    clearTapSelected:     mockClearTapSelected,
  }))
}

vi.mock('../store/useStore', () => ({ default: vi.fn() }))
vi.mock('../components/venue/venueConfig', () => ({ getMfrColor: () => '#7070a8' }))

import { useIsMobile } from '../hooks/useIsMobile'
import useStore from '../store/useStore'

describe('DroppableSlot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('desktop — empty amp slot', () => {
    beforeEach(() => {
      useIsMobile.mockReturnValue(false)
      useStore.mockImplementation(makeStoreMock(null))
    })

    it('shows drag-instructional text', () => {
      render(
        <DroppableSlot
          channelId="main-l"
          slotType="amp"
          label="AMP"
          occupied={false}
          component={null}
          onRemove={vi.fn()}
        />
      )
      expect(screen.getByText(/drag amp here/i)).toBeInTheDocument()
    })

    it('is not clickable (no onClick action)', () => {
      const { container } = render(
        <DroppableSlot
          channelId="main-l"
          slotType="amp"
          label="AMP"
          occupied={false}
          component={null}
          onRemove={vi.fn()}
        />
      )
      // The slot div should not have role="button" when no tap is active
      expect(container.firstChild.getAttribute('role')).toBeNull()
    })
  })

  describe('mobile — empty amp slot with compatible tapSelected', () => {
    beforeEach(() => {
      useIsMobile.mockReturnValue(true)
      useStore.mockImplementation(makeStoreMock(ampComponent))
    })

    it('shows tap-to-assign prompt with model number', () => {
      render(
        <DroppableSlot
          channelId="main-l"
          slotType="amp"
          label="AMP"
          occupied={false}
          component={null}
          onRemove={vi.fn()}
        />
      )
      expect(screen.getByText(/tap to assign f1000 series ii/i)).toBeInTheDocument()
    })

    it('calls assignAmp and clears selection on tap', () => {
      render(
        <DroppableSlot
          channelId="main-l"
          slotType="amp"
          label="AMP"
          occupied={false}
          component={null}
          onRemove={vi.fn()}
        />
      )
      fireEvent.click(screen.getByRole('button'))
      expect(mockAssignAmp).toHaveBeenCalledWith('main-l', ampComponent)
      expect(mockClearTapSelected).toHaveBeenCalled()
    })
  })

  describe('mobile — empty speaker slot with incompatible tapSelected (amp held)', () => {
    beforeEach(() => {
      useIsMobile.mockReturnValue(true)
      useStore.mockImplementation(makeStoreMock(ampComponent))
    })

    it('shows wrong-type message when held component is incompatible', () => {
      render(
        <DroppableSlot
          channelId="main-l"
          slotType="speaker"
          label="SPK"
          occupied={false}
          component={null}
          onRemove={vi.fn()}
          allowedTypes={['line_array', 'full_range']}
        />
      )
      expect(screen.getByText(/wrong type for spk slot/i)).toBeInTheDocument()
    })

    it('does not assign when incompatible type is tapped', () => {
      render(
        <DroppableSlot
          channelId="main-l"
          slotType="speaker"
          label="SPK"
          occupied={false}
          component={null}
          onRemove={vi.fn()}
          allowedTypes={['line_array', 'full_range']}
        />
      )
      fireEvent.click(screen.getByRole('button'))
      expect(mockAddSpeaker).not.toHaveBeenCalled()
      expect(mockClearTapSelected).not.toHaveBeenCalled()
    })
  })

  describe('mobile — empty speaker slot with compatible tapSelected', () => {
    beforeEach(() => {
      useIsMobile.mockReturnValue(true)
      useStore.mockImplementation(makeStoreMock(speakerComponent))
    })

    it('calls addSpeaker and clears selection on tap', () => {
      render(
        <DroppableSlot
          channelId="main-l"
          slotType="speaker"
          label="SPK"
          occupied={false}
          component={null}
          onRemove={vi.fn()}
          allowedTypes={['line_array', 'full_range']}
        />
      )
      fireEvent.click(screen.getByRole('button'))
      expect(mockAddSpeaker).toHaveBeenCalledWith('main-l', speakerComponent)
      expect(mockClearTapSelected).toHaveBeenCalled()
    })
  })
})
