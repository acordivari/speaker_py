import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import useStore, { FUNKTION_ONE_PRESET } from '../../store/useStore'
import DemoSpotlight from './DemoSpotlight'
import DemoPanel from './DemoPanel'
import DemoDragAnimation from './DemoDragAnimation'
import { DEMO_STEPS } from './demoSteps'

// loadPreset must fire inside handleNext (the click handler), NOT a useEffect.
//
// If loadPreset runs in a useEffect triggered by stepIndex changing TO the last
// step, it synchronously updates the Zustand store while DemoTour is still
// mid-render. App (subscribed to channels) re-renders, creates a new onClose
// closure, and re-renders DemoTour — producing a second render cascade that
// leaves the portal content in an intermediate state on mobile where the panel
// disappears behind the full-screen overlay (blank screen bug).
//
// In a click handler, React 18 batches loadPreset's store update and
// onClose's setDemoActive(false) into a single render: DemoTour unmounts and
// the preset populates atomically with no intermediate state.

function getRect(tourKey) {
  const el = document.querySelector(`[data-tour="${tourKey}"]`)
  return el ? el.getBoundingClientRect() : null
}

export default function DemoTour({ onClose }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const [dragRects,  setDragRects]  = useState(null)
  const loadPreset = useStore(s => s.loadPreset)

  // Single fixed container appended to document.body.
  // All portal content lives inside one compositing layer, which fixes
  // the iOS Safari touch-event routing bug where sibling position:fixed
  // elements in portals bypass z-index stacking for touch events.
  const containerRef = useRef(null)
  if (!containerRef.current) {
    const el = document.createElement('div')
    el.style.cssText = 'position:fixed;inset:0;z-index:999;pointer-events:auto'
    containerRef.current = el
  }

  useEffect(() => {
    document.body.appendChild(containerRef.current)
    return () => {
      if (containerRef.current && containerRef.current.parentNode) {
        document.body.removeChild(containerRef.current)
      }
    }
  }, [])

  const step = DEMO_STEPS[stepIndex]

  const syncRects = useCallback(() => {
    setTargetRect(step.target ? getRect(step.target) : null)

    if (step.dragAnimation) {
      const from = getRect('palette')
      const to   = getRect('channel-editor')
      setDragRects(from && to ? { from, to } : null)
    } else {
      setDragRects(null)
    }
  }, [step])

  useEffect(() => {
    syncRects()
    window.addEventListener('resize', syncRects)
    return () => window.removeEventListener('resize', syncRects)
  }, [syncRects])

  const handleNext = useCallback(() => {
    if (stepIndex < DEMO_STEPS.length - 1) {
      setStepIndex(i => i + 1)
    } else {
      // Load preset and close in the same event handler so React 18 batches
      // the store update with setDemoActive(false) — one render, not two.
      loadPreset(FUNKTION_ONE_PRESET)
      onClose()
    }
  }, [stepIndex, onClose, loadPreset])

  const handleBack = useCallback(() => {
    setStepIndex(i => Math.max(0, i - 1))
  }, [])

  if (!containerRef.current) return null

  return createPortal(
    <>
      {/* pointerEvents:none — the container handles blocking; overlays are decorative */}
      <DemoSpotlight rect={targetRect} />
      {/* zIndex relative to container */}
      <DemoPanel
        step={step}
        stepIndex={stepIndex}
        totalSteps={DEMO_STEPS.length}
        targetRect={targetRect}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={onClose}
      />
      {step.dragAnimation && dragRects && (
        <DemoDragAnimation fromRect={dragRects.from} toRect={dragRects.to} />
      )}
    </>,
    containerRef.current
  )
}
