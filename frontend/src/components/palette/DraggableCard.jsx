import { useDraggable } from '@dnd-kit/core'
import { getMfrColor, TYPE_ICON } from '../venue/venueConfig'

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

  const accentColor = getMfrColor(component.manufacturer_name)
  const typeLabel   = TYPE_LABELS[component.component_type] ?? component.component_type.toUpperCase()
  const icon        = TYPE_ICON[component.component_type] ?? '◉'
  const isActive    = component.power_type === 'active'

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="select-none rounded border transition-all duration-150"
      style={{
        opacity:     isDragging ? 0.3 : 1,
        cursor:      isDragging ? 'grabbing' : 'grab',
        borderColor: isDragging ? accentColor : '#3c3c68',
        background:  isDragging
          ? `${accentColor}10`
          : 'linear-gradient(135deg, #161626 0%, #1e1e36 100%)',
        transform:   isDragging ? 'scale(0.97)' : 'scale(1)',
      }}
    >
      {/* Left accent bar */}
      <div className="flex gap-2 p-2">
        <div
          className="w-0.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: accentColor, minHeight: '36px' }}
        />

        <div className="flex-1 min-w-0">
          {/* Model number */}
          <div className="flex items-center justify-between gap-1">
            <span
              className="text-xs font-bold font-mono truncate"
              style={{ color: accentColor }}
            >
              {component.model_number}
            </span>
            <span className="text-[9px] font-mono text-slate-400 flex-shrink-0">
              {icon}
            </span>
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
