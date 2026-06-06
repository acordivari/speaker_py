/**
 * ScenarioBar tests — live grading display, completion persistence, and exit.
 * Uses a real scenario (first-power-up) with crafted store state.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import ScenarioBar from '../components/scenarios/ScenarioBar'
import useStore from '../store/useStore'

vi.mock('../store/useStore', () => ({ default: vi.fn() }))

const exitScenario = vi.fn()
const recordCompletion = vi.fn()

function mockStore(state) {
  useStore.mockImplementation(selector =>
    selector({ exitScenario, recordCompletion, ...state }),
  )
}

// first-power-up requires: MAIN_L filled, ≥1 source, no errors. Stretch: no warnings.
const completeState = {
  activeScenarioId: 'first-power-up',
  channels: [{ id: 'main-l', label: 'Main Left Array', positionKey: 'MAIN_L', amp: { id: 1 }, speakers: [{ component: { id: 2 }, count: 2 }], limiterMode: 'none' }],
  validationResult: { is_valid: true, channel_results: [{ label: 'Main Left Array', amplifier: { id: 1 }, speakers: [{ id: 2 }], power_ratio: 1, issues: [] }], global_issues: [] },
  coverageResult: { stats: { active_source_count: 2, foh_spl_db: 100, back_wall_spl_db: 101, uniformity_db: 12 } },
}

const emptyState = {
  activeScenarioId: 'first-power-up',
  channels: [{ id: 'main-l', label: 'Main Left Array', positionKey: 'MAIN_L', amp: null, speakers: [], limiterMode: 'none' }],
  validationResult: null,
  coverageResult: null,
}

beforeEach(() => {
  exitScenario.mockClear()
  recordCompletion.mockClear()
})

describe('ScenarioBar', () => {
  it('renders nothing when no scenario is active', () => {
    mockStore({ activeScenarioId: null, channels: [], validationResult: null, coverageResult: null })
    const { container } = render(<ScenarioBar />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the mission title and live objectives', () => {
    mockStore(emptyState)
    render(<ScenarioBar />)
    expect(screen.getByText('First Power-Up')).toBeInTheDocument()
    expect(screen.getByText('0/3 objectives')).toBeInTheDocument()
  })

  it('marks complete and records the medal when objectives are met', () => {
    mockStore(completeState)
    render(<ScenarioBar />)
    expect(screen.getByText(/COMPLETE/)).toBeInTheDocument()
    expect(screen.getByText(/GOLD/)).toBeInTheDocument()
    expect(recordCompletion).toHaveBeenCalledWith('first-power-up', 'gold')
  })

  it('does not record completion when incomplete', () => {
    mockStore(emptyState)
    render(<ScenarioBar />)
    expect(recordCompletion).not.toHaveBeenCalled()
  })

  it('exits the mission on Exit click', () => {
    mockStore(emptyState)
    render(<ScenarioBar />)
    fireEvent.click(screen.getByRole('button', { name: /exit mission/i }))
    expect(exitScenario).toHaveBeenCalled()
  })
})
