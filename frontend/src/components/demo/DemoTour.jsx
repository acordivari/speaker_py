import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import useStore, { FUNKTION_ONE_PRESET } from '../../store/useStore'
import DemoSpotlight from './DemoSpotlight'
import DemoPanel from './DemoPanel'
import DemoDragAnimation from './DemoDragAnimation'
import { DEMO_STEPS } from './demoSteps'

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

  useEffect(() => {
    if (step.isLast) loadPreset(FUNKTION_ONE_PRESET)
  }, [stepIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = useCallback(() => {
    if (stepIndex < DEMO_STEPS.length - 1) {
      setStepIndex(i => i + 1)
    } else {
      onClose()
    }
  }, [stepIndex, onClose])

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
