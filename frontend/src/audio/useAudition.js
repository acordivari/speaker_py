import { useSyncExternalStore } from 'react'
import {
  subscribe,
  getState,
  audition,
  setMode,
  stop,
  isAuditionSupported,
} from './auditionEngine'

/**
 * React binding for the fault audition engine. Returns the shared playback
 * state ({ activeCode, playing, mode }) plus the controls. Every mounted
 * AuditionControl subscribes, so only the active card shows as playing.
 */
export function useAudition() {
  const state = useSyncExternalStore(subscribe, getState, getState)
  return { ...state, audition, setMode, stop, isSupported: isAuditionSupported }
}
