import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { getMfrColor } from '../venue/venueConfig'
import useStore from '../../store/useStore'
import { useIsMobile } from '../../hooks/useIsMobile'

const TYPE_LABELS = {
  line_array: 'LINE ARRAY',
  full_range:  'FULL RANGE',
  subwoofer:   'SUBWOOFER',
  monitor:     'MONITOR',
  fill:        'FILL',
  amplifier:   'AMPLIFIER',
}

function isCompatible(component, slotType, allowedTypes) {
  if (!component) return false
  if (slotType === 'amp') return component.component_type === 'amplifier'
  if (slotType === 'speaker') {
    if (component.component_type === 'amplifier') return false
    if (allowedTypes && !allowedTypes.includes(component.component_type)) return false
    return true
  }
  return false
}

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
  const droppableId = componentId
    ? `${channelId}::${slotType}::${componentId}`
    : `${channelId}::${slotType}`
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: { channelId, slotType },
  })

  const tapSelected      = useStore(s => s.tapSelectedComponent)
  const clearTapSelected = useStore(s => s.clearTapSelected)
  const assignAmp        = useStore(s => s.assignAmp)
  const addSpeaker       = useStore(s => s.addSpeaker)
  const isMobile         = useIsMobile()

  const [flashIncompatible, setFlashIncompatible] = useState(false)

  const accentColor = component ? getMfrColor(component.manufacturer_name) : '#7070a8'

  // Determine if held component can land here
  const tapCompatible = tapSelected && isCompatible(tapSelected, slotType, allowedTypes)
  const tapActive     = isMobile && !!tapSelected

  const borderColor = flashIncompatible
    ? '#ff3d00'
    : isOver
      ? '#00e5ff'
      : tapActive && tapCompatible && !occupied
        ? '#00e5ff88'
        : occupied
          ? accentColor
          : '#3c3c68'

  const bgColor = flashIncompatible
    ? '#ff3d0010'
    : isOver
      ? '#00e5ff08'
      : tapActive && tapCompatible && !occupied
        ? '#00e5ff06'
        : occupied
          ? `${accentColor}08`
          : '#161626'

  function handleTapAssign() {
    if (!isMobile || !tapSelected) return

    if (!isCompatible(tapSelected, slotType, allowedTypes)) {
      // Flash red briefly to signal incompatibility
      setFlashIncompatible(true)
      setTimeout(() => setFlashIncompatible(false), 600)
      if (typeof navigator.vibrate === 'function') navigator.vibrate(50)
      return
    }

    if (slotType === 'amp') {
      assignAmp(channelId, tapSelected)
    } else {
      addSpeaker(channelId, tapSelected)
    }
    clearTapSelected()
    if (typeof navigator.vibrate === 'function') navigator.vibrate([20, 10, 20])
  }

  return (
    <div
      ref={setNodeRef}
      onClick={tapActive ? handleTapAssign : undefined}
      role={tapActive ? 'button' : undefined}
      aria-label={
        tapActive
          ? tapCompatible
            ? `Assign ${tapSelected?.model_number} to this ${slotType} slot`
            : `Incompatible slot for ${tapSelected?.model_number}`
          : undefined
      }
      className="rounded border transition-all duration-150 flex items-center gap-2 px-2 min-h-[44px]"
      style={{
        borderColor,
        background: bgColor,
        boxShadow:  isOver       ? `0 0 12px #00e5ff22`
                  : tapActive && tapCompatible && !occupied ? `0 0 8px #00e5ff18`
                  : 'none',
        cursor: tapActive ? (tapCompatible ? 'pointer' : 'not-allowed') : 'default',
        paddingTop:    '8px',
        paddingBottom: '8px',
      }}
    >
      {/* Slot type label */}
      <div
        className="text-[9px] font-mono flex-shrink-0 w-8 text-center rounded px-1 py-1"
        style={{ color: isOver ? '#00e5ff' : '#7070a0', border: `1px solid ${borderColor}33` }}
      >
        {label}
      </div>

      {!occupied && (
        <div
          className="text-[9px] font-mono flex-1 text-center"
          style={{
            color: flashIncompatible
              ? '#ff3d00'
              : isOver
                ? '#00e5ff88'
                : tapActive && tapCompatible
                  ? '#00e5ff66'
                  : '#7070a8',
          }}
        >
          {flashIncompatible
            ? '✖ incompatible type'
            : isOver
              ? `DROP ${slotType.toUpperCase()}`
              : tapActive && tapCompatible
                ? `tap to assign ${tapSelected.model_number}`
                : tapActive
                  ? `wrong type for ${label} slot`
                  : allowedTypes
                    ? `drag ${allowedTypes.map(t => TYPE_LABELS[t] ?? t.toUpperCase()).join(' / ')} here`
                    : `drag ${slotType} here`}
        </div>
      )}

      {occupied && component && (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span
            className="text-xs font-mono font-bold truncate"
            style={{ color: accentColor }}
          >
            {component.model_number}
          </span>
          <span className="text-[9px] font-mono text-slate-400 truncate hidden sm:block">
            {component.manufacturer_name}
          </span>

          {/* Count stepper (speakers only) */}
          {slotType === 'speaker' && count !== undefined && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
              <button
                onClick={e => { e.stopPropagation(); onCountChange(count - 1) }}
                aria-label="Decrease count"
                className="rounded text-xs font-mono border border-venue-border
                           text-venue-muted hover:border-brand-cyan hover:text-brand-cyan
                           transition-colors leading-none touch-target flex items-center justify-center"
                style={{ width: '28px', height: '28px' }}
              >
                −
              </button>
              <span className="text-xs font-mono text-white w-5 text-center">
                {count}
              </span>
              <button
                onClick={e => { e.stopPropagation(); onCountChange(count + 1) }}
                aria-label="Increase count"
                className="rounded text-xs font-mono border border-venue-border
                           text-venue-muted hover:border-brand-cyan hover:text-brand-cyan
                           transition-colors leading-none touch-target flex items-center justify-center"
                style={{ width: '28px', height: '28px' }}
              >
                +
              </button>
            </div>
          )}

          {/* Remove button */}
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            aria-label={`Remove ${component.model_number}`}
            className="flex-shrink-0 rounded text-[10px] font-mono border
                       border-venue-border text-venue-muted hover:border-brand-red
                       hover:text-brand-red transition-colors leading-none ml-1 touch-target
                       flex items-center justify-center"
            style={{ width: '28px', height: '28px' }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
