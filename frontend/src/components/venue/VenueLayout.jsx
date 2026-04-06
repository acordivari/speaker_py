import useStore from '../../store/useStore'
import VenuePosition from './VenuePosition'
import { POSITION_COORDS } from './venueConfig'

export default function VenueLayout() {
  const channels          = useStore(s => s.channels)
  const selectedChannelId = useStore(s => s.selectedChannelId)
  const selectChannel     = useStore(s => s.selectChannel)
  const validationResult  = useStore(s => s.validationResult)

  // Build a map of positionKey → channel result for coloring
  const resultByLabel = {}
  if (validationResult) {
    validationResult.channel_results.forEach(r => {
      resultByLabel[r.label] = r
    })
  }

  return (
    <div className="panel h-full flex flex-col overflow-hidden relative">
      {/* Venue label */}
      <div className="absolute top-2 left-3 z-10 flex flex-col">
        <span className="text-[10px] font-mono text-venue-muted uppercase tracking-widest">
          Mission Ballroom · Denver
        </span>
        <span className="text-[9px] text-venue-muted/50">
          Bird's-eye view — drag components from palette → channel slots below
        </span>
      </div>

      <svg
        viewBox="0 0 800 560"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 0 40px #00e5ff08)' }}
      >
        {/* ── Ambient glow background ──────────────────────────────── */}
        <defs>
          <radialGradient id="floorGlow" cx="50%" cy="60%" r="55%">
            <stop offset="0%"   stopColor="#0a1628" />
            <stop offset="100%" stopColor="#0b0b18" />
          </radialGradient>
          <radialGradient id="stageGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#1a1a3e" />
            <stop offset="100%" stopColor="#161626" />
          </radialGradient>
          <filter id="bloom">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ── Outer venue shell ─────────────────────────────────────── */}
        <rect x="0" y="0" width="800" height="560" fill="#0b0b18" />
        <rect
          x="30" y="30" width="740" height="500" rx="14"
          fill="#141426" stroke="#28284e" strokeWidth="1.5"
        />

        {/* ── Balcony back ─────────────────────────────────────────── */}
        <rect x="90"  y="50"  width="620" height="85" rx="8"
              fill="#1b1b34" stroke="#28284e" strokeWidth="1" />
        <text x="400" y="98" textAnchor="middle" fill="#38385e"
              fontSize="9" fontFamily="monospace" letterSpacing="3">
          BALCONY
        </text>

        {/* ── Balcony sides ─────────────────────────────────────────── */}
        <rect x="30" y="135" width="90" height="230" rx="6"
              fill="#18182e" stroke="#28284e" strokeWidth="1" />
        <rect x="680" y="135" width="90" height="230" rx="6"
              fill="#18182e" stroke="#28284e" strokeWidth="1" />
        <text x="75"  y="255" textAnchor="middle" fill="#38385e"
              fontSize="8" fontFamily="monospace" transform="rotate(-90,75,255)" letterSpacing="2">
          BALCONY
        </text>
        <text x="725" y="255" textAnchor="middle" fill="#38385e"
              fontSize="8" fontFamily="monospace" transform="rotate(90,725,255)" letterSpacing="2">
          BALCONY
        </text>

        {/* ── Main floor ────────────────────────────────────────────── */}
        <rect x="120" y="135" width="560" height="250" rx="4"
              fill="url(#floorGlow)" stroke="#1a1a38" strokeWidth="1" />
        <text x="400" y="265" textAnchor="middle" fill="#1a1a38"
              fontSize="11" fontFamily="monospace" letterSpacing="4">
          GENERAL ADMISSION
        </text>

        {/* FOH mix position marker */}
        <circle cx="400" cy="295" r="16" fill="#0d1a30" stroke="#1e3a5a"
                strokeWidth="1" strokeDasharray="4 3" />
        <text x="400" y="299" textAnchor="middle" fill="#1e4a7a"
              fontSize="7" fontFamily="monospace" letterSpacing="1">
          FOH
        </text>

        {/* ── Stage area ────────────────────────────────────────────── */}
        <rect x="120" y="385" width="560" height="115" rx="6"
              fill="url(#stageGlow)" stroke="#1e1e4a" strokeWidth="1.5" />
        <rect x="140" y="390" width="520" height="2" rx="1" fill="#2a2a6a" opacity="0.5" />
        <text x="400" y="448" textAnchor="middle" fill="#2a2a6a"
              fontSize="13" fontFamily="monospace" letterSpacing="8">
          STAGE
        </text>

        {/* Stage lip highlight */}
        <line x1="155" y1="388" x2="645" y2="388"
              stroke="#2a2a8a" strokeWidth="2" opacity="0.6" />

        {/* ── Rigging / truss indicators ────────────────────────────── */}
        {/* Left truss */}
        <line x1="105" y1="55"  x2="105" y2="385" stroke="#1a1a3a"
              strokeWidth="1" strokeDasharray="6 6" opacity="0.5" />
        {/* Right truss */}
        <line x1="695" y1="55"  x2="695" y2="385" stroke="#1a1a3a"
              strokeWidth="1" strokeDasharray="6 6" opacity="0.5" />
        {/* Center sub cluster rigging */}
        <line x1="400" y1="55" x2="400" y2="375" stroke="#1a1a3a"
              strokeWidth="1" strokeDasharray="4 8" opacity="0.3" />

        {/* ── Speaker position nodes ────────────────────────────────── */}
        {channels.map(ch => {
          const coords = POSITION_COORDS[ch.positionKey]
          if (!coords) return null
          const isSelected = ch.id === selectedChannelId
          const channelResult = resultByLabel[ch.label]
          const isValid = !channelResult || channelResult.is_valid
          const hasIssues = channelResult && channelResult.issues.length > 0
          const hasComponents = ch.amp || ch.speakers.length > 0

          return (
            <VenuePosition
              key={ch.id}
              channel={ch}
              coords={coords}
              isSelected={isSelected}
              isValid={isValid}
              hasIssues={hasIssues}
              hasComponents={hasComponents}
              onSelect={() => selectChannel(ch.id)}
            />
          )
        })}

        {/* ── Room boundary labels ──────────────────────────────────── */}
        <text x="400" y="540" textAnchor="middle" fill="#1a1a30"
              fontSize="8" fontFamily="monospace" letterSpacing="6">
          SOUTH ENTRANCE
        </text>
        <text x="400" y="44" textAnchor="middle" fill="#1a1a30"
              fontSize="8" fontFamily="monospace" letterSpacing="6">
          NORTH / STAGE END
        </text>
      </svg>
    </div>
  )
}
