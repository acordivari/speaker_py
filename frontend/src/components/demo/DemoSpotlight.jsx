const PAD = 10
const OVERLAY = 'rgba(0,0,0,0.82)'

export default function DemoSpotlight({ rect }) {
  if (!rect) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: OVERLAY, zIndex: 1, pointerEvents: 'none' }} />
    )
  }

  const top    = rect.top    - PAD
  const left   = rect.left   - PAD
  const right  = rect.right  + PAD
  const bottom = rect.bottom + PAD
  const width  = rect.width  + PAD * 2
  const height = rect.height + PAD * 2

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: top,   background: OVERLAY, zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: bottom, left: 0, right: 0, bottom: 0, background: OVERLAY, zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top, left: 0, width: left,  height, background: OVERLAY, zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top, left: right, right: 0, height, background: OVERLAY, zIndex: 1, pointerEvents: 'none' }} />
      <div style={{
        position:     'fixed',
        top, left, width, height,
        border:       '2px solid #00e5ff',
        borderRadius: 8,
        boxShadow:    '0 0 0 4px #00e5ff1a, 0 0 32px #00e5ff44',
        zIndex:       1,
        pointerEvents: 'none',
      }} />
    </>
  )
}
