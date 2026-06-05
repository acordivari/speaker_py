/**
 * IssueCard tests — focus on the audition control being surfaced in the
 * always-visible row (no expand required) and only for audible codes.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import IssueCard from '../components/validation/IssueCard'

const h = vi.hoisted(() => ({
  state: {
    activeCode: null, playing: false, mode: 'fault',
    audition: vi.fn(), setMode: vi.fn(), stop: vi.fn(), isSupported: true,
  },
}))
vi.mock('../audio/useAudition', () => ({ useAudition: () => h.state }))

beforeEach(() => {
  h.state = {
    activeCode: null, playing: false, mode: 'fault',
    audition: vi.fn(), setMode: vi.fn(), stop: vi.fn(), isSupported: true,
  }
})

const makeIssue = (over = {}) => ({
  severity: 'error',
  code: 'AMP_UNDERPOWERED',
  message: 'Amplifier is underpowered for this load.',
  educational_explanation: 'why...',
  recommendation: 'do this...',
  ...over,
})

describe('IssueCard audition surfacing', () => {
  it('shows Hear it in the collapsed row without expanding (audible code)', () => {
    render(<IssueCard issue={makeIssue()} />)
    // Detail sections are hidden until expand…
    expect(screen.queryByText('Why this matters')).not.toBeInTheDocument()
    // …but the audition button is already visible in the row.
    expect(screen.getByRole('button', { name: /hear it/i })).toBeInTheDocument()
  })

  it('shows no audition button for a non-audible code', () => {
    render(<IssueCard issue={makeIssue({ code: 'CONNECTOR_MISMATCH' })} />)
    expect(screen.queryByRole('button', { name: /hear it/i })).not.toBeInTheDocument()
  })

  it('reveals the fault blurb only after expanding', () => {
    render(<IssueCard issue={makeIssue()} />)
    expect(screen.queryByText(/runs out of headroom/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Amplifier is underpowered for this load.'))
    expect(screen.getByText(/runs out of headroom/i)).toBeInTheDocument()
  })

  it('does not nest the audition button inside the expand toggle', () => {
    render(<IssueCard issue={makeIssue()} />)
    const hearIt = screen.getByRole('button', { name: /hear it/i })
    // Walk ancestors: the Hear it button must not live inside another <button>.
    let el = hearIt.parentElement
    while (el) {
      expect(el.tagName).not.toBe('BUTTON')
      el = el.parentElement
    }
  })
})
