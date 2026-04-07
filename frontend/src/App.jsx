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
import SoundcheckModal from './components/soundcheck/SoundcheckModal'
import GlossaryModal from './components/glossary/GlossaryModal'
import MobileNavBar from './components/layout/MobileNavBar'
import { fetchSoundcheckInfo } from './services/api'

export default function App() {
  const loadData      = useStore(s => s.loadData)
  const validate      = useStore(s => s.validate)
  const assignAmp     = useStore(s => s.assignAmp)
  const addSpeaker    = useStore(s => s.addSpeaker)
  const channels      = useStore(s => s.channels)
  const isLoadingData = useStore(s => s.isLoadingData)
  const dataError     = useStore(s => s.dataError)
  const tapSelected   = useStore(s => s.tapSelectedComponent)
  const clearTapSelected = useStore(s => s.clearTapSelected)

  const [activeItem,     setActiveItem]     = useState(null)
  const [soundcheckOpen, setSoundcheckOpen] = useState(false)
  const [soundcheckInfo, setSoundcheckInfo] = useState({ available: false })
  const [glossaryOpen,   setGlossaryOpen]   = useState(false)
  const [mobileTab,      setMobileTab]      = useState('library')

  // Debounced auto-validate on any channel change
  const validateTimer = useRef(null)
  const scheduleValidate = useCallback(() => {
    clearTimeout(validateTimer.current)
    validateTimer.current = setTimeout(validate, 600)
  }, [validate])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { scheduleValidate() }, [channels, scheduleValidate])
  useEffect(() => {
    fetchSoundcheckInfo().then(setSoundcheckInfo).catch(() => {})
  }, [])

  // When user picks a component on mobile, auto-navigate to Channels tab
  const prevTapSelected = useRef(null)
  useEffect(() => {
    if (tapSelected && !prevTapSelected.current) {
      setMobileTab('channels')
    }
    prevTapSelected.current = tapSelected
  }, [tapSelected])

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
        <Header
          soundcheckInfo={soundcheckInfo}
          onSoundcheck={() => setSoundcheckOpen(true)}
          onGlossary={() => setGlossaryOpen(true)}
        />

        {/* ── Desktop layout (md+) ── unchanged 3-column ─────────────────── */}
        <div className="hidden md:flex flex-1 overflow-hidden gap-3 p-3 pt-0">
          <aside className="w-72 flex-shrink-0 overflow-hidden flex flex-col">
            <ComponentPalette isLoading={isLoadingData} />
          </aside>

          <main className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
            <div className="flex-1 min-h-0">
              <VenueLayout />
            </div>
            <div className="h-56 flex-shrink-0">
              <ChannelEditor />
            </div>
          </main>

          <aside className="w-80 flex-shrink-0 overflow-hidden flex flex-col">
            <ValidationPanel />
          </aside>
        </div>

        {/* ── Mobile layout (<md) ── single-panel + bottom nav ───────────── */}
        <div className="flex md:hidden flex-col flex-1 overflow-hidden">

          {/* Tap-assign banner — shown when a component is held */}
          {tapSelected && (
            <div
              className="flex items-center justify-between px-3 py-2 flex-shrink-0"
              style={{ background: '#00e5ff14', borderBottom: '1px solid #00e5ff44' }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono" style={{ color: '#00e5ff' }}>▶</span>
                <span className="text-[10px] font-mono font-bold truncate" style={{ color: '#00e5ff' }}>
                  {tapSelected.model_number}
                </span>
                <span className="text-[10px] font-mono" style={{ color: '#7070a8' }}>
                  — tap a slot to assign
                </span>
              </div>
              <button
                onClick={clearTapSelected}
                aria-label="Cancel selection"
                className="flex-shrink-0 text-[10px] font-mono px-2 py-1 rounded ml-2 touch-target"
                style={{ color: '#7070a8', border: '1px solid #3c3c68' }}
              >
                × cancel
              </button>
            </div>
          )}

          {/* Panel area — all panels rendered, only active one visible */}
          <div className="flex-1 overflow-hidden relative p-2">
            <div className={mobileTab === 'library'  ? 'h-full' : 'hidden'}>
              <ComponentPalette isLoading={isLoadingData} />
            </div>
            <div className={mobileTab === 'venue'    ? 'h-full' : 'hidden'}>
              <VenueLayout />
            </div>
            <div className={mobileTab === 'channels' ? 'h-full' : 'hidden'}>
              <ChannelEditor />
            </div>
            <div className={mobileTab === 'results'  ? 'h-full' : 'hidden'}>
              <ValidationPanel />
            </div>
          </div>

          <MobileNavBar tab={mobileTab} setTab={setMobileTab} />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? <DragGhostCard component={activeItem} /> : null}
      </DragOverlay>

      {soundcheckOpen && (
        <SoundcheckModal
          onClose={() => setSoundcheckOpen(false)}
          channels={channels}
          soundcheckInfo={soundcheckInfo}
        />
      )}

      {glossaryOpen && (
        <GlossaryModal onClose={() => setGlossaryOpen(false)} />
      )}
    </DndContext>
  )
}
