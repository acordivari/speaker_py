import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'

import useStore from './store/useStore'
import Header from './components/Header'
import ComponentPalette from './components/palette/ComponentPalette'
import VenueLayout from './components/venue/VenueLayout'
import ChannelEditor from './components/channel/ChannelEditor'
import ValidationPanel from './components/validation/ValidationPanel'
import DragGhostCard from './components/palette/DragGhostCard'

export default function App() {
  const loadData      = useStore(s => s.loadData)
  const validate      = useStore(s => s.validate)
  const assignAmp     = useStore(s => s.assignAmp)
  const addSpeaker    = useStore(s => s.addSpeaker)
  const channels      = useStore(s => s.channels)
  const isLoadingData = useStore(s => s.isLoadingData)
  const dataError     = useStore(s => s.dataError)

  const [activeItem, setActiveItem] = useState(null)

  // Debounced auto-validate on any channel change
  const validateTimer = useRef(null)
  const scheduleValidate = useCallback(() => {
    clearTimeout(validateTimer.current)
    validateTimer.current = setTimeout(validate, 600)
  }, [validate])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { scheduleValidate() }, [channels, scheduleValidate])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  function handleDragStart(event) {
    setActiveItem(event.active.data.current?.component ?? null)
  }

  function handleDragEnd(event) {
    setActiveItem(null)
    const { active, over } = event
    if (!over) return

    const component = active.data.current?.component
    if (!component) return

    const { channelId, slotType } = over.data.current ?? {}
    if (!channelId) return

    if (slotType === 'amp' && component.component_type === 'amplifier') {
      assignAmp(channelId, component)
    } else if (slotType === 'speaker' && component.component_type !== 'amplifier') {
      addSpeaker(channelId, component)
    }
  }

  if (dataError) {
    return (
      <div className="flex items-center justify-center h-screen text-red-400 font-mono">
        <div className="text-center space-y-3">
          <div className="text-3xl font-bold">⚠ API Offline</div>
          <div className="text-sm opacity-70">{dataError}</div>
          <div className="text-xs opacity-50 max-w-xs">
            Make sure the Python backend is running:
            <code className="block mt-1 bg-black/40 px-3 py-1 rounded">
              python3.9 run.py
            </code>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen overflow-hidden bg-venue-bg">
        <Header />

        <div className="flex flex-1 overflow-hidden gap-3 p-3 pt-0">
          {/* Left: Component Palette */}
          <aside className="w-72 flex-shrink-0 overflow-hidden flex flex-col">
            <ComponentPalette isLoading={isLoadingData} />
          </aside>

          {/* Center: Venue map + Channel editor */}
          <main className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
            <div className="flex-1 min-h-0">
              <VenueLayout />
            </div>
            <div className="h-56 flex-shrink-0">
              <ChannelEditor />
            </div>
          </main>

          {/* Right: Validation + Education */}
          <aside className="w-80 flex-shrink-0 overflow-hidden flex flex-col">
            <ValidationPanel />
          </aside>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? <DragGhostCard component={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
