import { getMfrColor } from '../venue/venueConfig'

/** Floating ghost card shown under the cursor while dragging. */
export default function DragGhostCard({ component }) {
  const color = getMfrColor(component.manufacturer_name)
  return (
    <div
      className="drag-ghost rounded px-3 py-2 text-sm font-mono pointer-events-none"
      style={{
        background:   `linear-gradient(135deg, #0d0d1a 0%, #141428 100%)`,
        border:       `1px solid ${color}`,
        color:        color,
        minWidth:     '140px',
        boxShadow:    `0 8px 32px #00000099, 0 0 20px ${color}44`,
      }}
    >
      <div className="font-bold">{component.model_number}</div>
      <div className="text-[10px] opacity-60">{component.manufacturer_name}</div>
    </div>
  )
}
