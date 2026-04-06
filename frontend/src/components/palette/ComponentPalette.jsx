import { useState, useMemo } from 'react'
import useStore from '../../store/useStore'
import DraggableCard from './DraggableCard'
import { getMfrColor } from '../venue/venueConfig'

const TYPE_OPTIONS = [
  { value: null,         label: 'ALL' },
  { value: 'line_array', label: 'LINE ARRAY' },
  { value: 'full_range', label: 'FULL RANGE' },
  { value: 'subwoofer',  label: 'SUBWOOFER' },
  { value: 'monitor',    label: 'MONITOR' },
  { value: 'fill',       label: 'FILL' },
  { value: 'amplifier',  label: 'AMPLIFIER' },
]

export default function ComponentPalette({ isLoading }) {
  const components    = useStore(s => s.components)
  const manufacturers = useStore(s => s.manufacturers)

  const [selectedMfr,  setMfr]  = useState(null)
  const [selectedType, setType] = useState(null)
  const [search,       setSearch] = useState('')

  const filtered = useMemo(() => {
    return components.filter(c => {
      if (selectedMfr  && c.manufacturer_name !== selectedMfr)  return false
      if (selectedType && c.component_type    !== selectedType)  return false
      if (search) {
        const q = search.toLowerCase()
        return (
          c.model_number.toLowerCase().includes(q) ||
          (c.manufacturer_name ?? '').toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [components, selectedMfr, selectedType, search])

  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-venue-border flex-shrink-0">
        <div className="text-xs font-mono text-venue-muted uppercase tracking-widest mb-2">
          Component Library
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search model, brand…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs font-mono bg-venue-surface border border-venue-border
                     rounded px-2 py-1 text-white placeholder-venue-muted focus:outline-none
                     focus:border-brand-cyan mb-2"
        />

        {/* Type filter pills */}
        <div className="flex flex-wrap gap-1 mb-2">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value ?? '__all__'}
              onClick={() => setType(opt.value)}
              className="text-[8px] font-mono px-1.5 py-0.5 rounded border transition-colors"
              style={{
                borderColor: selectedType === opt.value ? '#00e5ff' : '#28284e',
                color:       selectedType === opt.value ? '#00e5ff' : '#4a4a6a',
                background:  selectedType === opt.value ? '#00e5ff11' : 'transparent',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Manufacturer filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setMfr(null)}
            className="text-[8px] font-mono px-1.5 py-0.5 rounded border transition-colors"
            style={{
              borderColor: selectedMfr === null ? '#00e5ff' : '#28284e',
              color:       selectedMfr === null ? '#00e5ff' : '#4a4a6a',
            }}
          >
            ALL
          </button>
          {manufacturers.map(m => {
            const color = getMfrColor(m.name)
            const active = selectedMfr === m.name
            return (
              <button
                key={m.id}
                onClick={() => setMfr(active ? null : m.name)}
                className="text-[8px] font-mono px-1.5 py-0.5 rounded border transition-colors"
                style={{
                  borderColor: active ? color : '#28284e',
                  color:       active ? color : '#4a4a6a',
                  background:  active ? `${color}11` : 'transparent',
                }}
                title={m.name}
              >
                {m.name.split(' ')[0]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Component list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {isLoading && (
          <div className="text-center text-venue-muted text-xs font-mono py-8 animate-pulse">
            Loading components…
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center text-venue-muted text-xs font-mono py-8">
            No components match.
          </div>
        )}

        {!isLoading && filtered.map(c => (
          <DraggableCard key={c.id} component={c} />
        ))}
      </div>

      {/* Footer count */}
      <div className="px-3 py-1.5 border-t border-venue-border flex-shrink-0">
        <span className="text-[9px] font-mono text-venue-muted">
          {filtered.length} / {components.length} components · drag to channel slots ↓
        </span>
      </div>
    </div>
  )
}
