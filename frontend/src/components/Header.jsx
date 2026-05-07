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

export default function Header({ soundcheckInfo, onSoundcheck, onGlossary, onNavigate, onTour, tourHighlight }) {
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
      ? 'NO CONFIG'
      : validationResult.is_valid
        ? 'VALID'
        : 'ISSUES'

  // Shared action button style
  const actionBtn = {
    borderColor: '#ff8c0066',
    color:       '#ff8c00',
  }
  const actionBtnHover = {
    enter: e => { e.currentTarget.style.borderColor = '#ff8c00'; e.currentTarget.style.background = '#ff8c0011' },
    leave: e => { e.currentTarget.style.borderColor = '#ff8c0066'; e.currentTarget.style.background = 'transparent' },
  }

  return (
    <header
      className="flex items-center justify-between px-4 py-2 border-b border-venue-border
                 bg-venue-panel/80 backdrop-blur-sm flex-shrink-0 relative z-20"
      role="banner"
    >
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

      {/* Brand color dots — desktop only */}
      <div className="hidden md:flex items-center gap-2" aria-hidden="true">
        {manufacturers.slice(0, 7).map(m => (
          <div
            key={m.id}
            className="h-2 w-2 rounded-full opacity-70"
            style={{ backgroundColor: MANUFACTURER_COLORS[m.name] ?? '#666' }}
            title={m.name}
          />
        ))}
      </div>

      {/* ── Desktop action bar ──────────────────────────────────────────── */}
      <div className="hidden md:flex items-center gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full transition-colors duration-500"
            style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
            aria-hidden="true"
          />
          <span
            role="status"
            aria-live="polite"
            className="text-xs font-mono tracking-widest transition-colors duration-500"
            style={{ color: statusColor }}
          >
            {isValidating ? 'VALIDATING…' : !validationResult ? 'NO CONFIGURATION' : validationResult.is_valid ? 'SYSTEM VALID' : 'ISSUES DETECTED'}
          </span>
        </div>

        {hasConfig && (
          <button
            data-tour="header-soundcheck"
            onClick={onSoundcheck}
            className="text-xs font-mono px-3 py-1 rounded border transition-all duration-200"
            style={{
              borderColor: soundcheckInfo?.available ? '#00e5ff66' : '#3c3c68',
              color:       soundcheckInfo?.available ? '#00e5ff'   : '#7070a8',
              background:  soundcheckInfo?.available ? '#00e5ff0d' : 'transparent',
              boxShadow:   tourHighlight && soundcheckInfo?.available ? '0 0 0 0 #00e5ff66' : undefined,
              animation:   tourHighlight && soundcheckInfo?.available ? 'tour-pulse-cyan 1s ease-in-out 4' : undefined,
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
          data-tour="header-f1"
          onClick={() => loadPreset(FUNKTION_ONE_PRESET)}
          className="text-xs font-mono px-3 py-1 rounded border transition-colors duration-200"
          style={{
            ...actionBtn,
            animation: tourHighlight ? 'tour-pulse-orange 1s ease-in-out 4' : undefined,
          }}
          onMouseEnter={actionBtnHover.enter}
          onMouseLeave={actionBtnHover.leave}
        >
          F1 PRESET
        </button>

        <button
          onClick={onGlossary}
          aria-label="Open electrical engineering reference glossary"
          className="text-xs font-mono px-3 py-1 rounded border transition-colors duration-200"
          style={actionBtn}
          onMouseEnter={actionBtnHover.enter}
          onMouseLeave={actionBtnHover.leave}
        >
          ⌁ REFERENCE
        </button>

        <button
          data-tour="header-reset"
          onClick={resetAll}
          aria-label="Reset all channel configurations"
          className="text-xs font-mono px-3 py-1 rounded border transition-colors duration-200"
          style={actionBtn}
          onMouseEnter={actionBtnHover.enter}
          onMouseLeave={actionBtnHover.leave}
        >
          RESET
        </button>

        <button
          onClick={onTour}
          className="text-xs font-mono px-3 py-1 rounded border transition-colors duration-200"
          style={{ borderColor: '#00e5ff44', color: '#00e5ff', background: 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#00e5ff11'; e.currentTarget.style.borderColor = '#00e5ff88' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#00e5ff44' }}
        >
          ▶ TOUR
        </button>
      </div>

      {/* ── Mobile: status + direct action chips ─────────────────────── */}
      <div className="flex md:hidden items-center gap-2">
        {/* Validation status */}
        <div className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusColor, boxShadow: `0 0 5px ${statusColor}` }}
            aria-hidden="true"
          />
          <span
            role="status"
            aria-live="polite"
            className="text-[9px] font-mono"
            style={{ color: statusColor }}
          >
            {statusText}
          </span>
        </div>

        {/* Soundcheck — when available and configured */}
        {hasConfig && soundcheckInfo?.available && (
          <button
            onClick={onSoundcheck}
            aria-label="Run soundcheck"
            className="flex items-center justify-center w-8 h-8 rounded border touch-target"
            style={{ borderColor: '#00e5ff44', color: '#00e5ff', background: '#00e5ff0d' }}
          >
            <span className="text-xs leading-none">◉</span>
          </button>
        )}

        {/* TOUR chip */}
        <button
          onClick={onTour}
          aria-label="Take the tour"
          className="text-[9px] font-mono px-2 py-1.5 rounded border touch-target"
          style={{ borderColor: '#00e5ff44', color: '#00e5ff', background: 'transparent' }}
        >
          TOUR
        </button>

        {/* F1 chip */}
        <button
          onClick={() => {
            loadPreset(FUNKTION_ONE_PRESET)
            onNavigate?.('venue')
          }}
          aria-label="Load F1 Preset"
          className="text-[9px] font-mono px-2 py-1.5 rounded border touch-target"
          style={{ borderColor: '#ff8c0066', color: '#ff8c00', background: 'transparent' }}
        >
          F1
        </button>

        {/* Reset */}
        <button
          onClick={resetAll}
          aria-label="Reset all channel configurations"
          className="flex items-center justify-center w-8 h-8 rounded border touch-target"
          style={{ borderColor: '#3c3c68', color: '#7070a8', background: 'transparent' }}
        >
          <span className="text-base leading-none">↺</span>
        </button>
      </div>
    </header>
  )
}
