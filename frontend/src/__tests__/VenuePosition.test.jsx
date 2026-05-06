/**
 * VenuePosition SVG node rendering tests.
 *
 * Key regression: the .pos-ring CSS animation must only be applied to
 * empty, unselected positions. Without transform-box:fill-box the SVG
 * transform scaled from the viewport origin (0,0), causing circles to
 * visually jump across the layout and intercept pointer events meant
 * for the ChannelEditor drop slots below.
 */
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import VenuePosition from '../components/venue/VenuePosition'

vi.mock('../components/venue/venueConfig', () => ({
  getMfrColor: () => '#ff8c00',
}))

const coords = { cx: 105, cy: 215 }

const emptyChannel = {
  id: 'main-l',
  label: 'Main Left Array',
  shortLabel: 'MAIN L',
  amp: null,
  speakers: [],
}

const populatedChannel = {
  ...emptyChannel,
  amp: { id: 10, model_number: 'F1000', manufacturer_name: 'Funktion-One' },
  speakers: [{ component: { id: 20, manufacturer_name: 'Funktion-One' }, count: 4 }],
}

function renderInSvg(ui) {
  const { container } = render(<svg>{ui}</svg>)
  return container
}

describe('VenuePosition animation class', () => {
  it('applies pos-ring to empty, unselected positions', () => {
    const container = renderInSvg(
      <VenuePosition
        channel={emptyChannel}
        coords={coords}
        isSelected={false}
        isValid={true}
        hasIssues={false}
        hasComponents={false}
        onSelect={vi.fn()}
      />
    )
    expect(container.querySelector('.pos-ring')).toBeInTheDocument()
  })

  it('does NOT apply pos-ring when the position is selected', () => {
    const container = renderInSvg(
      <VenuePosition
        channel={emptyChannel}
        coords={coords}
        isSelected={true}
        isValid={true}
        hasIssues={false}
        hasComponents={false}
        onSelect={vi.fn()}
      />
    )
    expect(container.querySelector('.pos-ring')).not.toBeInTheDocument()
  })

  it('does NOT apply pos-ring when the position has components', () => {
    const container = renderInSvg(
      <VenuePosition
        channel={populatedChannel}
        coords={coords}
        isSelected={false}
        isValid={true}
        hasIssues={false}
        hasComponents={true}
        onSelect={vi.fn()}
      />
    )
    expect(container.querySelector('.pos-ring')).not.toBeInTheDocument()
  })
})

describe('VenuePosition ring color states', () => {
  it('uses neutral color for empty positions', () => {
    const container = renderInSvg(
      <VenuePosition
        channel={emptyChannel}
        coords={coords}
        isSelected={false}
        isValid={true}
        hasIssues={false}
        hasComponents={false}
        onSelect={vi.fn()}
      />
    )
    const mainRing = container.querySelectorAll('circle')[1]
    expect(mainRing.getAttribute('stroke')).toBe('#7070a8')
  })

  it('uses cyan ring color when selected', () => {
    const container = renderInSvg(
      <VenuePosition
        channel={emptyChannel}
        coords={coords}
        isSelected={true}
        isValid={true}
        hasIssues={false}
        hasComponents={false}
        onSelect={vi.fn()}
      />
    )
    // When selected, circles render as: [0] glow halo, [1] main ring
    const mainRing = container.querySelectorAll('circle')[1]
    expect(mainRing.getAttribute('stroke')).toBe('#00e5ff')
  })

  it('uses green ring color when populated and valid', () => {
    const container = renderInSvg(
      <VenuePosition
        channel={populatedChannel}
        coords={coords}
        isSelected={false}
        isValid={true}
        hasIssues={false}
        hasComponents={true}
        onSelect={vi.fn()}
      />
    )
    const mainRing = container.querySelectorAll('circle')[1]
    expect(mainRing.getAttribute('stroke')).toBe('#00ff88')
  })

  it('uses red ring color when populated and invalid', () => {
    const container = renderInSvg(
      <VenuePosition
        channel={populatedChannel}
        coords={coords}
        isSelected={false}
        isValid={false}
        hasIssues={true}
        hasComponents={true}
        onSelect={vi.fn()}
      />
    )
    const mainRing = container.querySelectorAll('circle')[1]
    expect(mainRing.getAttribute('stroke')).toBe('#ff3d00')
  })
})
