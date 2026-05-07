/**
 * MobileNavBar tab label, badge, and highlight tests.
 *
 * Verifies:
 *   - All 5 tabs render with their new action-oriented labels
 *   - Active tab carries aria-selected=true; others carry false
 *   - The ASSIGN tab turns orange and pulses when tapSelectedComponent
 *     is non-null (guiding users from "selected a component" → "go assign it")
 *   - ASSIGN does NOT pulse when it is already the active tab
 *   - CHECK tab badge: red count on errors, amber count on warnings, green ✓ when valid
 *   - ASSIGN tab badge: cyan count when channels are configured
 *   - setTab is called with the correct internal ID on click
 */
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MobileNavBar from '../components/layout/MobileNavBar'

vi.mock('../store/useStore', () => ({ default: vi.fn() }))
import useStore from '../store/useStore'

function makeStore({
  validationResult    = null,
  channels            = [],
  tapSelectedComponent = null,
} = {}) {
  useStore.mockImplementation((selector) =>
    selector({ validationResult, channels, tapSelectedComponent })
  )
}

describe('MobileNavBar — tab labels', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    makeStore()
  })

  it('renders all 5 tabs with action-oriented labels', () => {
    render(<MobileNavBar tab="library" setTab={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'LIBRARY' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'MAP' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'ASSIGN' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'CHECK' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'GUIDE' })).toBeInTheDocument()
  })

  it('nav container has the correct tablist role and label', () => {
    render(<MobileNavBar tab="library" setTab={vi.fn()} />)
    expect(screen.getByRole('tablist', { name: 'Main navigation' })).toBeInTheDocument()
  })
})

describe('MobileNavBar — active state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    makeStore()
  })

  it('marks the active tab as aria-selected=true', () => {
    render(<MobileNavBar tab="venue" setTab={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'MAP' })).toHaveAttribute('aria-selected', 'true')
  })

  it('marks all other tabs as aria-selected=false', () => {
    render(<MobileNavBar tab="venue" setTab={vi.fn()} />)
    for (const label of ['LIBRARY', 'ASSIGN', 'CHECK', 'GUIDE']) {
      expect(screen.getByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'false')
    }
  })

  it('calls setTab with the correct internal id on click', () => {
    const setTab = vi.fn()
    render(<MobileNavBar tab="library" setTab={setTab} />)
    fireEvent.click(screen.getByRole('tab', { name: 'ASSIGN' }))
    expect(setTab).toHaveBeenCalledWith('channels')
  })

  it('calls setTab with "results" when CHECK tab is clicked', () => {
    const setTab = vi.fn()
    render(<MobileNavBar tab="library" setTab={setTab} />)
    fireEvent.click(screen.getByRole('tab', { name: 'CHECK' }))
    expect(setTab).toHaveBeenCalledWith('results')
  })
})

describe('MobileNavBar — ASSIGN tab highlight', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('ASSIGN tab is orange when tapSelectedComponent is non-null', () => {
    makeStore({ tapSelectedComponent: { id: 1, model_number: 'EVO 7' } })
    render(<MobileNavBar tab="library" setTab={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'ASSIGN' })).toHaveStyle({ color: '#ff8c00' })
  })

  it('ASSIGN tab is NOT highlighted when tapSelectedComponent is null', () => {
    makeStore({ tapSelectedComponent: null })
    render(<MobileNavBar tab="library" setTab={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'ASSIGN' })).toHaveStyle({ color: '#7070a8' })
  })

  it('ASSIGN tab stays cyan (not orange) when it is the active tab, even with tapSelectedComponent', () => {
    makeStore({ tapSelectedComponent: { id: 1, model_number: 'EVO 7' } })
    render(<MobileNavBar tab="channels" setTab={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'ASSIGN' })).toHaveStyle({ color: '#00e5ff' })
  })
})

describe('MobileNavBar — CHECK tab badges', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows red error count badge when validation has errors', () => {
    makeStore({
      validationResult: {
        is_valid: false,
        channel_results: [{ issues: [{ severity: 'error' }, { severity: 'warning' }] }],
        global_issues:   [],
      },
    })
    render(<MobileNavBar tab="library" setTab={vi.fn()} />)
    const checkTab = screen.getByRole('tab', { name: 'CHECK' })
    expect(within(checkTab).getByText('1')).toBeInTheDocument()
  })

  it('shows amber warning count badge when only warnings exist', () => {
    makeStore({
      validationResult: {
        is_valid: false,
        channel_results: [],
        global_issues:   [{ severity: 'warning' }, { severity: 'warning' }],
      },
    })
    render(<MobileNavBar tab="library" setTab={vi.fn()} />)
    const checkTab = screen.getByRole('tab', { name: 'CHECK' })
    expect(within(checkTab).getByText('2')).toBeInTheDocument()
  })

  it('shows green ✓ badge when config is fully valid', () => {
    makeStore({
      validationResult: {
        is_valid: true,
        channel_results: [],
        global_issues:   [],
      },
    })
    render(<MobileNavBar tab="library" setTab={vi.fn()} />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('shows no badge when there is no validation result yet', () => {
    makeStore({ validationResult: null })
    render(<MobileNavBar tab="library" setTab={vi.fn()} />)
    const checkTab = screen.getByRole('tab', { name: 'CHECK' })
    expect(within(checkTab).queryByText('✓')).not.toBeInTheDocument()
  })
})

describe('MobileNavBar — ASSIGN tab channel count badge', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('shows count badge when channels are configured', () => {
    makeStore({
      channels: [
        { amp: { id: 1 }, speakers: [] },
        { amp: null, speakers: [{ component: { id: 2 }, count: 2 }] },
        { amp: null, speakers: [] },
      ],
    })
    render(<MobileNavBar tab="library" setTab={vi.fn()} />)
    const assignTab = screen.getByRole('tab', { name: 'ASSIGN' })
    expect(within(assignTab).getByText('2')).toBeInTheDocument()
  })

  it('shows no badge when no channels are configured', () => {
    makeStore({ channels: [{ amp: null, speakers: [] }] })
    render(<MobileNavBar tab="library" setTab={vi.fn()} />)
    const assignTab = screen.getByRole('tab', { name: 'ASSIGN' })
    expect(within(assignTab).queryByText(/\d/)).not.toBeInTheDocument()
  })
})
