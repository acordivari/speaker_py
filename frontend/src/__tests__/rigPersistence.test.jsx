/**
 * Rig persistence (Zustand persist → localStorage 'sdl_rig') and the
 * RESET confirmation guard in the Header.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import useStore, { VENUE_CHANNELS } from '../store/useStore'
import Header from '../components/Header'

vi.mock('../services/api', () => ({
  fetchManufacturers:    vi.fn(() => Promise.resolve([])),
  fetchComponents:       vi.fn(() => Promise.resolve([])),
  validateConfiguration: vi.fn(() => Promise.resolve(null)),
  fetchCoverage:         vi.fn(() => Promise.resolve(null)),
  fetchSoundcheckInfo:   vi.fn(() => Promise.resolve({ available: false })),
}))

const TEST_AMP = { id: 7, model_number: 'TEST AMP', component_type: 'amplifier' }

function resetChannels() {
  useStore.setState({
    channels: VENUE_CHANNELS.map(def => ({
      ...def, amp: null, speakers: [], wiring: 'parallel', bridged: false, limiterMode: 'none',
    })),
    validationResult: null,
  })
}

describe('Rig persistence to localStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    resetChannels()
  })

  it('writes channel assignments under sdl_rig after an assignment', () => {
    useStore.getState().assignAmp('main-l', TEST_AMP)

    const raw = localStorage.getItem('sdl_rig')
    expect(raw).toBeTruthy()
    const persisted = JSON.parse(raw)
    const mainL = persisted.state.channels.find(ch => ch.id === 'main-l')
    expect(mainL.amp.id).toBe(TEST_AMP.id)
  })

  it('persists only channels — no fetched data or transient state', () => {
    useStore.getState().assignAmp('main-l', TEST_AMP)

    const persisted = JSON.parse(localStorage.getItem('sdl_rig'))
    expect(Object.keys(persisted.state)).toEqual(['channels'])
  })

  it('persists wiring and limiter choices', () => {
    useStore.getState().setWiring('sub-c', 'series')
    useStore.getState().setLimiterMode('sub-c', 'amp_dsp')

    const persisted = JSON.parse(localStorage.getItem('sdl_rig'))
    const subC = persisted.state.channels.find(ch => ch.id === 'sub-c')
    expect(subC.wiring).toBe('series')
    expect(subC.limiterMode).toBe('amp_dsp')
  })
})

describe('Header RESET confirmation', () => {
  beforeEach(() => {
    localStorage.clear()
    resetChannels()
    useStore.getState().assignAmp('main-l', TEST_AMP) // hasConfig → RESET visible
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not reset when the user cancels the confirm dialog', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<Header soundcheckInfo={{ available: false }} />)

    // Header renders desktop + mobile action bars (CSS-responsive) — either button works.
    fireEvent.click(screen.getAllByRole('button', { name: /reset all channel configurations/i })[0])

    expect(window.confirm).toHaveBeenCalledOnce()
    expect(useStore.getState().channels.find(ch => ch.id === 'main-l').amp).not.toBeNull()
  })

  it('resets all channels when the user confirms', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<Header soundcheckInfo={{ available: false }} />)

    fireEvent.click(screen.getAllByRole('button', { name: /reset all channel configurations/i })[0])

    const { channels } = useStore.getState()
    expect(channels.every(ch => !ch.amp && ch.speakers.length === 0)).toBe(true)
  })
})
