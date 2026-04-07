import { useDraggable } from '@dnd-kit/core'
import { getMfrColor, TYPE_ICON } from '../venue/venueConfig'
import useStore from '../../store/useStore'
import { useIsMobile } from '../../hooks/useIsMobile'

const TYPE_LABELS = {
  line_array: 'LINE ARRAY',
  full_range: 'FULL RANGE',
  subwoofer:  'SUBWOOFER',
  monitor:    'MONITOR',
  fill:       'FILL',
  amplifier:  'AMPLIFIER',
  processor:  'PROCESSOR',
}

export default function DraggableCard({ component }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `comp-${component.id}`,
    data: { component },
  })

  const tapSelected     = useStore(s => s.tapSelectedComponent)
  const setTapSelected  = useStore(s => s.setTapSelected)
  const clearTapSelected = useStore(s => s.clearTapSelected)
  const isMobile        = useIsMobile()

  const isSelected  = tapSelected?.id === component.id
  const accentColor = getMfrColor(component.manufacturer_name)
  const typeLabel   = TYPE_LABELS[component.component_type] ?? component.component_type.toUpperCase()
  const icon        = TYPE_ICON[component.component_type] ?? '◉'
  const isActive    = component.power_type === 'active'

  function handleTap() {
    if (!isMobile) return
    if (isSelected) {
      clearTapSelected()
    } else {
      setTapSelected(component)
    }
  }

  // On mobile: plain button-like tap. On desktop: drag via dnd-kit listeners.
  const interactionProps = isMobile
    ? { onClick: handleTap }
    : { ...listeners, ...attributes }

  return (
    <div
      ref={setNodeRef}
      {...interactionProps}
      role={isMobile ? 'button' : undefined}
      aria-label={isMobile ? `Select ${component.model_number} to assign` : undefined}
      aria-pressed={isMobile ? isSelected : undefined}
      tabIndex={0}
      className="select-none rounded border transition-all duration-150"
      style={{
        opacity:     isDragging ? 0.3 : 1,
        cursor:      isMobile ? 'pointer' : isDragging ? 'grabbing' : 'grab',
        borderColor: isSelected
          ? accentColor
          : isDragging
            ? accentColor
            : '#3c3c68',
        background: isSelected
          ? `${accentColor}18`
          : isDragging
            ? `${accentColor}10`
            : 'linear-gradient(135deg, #161626 0%, #1e1e36 100%)',
        transform:   isDragging ? 'scale(0.97)' : 'scale(1)',
        boxShadow:   isSelected ? `0 0 0 1px ${accentColor}, 0 0 16px ${accentColor}33` : 'none',
      }}
      // Allow keyboard activation (Enter/Space) for accessibility
      onKeyDown={e => {
        if (isMobile && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleTap()
        }
      }}
    >
      {/* Left accent bar */}
      <div className="flex gap-2 p-2">
        <div
          className="w-0.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: accentColor, minHeight: '36px' }}
        />

        <div className="flex-1 min-w-0">
          {/* Model number + selected badge */}
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-xs font-bold font-mono truncate"
              style={{ color: accentColor }}
            >
              {component.model_number}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isSelected && (
                <span
                  className="text-[8px] font-mono px-1 rounded"
                  style={{ color: accentColor, background: accentColor + '22', border: `1px solid ${accentColor}44` }}
                >
                  SELECTED
                </span>
              )}
              <span className="text-[9px] font-mono text-slate-400">{icon}</span>
            </div>
          </div>

          {/* Manufacturer */}
          <div className="text-[9px] text-slate-400 font-mono truncate">
            {component.manufacturer_name}
          </div>

          {/* Type + key spec */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[8px] font-mono px-1 rounded"
                  style={{ color: accentColor + 'cc', border: `1px solid ${accentColor}33` }}>
              {typeLabel}
            </span>

            {isActive && (
              <span className="text-[8px] font-mono text-purple-400 border border-purple-700/40 px-1 rounded">
                ACTIVE
              </span>
            )}

            {!isActive && component.nominal_impedance_ohms && (
              <span className="text-[8px] font-mono text-slate-400">
                {component.nominal_impedance_ohms}Ω
              </span>
            )}

            {component.power_handling_rms_watts && (
              <span className="text-[8px] font-mono text-slate-400">
                {component.power_handling_rms_watts}W
              </span>
            )}

            {component.output_power_at_4ohm_watts && (
              <span className="text-[8px] font-mono text-amber-500">
                {component.output_power_at_4ohm_watts}W@4Ω
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
