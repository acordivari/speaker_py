const PANEL_WIDTH = typeof window !== 'undefined' ? Math.min(380, window.innerWidth - 24) : 380
const GAP = 20

function getPanelStyle(panelSide, rect) {
  if (!rect || panelSide === 'center') {
    return {
      position:  'fixed',
      top:       '50%',
      left:      '50%',
      transform: 'translate(-50%, -50%)',
      width:     PANEL_WIDTH,
    }
  }

  const vw = window.innerWidth
  const vh = window.innerHeight

  function clampedVertical(idealTop) {
    return Math.max(16, Math.min(idealTop, vh - 360))
  }

  if (panelSide === 'right') {
    return {
      position: 'fixed',
      left: Math.min(rect.right + GAP, vw - PANEL_WIDTH - 16),
      top:  clampedVertical(rect.top + rect.height / 2 - 160),
      width: PANEL_WIDTH,
    }
  }

  if (panelSide === 'left') {
    return {
      position: 'fixed',
      left: Math.max(16, rect.left - GAP - PANEL_WIDTH),
      top:  clampedVertical(rect.top + rect.height / 2 - 160),
      width: PANEL_WIDTH,
    }
  }

  if (panelSide === 'bottom') {
    const idealLeft = rect.left + rect.width / 2 - PANEL_WIDTH / 2
    return {
      position: 'fixed',
      top:  Math.min(rect.bottom + GAP, vh - 300),
      left: Math.max(16, Math.min(idealLeft, vw - PANEL_WIDTH - 16)),
      width: PANEL_WIDTH,
    }
  }

  return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: PANEL_WIDTH }
}

const MISSION_GREEN = '#00ff88'

export default function DemoPanel({ step, stepIndex, totalSteps, targetRect, onNext, onBack, onSkip, onStartMission }) {
  const panelStyle = getPanelStyle(step.panelSide, targetRect)
  const isFirst = stepIndex === 0
  const isLast  = stepIndex === totalSteps - 1

  return (
    <div style={{
      ...panelStyle,
      zIndex:        2,
      background:    '#111122',
      border:        '1px solid #2a2a50',
      borderRadius:  12,
      padding:       '24px',
      boxShadow:     '0 24px 64px #000000cc, 0 0 48px #00e5ff0d',
      touchAction:   'manipulation',
    }}>
      <div style={{ color: '#00e5ff', fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.12em', marginBottom: 12 }}>
        STEP {stepIndex + 1} / {totalSteps}
      </div>

      <div style={{ color: '#ffffff', fontSize: 18, fontWeight: 700, marginBottom: 14, lineHeight: 1.3 }}>
        {step.title}
      </div>

      <div style={{ color: '#9090b8', fontSize: 13, lineHeight: 1.65 }}>
        {Array.isArray(step.body)
          ? step.body.map((p, i) => (
              <p key={i} style={{ margin: 0, marginBottom: i < step.body.length - 1 ? 12 : 0 }}>{p}</p>
            ))
          : <p style={{ margin: 0 }}>{step.body}</p>
        }
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid #1e1e36' }}>
        <button
          onClick={onSkip}
          style={{ color: '#3c3c60', fontSize: 11, fontFamily: 'monospace', background: 'none', border: 'none', cursor: 'pointer', padding: 0, touchAction: 'manipulation' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#6060a0' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#3c3c60' }}
        >
          SKIP TOUR
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          {!isFirst && (
            <button
              onClick={onBack}
              style={{
                fontSize: 11, fontFamily: 'monospace', padding: '6px 16px',
                borderRadius: 6, border: '1px solid #2a2a50', color: '#6060a0',
                background: 'transparent', cursor: 'pointer', touchAction: 'manipulation',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a4a80'; e.currentTarget.style.color = '#9090c0' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a50'; e.currentTarget.style.color = '#6060a0' }}
            >
              ← BACK
            </button>
          )}
          <button
            onClick={onNext}
            style={{
              fontSize: 11, fontFamily: 'monospace', padding: '6px 20px',
              borderRadius: 6, border: '1px solid #00e5ff66', color: '#00e5ff',
              background: '#00e5ff0d', cursor: 'pointer', touchAction: 'manipulation',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#00e5ff1a'; e.currentTarget.style.borderColor = '#00e5ffaa' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#00e5ff0d'; e.currentTarget.style.borderColor = '#00e5ff66' }}
          >
            {isLast ? 'EXPLORE FREELY →' : 'NEXT →'}
          </button>

          {/* Close-the-loop CTA: on the final step, send the student straight
              into the first guided mission instead of just dismissing the tour. */}
          {isLast && onStartMission && (
            <button
              onClick={onStartMission}
              style={{
                fontSize: 11, fontFamily: 'monospace', fontWeight: 700, padding: '6px 20px',
                borderRadius: 6, border: `1px solid ${MISSION_GREEN}88`, color: MISSION_GREEN,
                background: `${MISSION_GREEN}14`, cursor: 'pointer', touchAction: 'manipulation',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${MISSION_GREEN}26`; e.currentTarget.style.borderColor = MISSION_GREEN }}
              onMouseLeave={e => { e.currentTarget.style.background = `${MISSION_GREEN}14`; e.currentTarget.style.borderColor = `${MISSION_GREEN}88` }}
            >
              ◎ START MISSION 1 →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
