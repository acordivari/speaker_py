import { useState, useEffect, useRef, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core'

import useStore, { FUNKTION_ONE_PRESET } from './store/useStore'
import Header from './components/Header'
import ComponentPalette from './components/palette/ComponentPalette'
import VenueLayout from './components/venue/VenueLayout'
import ChannelEditor from './components/channel/ChannelEditor'
import ValidationPanel from './components/validation/ValidationPanel'
import DragGhostCard from './components/palette/DragGhostCard'
import SoundcheckModal from './components/soundcheck/SoundcheckModal'
import GlossaryModal from './components/glossary/GlossaryModal'
import ScenarioBar from './components/scenarios/ScenarioBar'
import ScenarioPicker from './components/scenarios/ScenarioPicker'
import MobileNavBar from './components/layout/MobileNavBar'
import MobileOnboarding from './components/layout/MobileOnboarding'
import DemoTour from './components/demo/DemoTour'
import { useIsMobile } from './hooks/useIsMobile'
import { fetchSoundcheckInfo } from './services/api'

export default function App() {
  const loadData      = useStore(s => s.loadData)
  const validate      = useStore(s => s.validate)
  const computeCoverage = useStore(s => s.computeCoverage)
  const assignAmp     = useStore(s => s.assignAmp)
  const addSpeaker    = useStore(s => s.addSpeaker)
  const loadPreset    = useStore(s => s.loadPreset)
  const channels      = useStore(s => s.channels)
  const isLoadingData = useStore(s => s.isLoadingData)
  const dataError     = useStore(s => s.dataError)
  const tapSelected   = useStore(s => s.tapSelectedComponent)
  const clearTapSelected = useStore(s => s.clearTapSelected)

  const hasConfig = channels.some(ch => ch.amp || ch.speakers.length > 0)

  const isMobile = useIsMobile()

  const [activeItem,     setActiveItem]     = useState(null)
  const [soundcheckOpen, setSoundcheckOpen] = useState(false)
  const [soundcheckInfo, setSoundcheckInfo] = useState({ available: false })
  const [glossaryOpen,   setGlossaryOpen]   = useState(false)
  const [scenarioPickerOpen, setScenarioPickerOpen] = useState(false)
  const [mobileTab,      setMobileTab]      = useState('library')
  const [demoActive,     setDemoActive]     = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 768 && !localStorage.getItem('sdl_tour_seen')
  )
  const [tourHighlight,  setTourHighlight]  = useState(false)

  // Debounced auto-validate + coverage recompute on any channel change
  const validateTimer = useRef(null)
  const scheduleValidate = useCallback(() => {
    clearTimeout(validateTimer.current)
    validateTimer.current = setTimeout(() => {
      validate()
      computeCoverage()
    }, 600)
  }, [validate, computeCoverage])

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
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen overflow-hidden bg-venue-bg">
        <Header
          soundcheckInfo={soundcheckInfo}
          onSoundcheck={() => setSoundcheckOpen(true)}
          onGlossary={() => setGlossaryOpen(true)}
          onNavigate={setMobileTab}
          onTour={() => setDemoActive(true)}
          onScenarios={() => setScenarioPickerOpen(true)}
          tourHighlight={tourHighlight}
        />

        <ScenarioBar />

        {/* ── Desktop layout (md+) ── 3-column ────────────────────────────── */}
        {!isMobile && (
        <div className="flex flex-1 overflow-hidden gap-3 p-3 pt-0">
          <aside data-tour="palette" className="w-72 flex-shrink-0 overflow-hidden flex flex-col">
            <ComponentPalette isLoading={isLoadingData} />
          </aside>

          <main className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
            <div data-tour="venue" className="flex-1 min-h-0">
              <VenueLayout />
            </div>
            <div data-tour="channel-editor" className="h-72 flex-shrink-0">
              <ChannelEditor />
            </div>
          </main>

          <aside data-tour="validation" className="w-80 flex-shrink-0 overflow-hidden flex flex-col">
            <ValidationPanel />
          </aside>
        </div>
        )}

        {/* ── Mobile layout (<md) ── single-panel + bottom nav ───────────── */}
        {isMobile && (
        <div className="flex flex-col flex-1 overflow-hidden">

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
                <span className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>
                  — tap a slot to assign
                </span>
              </div>
              <button
                onClick={clearTapSelected}
                aria-label="Cancel selection"
                className="flex-shrink-0 text-[10px] font-mono px-2 py-1 rounded ml-2 touch-target"
                style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
              >
                × cancel
              </button>
            </div>
          )}

          {/* Panel area — all panels rendered, only active one visible */}
          <div className="flex-1 overflow-hidden relative p-2">
            <div className={mobileTab === 'library' ? 'h-full flex flex-col' : 'hidden'}>
              {!hasConfig && (
                <MobileOnboarding
                  onTour={() => setDemoActive(true)}
                  onPreset={() => {
                    loadPreset(FUNKTION_ONE_PRESET)
                    setMobileTab('venue')
                  }}
                />
              )}
              <div className="flex-1 min-h-0">
                <ComponentPalette isLoading={isLoadingData} />
              </div>
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
            {/* Reference tab — glossary rendered inline, no modal overlay */}
            <div className={mobileTab === 'ref' ? 'h-full' : 'hidden'}>
              <GlossaryModal inline onClose={() => setMobileTab('library')} />
            </div>
          </div>

          {/* "Now playing" soundcheck strip — appears when system is valid and audio is ready */}
          {soundcheckInfo?.available && hasConfig && validationResult?.is_valid && (
            <button
              onClick={() => setSoundcheckOpen(true)}
              aria-label="Run soundcheck — system valid"
              className="flex-shrink-0 flex items-center justify-between w-full px-4 transition-all"
              style={{
                background:    'linear-gradient(135deg, #00ff8810 0%, #00e5ff08 100%)',
                borderTop:     '1px solid #00ff8844',
                minHeight:     '48px',
                animation:     'soundcheck-breathe 2.5s ease-in-out infinite',
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ color: '#00ff88', fontSize: '20px', lineHeight: 1 }}>◉</span>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[8px] font-mono tracking-widest" style={{ color: '#00ff8888' }}>
                    SYSTEM VALID
                  </span>
                  <span className="text-[12px] font-mono font-bold" style={{ color: '#00e5ff' }}>
                    RUN SOUNDCHECK
                  </span>
                </div>
              </div>
              <span className="text-sm font-mono" style={{ color: '#00e5ff66' }}>▶</span>
            </button>
          )}

          <MobileNavBar tab={mobileTab} setTab={setMobileTab} />
        </div>
        )}
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

      {scenarioPickerOpen && (
        <ScenarioPicker onClose={() => setScenarioPickerOpen(false)} />
      )}

      {demoActive && (
        <DemoTour onClose={() => {
          localStorage.setItem('sdl_tour_seen', '1')
          setDemoActive(false)
          setTourHighlight(true)
          if (isMobile) setMobileTab('venue')
          setTimeout(() => setTourHighlight(false), 5000)
        }} />
      )}
    </DndContext>
  )
}
