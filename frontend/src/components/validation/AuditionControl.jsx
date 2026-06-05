import { useEffect, useRef } from 'react'
import { getFaultProfile } from '../../audio/faultProfiles'
import { useAudition } from '../../audio/useAudition'

const CYAN = '#00e5ff'
const AMBER = '#ffb300'

/**
 * Compact "hear the fault" control, shown inline in an issue card's always-
 * visible row (a sibling of the expand toggle, never nested inside it). Renders
 * nothing when the code has no honest audible demonstration or when Web Audio is
 * unavailable. While playing, a Clean ↔ Faulted toggle flips the DSP live over
 * the same loop so students can A/B the difference instantly.
 */
export default function AuditionControl({ code }) {
  const profile = getFaultProfile(code)
  const { activeCode, playing, mode, audition, setMode, stop, isSupported } = useAudition()

  const isActive = activeCode === code && playing

  // Stop only if THIS card is still the active audition when it unmounts. Read
  // the latest activeCode via a ref so switching cards mid-play doesn't trip a
  // stale cleanup that would stop the audition that just started elsewhere.
  const activeRef = useRef(activeCode)
  activeRef.current = activeCode
  useEffect(() => () => { if (activeRef.current === code) stop() }, [code, stop])

  if (!profile || !isSupported) return null

  const segStyle = on => ({
    color: on ? '#0b0b18' : 'var(--color-text-2)',
    background: on ? CYAN : 'transparent',
    borderColor: 'var(--color-border)',
  })

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0">
      <button
        type="button"
        onClick={() => audition(code, profile)}
        aria-pressed={isActive}
        title={isActive ? 'Stop' : `Hear what this sounds like: ${profile.label}`}
        className="px-2 py-1 rounded border text-[10px] font-mono font-bold tracking-wider transition-colors whitespace-nowrap"
        style={{
          color: isActive ? AMBER : CYAN,
          borderColor: isActive ? `${AMBER}66` : `${CYAN}66`,
          background: isActive ? `${AMBER}11` : `${CYAN}11`,
        }}
      >
        {isActive ? '■ Stop' : '▶ Hear it'}
      </button>

      {isActive && (
        <div
          role="group"
          aria-label="Clean or faulted audio"
          className="inline-flex rounded overflow-hidden border"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            type="button"
            onClick={() => setMode('clean')}
            aria-pressed={mode === 'clean'}
            className="px-2 py-1 text-[10px] font-mono border-r"
            style={{ ...segStyle(mode === 'clean'), borderColor: 'var(--color-border)' }}
          >
            Clean
          </button>
          <button
            type="button"
            onClick={() => setMode('fault')}
            aria-pressed={mode === 'fault'}
            className="px-2 py-1 text-[10px] font-mono"
            style={segStyle(mode === 'fault')}
          >
            Faulted
          </button>
        </div>
      )}
    </div>
  )
}
