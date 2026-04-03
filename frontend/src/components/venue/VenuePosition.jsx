import { getMfrColor } from './venueConfig'

/**
 * A single speaker-position node rendered inside the venue SVG.
 *
 * States:
 *  - Empty + unselected: dimmed pulsing ring
 *  - Empty + selected:   cyan ring + label
 *  - Populated + valid:  green glow
 *  - Populated + warning: amber glow
 *  - Populated + error:   red glow
 *  - Selected:            brighter ring + elevated z
 */
export default function VenuePosition({
  channel,
  coords,
  isSelected,
  isValid,
  hasIssues,
  hasComponents,
  onSelect,
}) {
  const { cx, cy } = coords

  // Color based on state
  let ringColor   = '#2a2a4a'
  let glowColor   = 'transparent'
  let labelColor  = '#3a3a5a'
  let innerColor  = '#141428'

  if (hasComponents) {
    if (!isValid) {
      ringColor  = '#ff3d00'
      glowColor  = '#ff3d0033'
      labelColor = '#ff6040'
      innerColor = '#2a0a00'
    } else if (hasIssues) {
      ringColor  = '#ffb300'
      glowColor  = '#ffb30033'
      labelColor = '#ffd060'
      innerColor = '#1a1200'
    } else {
      ringColor  = '#00ff88'
      glowColor  = '#00ff8833'
      labelColor = '#40ffa0'
      innerColor = '#001a0a'
    }
  }

  if (isSelected) {
    ringColor  = '#00e5ff'
    glowColor  = '#00e5ff44'
    labelColor = '#00e5ff'
  }

  // Speaker icons from first speaker in channel
  const firstSpeaker = channel.speakers[0]?.component
  const speakerCount = channel.speakers.reduce((s, e) => s + e.count, 0)
  const mfrColor = firstSpeaker
    ? getMfrColor(firstSpeaker.manufacturer_name)
    : (channel.amp ? getMfrColor(channel.amp.manufacturer_name) : '#444')

  return (
    <g
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={channel.label}
    >
      {/* Glow halo */}
      {(hasComponents || isSelected) && (
        <circle cx={cx} cy={cy} r={28} fill={glowColor}
                style={{ filter: 'blur(8px)' }} />
      )}

      {/* Pulsing outer ring (empty positions) */}
      {!hasComponents && !isSelected && (
        <circle cx={cx} cy={cy} r={22}
                fill="none"
                stroke="#1e1e3c"
                strokeWidth={1}
                opacity={0.5}
                className="pos-ring"
        />
      )}

      {/* Main ring */}
      <circle cx={cx} cy={cy} r={18}
              fill={innerColor}
              stroke={ringColor}
              strokeWidth={isSelected ? 2 : 1.5}
              style={{
                transition: 'stroke 0.3s, fill 0.3s',
                filter: isSelected ? `drop-shadow(0 0 6px ${ringColor})` : 'none',
              }}
      />

      {/* Manufacturer color dot (inner accent) */}
      {hasComponents && (
        <circle cx={cx} cy={cy} r={7}
                fill={mfrColor}
                opacity={0.8}
                style={{ filter: `drop-shadow(0 0 4px ${mfrColor})` }}
        />
      )}

      {/* Empty indicator */}
      {!hasComponents && (
        <circle cx={cx} cy={cy} r={3} fill={isSelected ? '#00e5ff' : '#2a2a4a'} />
      )}

      {/* Short label above */}
      <text
        x={cx} y={cy - 24}
        textAnchor="middle"
        fill={labelColor}
        fontSize="7"
        fontFamily="monospace"
        letterSpacing="1"
        style={{ transition: 'fill 0.3s', userSelect: 'none' }}
      >
        {channel.shortLabel}
      </text>

      {/* Speaker count badge */}
      {speakerCount > 0 && (
        <text
          x={cx + 14} y={cy - 10}
          fill={ringColor}
          fontSize="8"
          fontFamily="monospace"
          fontWeight="bold"
          style={{ userSelect: 'none' }}
        >
          ×{speakerCount}
        </text>
      )}

      {/* Amp indicator */}
      {channel.amp && (
        <text
          x={cx} y={cy + 30}
          textAnchor="middle"
          fill="#ffb30088"
          fontSize="7"
          fontFamily="monospace"
          style={{ userSelect: 'none' }}
        >
          ⚡ AMP
        </text>
      )}
    </g>
  )
}
