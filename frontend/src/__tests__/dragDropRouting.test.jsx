/**
 * Drag-drop routing tests (handleDragEnd in App).
 *
 * Regression: closestCenter collision detection used the ghost card's
 * center — not the cursor — to find the target droppable. Because the
 * ghost starts at the dragged element's top-left, its center rides above
 * the cursor when the card is grabbed near its top edge. Dragging toward
 * the speaker slot caused the amp slot above it to register as `over`,
 * silently rejecting every speaker drop.
 *
 * Fix: switched to pointerWithin, which uses actual cursor coordinates.
 *
 * These tests verify the routing table inside handleDragEnd regardless
 * of which collision algorithm is in use.
 */
import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'

// ── Hoist mock fns so vi.mock factories can reference them ───────────────────

const { mockAssignAmp, mockAddSpeaker } = vi.hoisted(() => ({
  mockAssignAmp:  vi.fn(),
  mockAddSpeaker: vi.fn(),
}))

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('../services/api', () => ({
  fetchManufacturers:    vi.fn(() => Promise.resolve([])),
  fetchComponents:       vi.fn(() => Promise.resolve([])),
  validateConfiguration: vi.fn(() => Promise.resolve(null)),
  fetchSoundcheckInfo:   vi.fn(() => Promise.resolve({ available: false })),
}))

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

vi.mock('../store/useStore', () => {
  const CHANNELS = [
    { id: 'main-l', label: 'Main Left Array', shortLabel: 'MAIN L',
      positionKey: 'MAIN_L', allowedSpeakerTypes: ['line_array', 'full_range'],
      description: '', amp: null, speakers: [], wiring: 'parallel', bridged: false },
  ]
  const state = {
    channels:             CHANNELS,
    manufacturers:        [],
    components:           [],
    isLoadingData:        false,
    dataError:            null,
    validationResult:     null,
    isValidating:         false,
    selectedChannelId:    'main-l',
    tapSelectedComponent: null,
    loadData:             vi.fn(),
    validate:             vi.fn(),
    assignAmp:            mockAssignAmp,
    addSpeaker:           mockAddSpeaker,
    selectChannel:        vi.fn(),
    clearTapSelected:     vi.fn(),
    setTapSelected:       vi.fn(),
    resetAll:             vi.fn(),
    loadPreset:           vi.fn(),
  }
  return {
    default:             vi.fn((selector) => selector(state)),
    VENUE_CHANNELS:      CHANNELS,
    FUNKTION_ONE_PRESET: [],
  }
})

// Capture onDragEnd from DndContext so tests can invoke it directly.
let capturedOnDragEnd = null

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ onDragEnd, children }) => {
    capturedOnDragEnd = onDragEnd
    return <>{children}</>
  },
  DragOverlay:   () => null,
  PointerSensor: class {},
  useSensor:     vi.fn(),
  useSensors:    vi.fn(() => []),
  pointerWithin: vi.fn(),
  useDraggable:  vi.fn(() => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), isDragging: false })),
  useDroppable:  vi.fn(() => ({ isOver: false, setNodeRef: vi.fn() })),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const speakerComponent = { id: 20, model_number: 'EVO 7',          component_type: 'line_array' }
const ampComponent     = { id: 10, model_number: 'F1000 SERIES II', component_type: 'amplifier'  }

function makeDragEvent(component, slotType, channelId = 'main-l') {
  return {
    active: { data: { current: { component } } },
    over:   slotType ? { data: { current: { channelId, slotType } } } : null,
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('handleDragEnd routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedOnDragEnd = null
    render(<App />)
  })

  it('speaker dropped on speaker slot → addSpeaker called', () => {
    act(() => capturedOnDragEnd(makeDragEvent(speakerComponent, 'speaker')))
    expect(mockAddSpeaker).toHaveBeenCalledWith('main-l', speakerComponent)
    expect(mockAssignAmp).not.toHaveBeenCalled()
  })

  it('amplifier dropped on amp slot → assignAmp called', () => {
    act(() => capturedOnDragEnd(makeDragEvent(ampComponent, 'amp')))
    expect(mockAssignAmp).toHaveBeenCalledWith('main-l', ampComponent)
    expect(mockAddSpeaker).not.toHaveBeenCalled()
  })

  it('speaker dropped on amp slot → rejected silently', () => {
    act(() => capturedOnDragEnd(makeDragEvent(speakerComponent, 'amp')))
    expect(mockAssignAmp).not.toHaveBeenCalled()
    expect(mockAddSpeaker).not.toHaveBeenCalled()
  })

  it('amplifier dropped on speaker slot → rejected silently', () => {
    act(() => capturedOnDragEnd(makeDragEvent(ampComponent, 'speaker')))
    expect(mockAssignAmp).not.toHaveBeenCalled()
    expect(mockAddSpeaker).not.toHaveBeenCalled()
  })

  it('drop with no over target → nothing called', () => {
    act(() => capturedOnDragEnd(makeDragEvent(speakerComponent, null)))
    expect(mockAssignAmp).not.toHaveBeenCalled()
    expect(mockAddSpeaker).not.toHaveBeenCalled()
  })
})
