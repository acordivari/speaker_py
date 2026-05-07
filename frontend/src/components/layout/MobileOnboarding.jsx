const btnBase = {
  fontSize:     10,
  fontFamily:   'monospace',
  padding:      '7px 14px',
  borderRadius: 6,
  border:       'none',
  cursor:       'pointer',
  fontWeight:   700,
  letterSpacing: '0.06em',
}

export default function MobileOnboarding({ onTour, onPreset }) {
  return (
    <div
      className="flex-shrink-0 mx-2 mt-2 rounded-lg border"
      style={{ background: '#0f0f22', borderColor: '#2a2a50' }}
    >
      <div className="p-3">
        <div
          className="text-[10px] font-mono mb-2"
          style={{ color: '#ff8c00', letterSpacing: '0.12em' }}
        >
          GETTING STARTED
        </div>

        <ol className="space-y-1 mb-3">
          <li className="text-[10px] font-mono" style={{ color: '#7070a8' }}>
            1. Tap a component in <strong style={{ color: '#e0e0ff' }}>LIBRARY</strong>
          </li>
          <li className="text-[10px] font-mono" style={{ color: '#7070a8' }}>
            2. Switch to <strong style={{ color: '#ff8c00' }}>ASSIGN</strong> — tap a slot to place it
          </li>
          <li className="text-[10px] font-mono" style={{ color: '#7070a8' }}>
            3. See compatibility results in <strong style={{ color: '#e0e0ff' }}>CHECK</strong>
          </li>
        </ol>

        <div className="flex gap-2">
          <button
            aria-label="Take the tour"
            onClick={onTour}
            style={{ ...btnBase, background: '#00e5ff11', color: '#00e5ff', border: '1px solid #00e5ff44' }}
          >
            ▶ TOUR
          </button>
          <button
            aria-label="Load F1 Preset"
            onClick={onPreset}
            style={{ ...btnBase, background: '#ff8c0011', color: '#ff8c00', border: '1px solid #ff8c0044' }}
          >
            F1 PRESET →
          </button>
        </div>
      </div>
    </div>
  )
}
