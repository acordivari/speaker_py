import useStore from '../store/useStore'

const MANUFACTURER_COLORS = {
  'Funktion-One':      '#ff8c00',
  'Danley Sound Labs': '#4a90d9',
  'L-Acoustics':       '#cc2222',
  'd&b audiotechnik':  '#ff6b35',
  'Meyer Sound':       '#9b59b6',
  'QSC':               '#2980b9',
  'Lab.gruppen':       '#c0392b',
}

export default function Header() {
  const validationResult = useStore(s => s.validationResult)
  const isValidating     = useStore(s => s.isValidating)
  const resetAll         = useStore(s => s.resetAll)
  const manufacturers    = useStore(s => s.manufacturers)

  const statusColor = !validationResult
    ? '#7878a8'
    : validationResult.is_valid
      ? '#00ff88'
      : '#ff3d00'

  const statusText = isValidating
    ? 'VALIDATING…'
    : !validationResult
      ? 'NO CONFIGURATION'
      : validationResult.is_valid
        ? 'SYSTEM VALID'
        : 'ISSUES DETECTED'

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-venue-border bg-venue-panel/80 backdrop-blur-sm flex-shrink-0">
      {/* Logo / title */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-venue-muted font-mono uppercase tracking-widest">
            Sound Design Lab
          </span>
          <span className="text-sm font-bold tracking-wide text-white">
            Mission Ballroom
            <span className="text-venue-muted font-normal text-xs ml-2">Denver, CO</span>
          </span>
        </div>
      </div>

      {/* Brand color dots */}
      <div className="hidden md:flex items-center gap-2">
        {manufacturers.slice(0, 7).map(m => (
          <div
            key={m.id}
            className="h-2 w-2 rounded-full opacity-70"
            style={{ backgroundColor: MANUFACTURER_COLORS[m.name] ?? '#666' }}
            title={m.name}
          />
        ))}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full transition-colors duration-500"
            style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
          />
          <span
            className="text-xs font-mono tracking-widest transition-colors duration-500"
            style={{ color: statusColor }}
          >
            {statusText}
          </span>
        </div>

        <button
          onClick={resetAll}
          className="text-xs font-mono px-3 py-1 rounded border border-venue-border
                     text-venue-muted hover:border-brand-red hover:text-brand-red
                     transition-colors duration-200"
        >
          RESET
        </button>
      </div>
    </header>
  )
}
