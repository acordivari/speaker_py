import { useDroppable } from '@dnd-kit/core'
import { getMfrColor } from '../venue/venueConfig'

const TYPE_LABELS = {
  line_array: 'LINE ARRAY',
  full_range:  'FULL RANGE',
  subwoofer:   'SUBWOOFER',
  monitor:     'MONITOR',
  fill:        'FILL',
  amplifier:   'AMPLIFIER',
}

/**
 * A drop target for a single component slot inside the ChannelEditor.
 * slotType: 'amp' | 'speaker'
 */
export default function DroppableSlot({
  channelId,
  slotType,
  occupied,
  component,
  label,
  onRemove,
  count,
  onCountChange,
  componentId,
  allowedTypes,
}) {
  // Occupied slots get a unique ID so dnd-kit never sees duplicate droppable registrations
  const droppableId = componentId
    ? `${channelId}::${slotType}::${componentId}`
    : `${channelId}::${slotType}`
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { channelId, slotType },
  })

  const accentColor = component ? getMfrColor(component.manufacturer_name) : '#38385e'
  const borderColor = isOver
    ? '#00e5ff'
    : occupied
      ? accentColor
      : '#28284e'

  return (
    <div
      ref={setNodeRef}
      className="rounded border transition-all duration-150 flex items-center gap-2 px-2 py-1.5 min-h-[44px]"
      style={{
        borderColor,
        background: isOver
          ? '#00e5ff08'
          : occupied
            ? `${accentColor}08`
            : '#161626',
        boxShadow: isOver ? `0 0 12px #00e5ff22` : 'none',
      }}
    >
      {/* Slot type label */}
      <div
        className="text-[9px] font-mono flex-shrink-0 w-8 text-center rounded px-1"
        style={{ color: isOver ? '#00e5ff' : '#3a3a5a', border: `1px solid ${borderColor}33` }}
      >
        {label}
      </div>

      {!occupied && (
        <div
          className="text-[9px] font-mono flex-1 text-center"
          style={{ color: isOver ? '#00e5ff88' : '#38385e' }}
        >
          {isOver
            ? `DROP ${slotType.toUpperCase()}`
            : allowedTypes
              ? `drag ${allowedTypes.map(t => TYPE_LABELS[t] ?? t.toUpperCase()).join(' / ')} here`
              : `drag ${slotType} here`}
        </div>
      )}

      {occupied && component && (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {/* Model */}
          <span
            className="text-xs font-mono font-bold truncate"
            style={{ color: accentColor }}
          >
            {component.model_number}
          </span>
          <span className="text-[9px] font-mono text-venue-muted truncate hidden sm:block">
            {component.manufacturer_name}
          </span>

          {/* Count stepper (speakers only) */}
          {slotType === 'speaker' && count !== undefined && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
              <button
                onClick={() => onCountChange(count - 1)}
                className="w-5 h-5 rounded text-xs font-mono border border-venue-border
                           text-venue-muted hover:border-brand-cyan hover:text-brand-cyan
                           transition-colors leading-none"
              >
                −
              </button>
              <span className="text-xs font-mono text-white w-5 text-center">
                {count}
              </span>
              <button
                onClick={() => onCountChange(count + 1)}
                className="w-5 h-5 rounded text-xs font-mono border border-venue-border
                           text-venue-muted hover:border-brand-cyan hover:text-brand-cyan
                           transition-colors leading-none"
              >
                +
              </button>
            </div>
          )}

          {/* Remove button */}
          <button
            onClick={onRemove}
            className="flex-shrink-0 w-5 h-5 rounded text-[10px] font-mono border
                       border-venue-border text-venue-muted hover:border-brand-red
                       hover:text-brand-red transition-colors leading-none ml-1"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
