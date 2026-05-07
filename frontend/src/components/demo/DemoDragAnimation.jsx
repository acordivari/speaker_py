import { useState, useEffect } from 'react'

const CARD_WIDTH = 160

export default function DemoDragAnimation({ fromRect, toRect }) {
  const [phase, setPhase] = useState('hidden')

  const fromX = fromRect.left + fromRect.width  / 2 - CARD_WIDTH / 2
  const fromY = fromRect.top  + 140
  const toX   = toRect.left   + toRect.width    / 2 - CARD_WIDTH / 2
  const toY   = toRect.top    + 36

  const dx = toX - fromX
  const dy = toY - fromY

  useEffect(() => {
    const ids = []
    function cycle() {
      setPhase('hidden')
      ids.push(setTimeout(() => setPhase('visible'),  300))
      ids.push(setTimeout(() => setPhase('moving'),   700))
      ids.push(setTimeout(() => setPhase('arrived'), 2200))
      ids.push(setTimeout(() => setPhase('hidden'),  2800))
      ids.push(setTimeout(cycle,                     3400))
    }
    cycle()
    return () => ids.forEach(clearTimeout)
  }, [])

  const atDest  = phase === 'moving' || phase === 'arrived'
  const visible = phase !== 'hidden'

  return (
    <div style={{
      position:     'fixed',
      left:         fromX,
      top:          fromY,
      width:        CARD_WIDTH,
      zIndex:       1100,
      pointerEvents: 'none',
      opacity:      visible ? 1 : 0,
      transform:    atDest ? `translate(${dx}px, ${dy}px)` : 'translate(0, 0)',
      transition:   phase === 'moving'
        ? 'transform 1.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s'
        : 'opacity 0.35s',
    }}>
      <div style={{
        background:   'linear-gradient(135deg, #161626 0%, #1e1e36 100%)',
        border:       '1px solid #ff8c00',
        color:        '#ff8c00',
        borderRadius: 6,
        padding:      '8px 12px',
        fontFamily:   'monospace',
        fontSize:     13,
        boxShadow:    '0 8px 32px #00000099, 0 0 20px #ff8c0044',
      }}>
        <div style={{ fontWeight: 700 }}>EVO 7</div>
        <div style={{ fontSize: 10, opacity: 0.6 }}>Funktion-One</div>
      </div>
    </div>
  )
}
