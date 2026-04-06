import useStore, { FUNKTION_ONE_PRESET } from '../store/useStore'

const MANUFACTURER_COLORS = {
  'Funktion-One':      '#ff8c00',
  'Danley Sound Labs': '#4a90d9',
  'L-Acoustics':       '#cc2222',
  'd&b audiotechnik':  '#ff6b35',
  'Meyer Sound':       '#9b59b6',
  'QSC':               '#2980b9',
  'Lab.gruppen':       '#c0392b',
}

export default function Header({ soundcheckInfo, onSoundcheck }) {
  const validationResult = useStore(s => s.validationResult)
  const isValidating     = useStore(s => s.isValidating)
  const resetAll         = useStore(s => s.resetAll)
  const loadPreset       = useStore(s => s.loadPreset)
  const manufacturers    = useStore(s => s.manufacturers)
  const channels         = useStore(s => s.channels)

  const hasConfig = channels.some(ch => ch.amp || ch.speakers.length > 0)

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
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#ff8c00' }}>
            Sound Design Lab
          </span>
          <span className="text-sm font-bold tracking-wide text-white">
            Mission Ballroom
            <span className="font-normal text-xs ml-2" style={{ color: '#ff8c00' }}>Denver, CO</span>
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

        {hasConfig && (
          <button
            onClick={onSoundcheck}
            className="text-xs font-mono px-3 py-1 rounded border transition-all duration-200"
            style={{
              borderColor: soundcheckInfo?.available ? '#00e5ff66' : '#3c3c68',
              color:       soundcheckInfo?.available ? '#00e5ff'   : '#7070a8',
              background:  soundcheckInfo?.available ? '#00e5ff0d' : 'transparent',
            }}
            onMouseEnter={e => {
              if (!soundcheckInfo?.available) return
              e.currentTarget.style.borderColor = '#00e5ff'
              e.currentTarget.style.background  = '#00e5ff1a'
              e.currentTarget.style.boxShadow   = '0 0 12px #00e5ff33'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = soundcheckInfo?.available ? '#00e5ff66' : '#3c3c68'
              e.currentTarget.style.background  = soundcheckInfo?.available ? '#00e5ff0d' : 'transparent'
              e.currentTarget.style.boxShadow   = 'none'
            }}
            title={soundcheckInfo?.available ? 'Run soundcheck' : 'Place soundcheck.flac in backend/audio/ to enable'}
          >
            {soundcheckInfo?.available ? '◉ RUN SOUNDCHECK' : '◌ RUN SOUNDCHECK'}
          </button>
        )}

        <button
          onClick={() => loadPreset(FUNKTION_ONE_PRESET)}
          className="text-xs font-mono px-3 py-1 rounded border transition-colors duration-200"
          style={{
            borderColor: '#ff8c0066',
            color:       '#ff8c00',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff8c00'; e.currentTarget.style.background = '#ff8c0011' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#ff8c0066'; e.currentTarget.style.background = 'transparent' }}
        >
          F1 PRESET
        </button>

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
