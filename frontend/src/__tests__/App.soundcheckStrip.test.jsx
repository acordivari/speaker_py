/**
 * Regression guard for the mobile soundcheck strip ReferenceError.
 *
 * App.jsx renders the "SYSTEM VALID → RUN SOUNDCHECK" strip when
 * `soundcheckInfo.available && hasConfig && validationResult.is_valid`.
 * `validationResult` was read without being selected from the store, which
 * threw a ReferenceError — but only on the deployed happy path (audio
 * available + a configured rig), because every other test mocked
 * fetchSoundcheckInfo to `available: false` and the && short-circuited
 * before the bad identifier evaluated. This suite exercises exactly that
 * previously-untested branch.
 */
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import App from '../App'
import useStore, { VENUE_CHANNELS } from '../store/useStore'

vi.mock('../services/api', () => ({
  fetchManufacturers:    vi.fn(() => Promise.resolve([])),
  fetchComponents:       vi.fn(() => Promise.resolve([])),
  validateConfiguration: vi.fn(() => Promise.resolve(null)),
  fetchCoverage:         vi.fn(() => Promise.resolve(null)),
  fetchSoundcheckInfo:   vi.fn(() => Promise.resolve({ available: true, url: '/audio/soundcheck.flac' })),
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
import { validateConfiguration } from '../services/api'

const TEST_AMP = { id: 1, model_number: 'TEST AMP', component_type: 'amplifier' }

const VALID_RESULT = {
  is_valid: true,
  summary: 'All channels valid.',
  global_issues: [],
  channel_results: [],
  system_metrics: {
    total_speaker_rms_watts: 3000,
    total_amp_output_watts: 1500,
    total_channels: 1,
    estimated_max_spl_db: null,
  },
}

function configureValidRig() {
  useStore.setState(state => ({
    channels: state.channels.map(ch =>
      ch.id === 'main-l' ? { ...ch, amp: TEST_AMP } : ch
    ),
    validationResult: VALID_RESULT,
  }))
}

describe('Mobile soundcheck strip (audio available + valid rig)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('sdl_tour_seen', '1') // keep the tour overlay out of the way
    useStore.setState({
      channels: VENUE_CHANNELS.map(def => ({
        ...def, amp: null, speakers: [], wiring: 'parallel', bridged: false, limiterMode: 'none',
      })),
      validationResult: null,
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('renders the strip on mobile without crashing', async () => {
    useIsMobile.mockReturnValue(true)
    configureValidRig()
    // App's debounced auto-validate refetches ~600ms after mount; resolve it
    // with the same valid result so it can't race the assertion window.
    validateConfiguration.mockResolvedValue(VALID_RESULT)
    render(<App />)
    // fetchSoundcheckInfo resolves async — wait for the strip to appear.
    expect(
      await screen.findByRole('button', { name: /run soundcheck — system valid/i })
    ).toBeInTheDocument()
  })

  it('does not render the strip when validation has issues', async () => {
    useIsMobile.mockReturnValue(true)
    configureValidRig()
    const invalidResult = { ...VALID_RESULT, is_valid: false }
    useStore.setState({ validationResult: invalidResult })
    validateConfiguration.mockResolvedValue(invalidResult)
    render(<App />)
    // The header's soundcheck chip renders once soundcheckInfo resolves with
    // available:true — waiting for it proves the fetch landed, so the strip's
    // absence below is due to is_valid, not an unresolved promise.
    await screen.findByRole('button', { name: 'Run soundcheck' })
    expect(
      screen.queryByRole('button', { name: /run soundcheck — system valid/i })
    ).not.toBeInTheDocument()
  })

  it('does not render the strip with an empty rig', async () => {
    useIsMobile.mockReturnValue(true)
    render(<App />)
    // No soundcheck-dependent UI exists with an empty rig, so flush the
    // mocked fetchSoundcheckInfo promise chain before asserting absence.
    await act(async () => {})
    expect(
      screen.queryByRole('button', { name: /run soundcheck — system valid/i })
    ).not.toBeInTheDocument()
  })
})
