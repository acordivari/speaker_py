/**
 * MobileOnboarding component tests.
 *
 * Pure display component — no store access, no dnd-kit, no API calls.
 * Verifies the getting-started card renders correctly and that
 * its two CTAs invoke the correct callbacks.
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MobileOnboarding from '../components/layout/MobileOnboarding'

describe('MobileOnboarding', () => {
  it('renders the GETTING STARTED heading', () => {
    render(<MobileOnboarding onTour={vi.fn()} onPreset={vi.fn()} />)
    expect(screen.getByText(/getting started/i)).toBeInTheDocument()
  })

  it('references LIBRARY, ASSIGN, and CHECK in the step instructions', () => {
    render(<MobileOnboarding onTour={vi.fn()} onPreset={vi.fn()} />)
    expect(screen.getByText(/library/i)).toBeInTheDocument()
    expect(screen.getByText(/assign/i)).toBeInTheDocument()
    expect(screen.getByText(/check/i)).toBeInTheDocument()
  })

  it('calls onTour when the TOUR button is clicked', () => {
    const onTour = vi.fn()
    render(<MobileOnboarding onTour={onTour} onPreset={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /take the tour/i }))
    expect(onTour).toHaveBeenCalledOnce()
  })

  it('calls onPreset when the F1 PRESET button is clicked', () => {
    const onPreset = vi.fn()
    render(<MobileOnboarding onTour={vi.fn()} onPreset={onPreset} />)
    fireEvent.click(screen.getByRole('button', { name: /load f1 preset/i }))
    expect(onPreset).toHaveBeenCalledOnce()
  })
})
