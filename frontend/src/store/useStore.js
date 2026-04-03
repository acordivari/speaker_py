import { create } from 'zustand'
import { fetchManufacturers, fetchComponents, validateConfiguration } from '../services/api'

// ── Venue channel definitions ────────────────────────────────────────────────
// Each channel maps to a physical speaker position in Mission Ballroom.

export const VENUE_CHANNELS = [
  {
    id: 'main-l',
    label: 'Main Left Array',
    shortLabel: 'MAIN L',
    positionKey: 'MAIN_L',
    allowedSpeakerTypes: ['line_array', 'full_range'],
    description: 'Primary left PA hang — 10–12 KSL8/KSL12 elements covering the main floor.',
  },
  {
    id: 'main-r',
    label: 'Main Right Array',
    shortLabel: 'MAIN R',
    positionKey: 'MAIN_R',
    allowedSpeakerTypes: ['line_array', 'full_range'],
    description: 'Primary right PA hang — mirrors the left array for stereo coverage.',
  },
  {
    id: 'sub-c',
    label: 'Sub Array',
    shortLabel: 'SUBS',
    positionKey: 'SUB_C',
    allowedSpeakerTypes: ['subwoofer'],
    description: 'Centre sub cluster — 11× SL-GSUB providing LF support below 100 Hz.',
  },
  {
    id: 'ff',
    label: 'Front Fills',
    shortLabel: 'FF',
    positionKey: 'FF_C',
    allowedSpeakerTypes: ['fill', 'full_range', 'monitor'],
    description: 'Stage-lip fills covering the first rows that sit in the shadow of the main array.',
  },
  {
    id: 'delay-l',
    label: 'Delay Left',
    shortLabel: 'DLY L',
    positionKey: 'DELAY_L',
    allowedSpeakerTypes: ['full_range', 'fill', 'line_array'],
    description: 'Under-balcony delay clusters — cover the rear floor where the main arrays cannot reach.',
  },
  {
    id: 'delay-r',
    label: 'Delay Right',
    shortLabel: 'DLY R',
    positionKey: 'DELAY_R',
    allowedSpeakerTypes: ['full_range', 'fill', 'line_array'],
    description: 'Under-balcony delay clusters — right side complement to the left delay.',
  },
  {
    id: 'mon-l',
    label: 'Monitor L',
    shortLabel: 'MON L',
    positionKey: 'MON_L',
    allowedSpeakerTypes: ['monitor', 'full_range', 'subwoofer'],
    description: 'Stage left monitor system — performer reference and drum sub support.',
  },
  {
    id: 'mon-r',
    label: 'Monitor R',
    shortLabel: 'MON R',
    positionKey: 'MON_R',
    allowedSpeakerTypes: ['monitor', 'full_range', 'subwoofer'],
    description: 'Stage right monitor system — performer wedges and keys/guitar monitoring.',
  },
]

const makeDefaultChannel = (def) => ({
  ...def,
  amp: null,          // Component object | null
  speakers: [],       // [{ component: Component, count: number }]
  wiring: 'parallel',
  bridged: false,
})

// ── Store ────────────────────────────────────────────────────────────────────

const useStore = create((set, get) => ({
  // ── Remote data ──────────────────────────────────────────────────────────
  manufacturers: [],
  components: [],
  isLoadingData: true,
  dataError: null,

  // ── Configuration ─────────────────────────────────────────────────────────
  channels: VENUE_CHANNELS.map(makeDefaultChannel),
  selectedChannelId: 'main-l',

  // ── Validation ────────────────────────────────────────────────────────────
  validationResult: null,
  isValidating: false,
  validationError: null,

  // ── Component palette filter ───────────────────────────────────────────────
  activeManufacturerId: null,
  activeTypeFilter: null,

  // ── Actions ───────────────────────────────────────────────────────────────

  loadData: async () => {
    set({ isLoadingData: true, dataError: null })
    try {
      const [manufacturers, components] = await Promise.all([
        fetchManufacturers(),
        fetchComponents(),
      ])
      set({ manufacturers, components, isLoadingData: false })
    } catch (err) {
      set({ dataError: err.message, isLoadingData: false })
    }
  },

  selectChannel: (id) => set({ selectedChannelId: id }),

  setWiring: (channelId, wiring) =>
    set(state => ({
      channels: state.channels.map(ch =>
        ch.id === channelId ? { ...ch, wiring } : ch
      ),
    })),

  setBridged: (channelId, bridged) =>
    set(state => ({
      channels: state.channels.map(ch =>
        ch.id === channelId ? { ...ch, bridged } : ch
      ),
    })),

  assignAmp: (channelId, component) =>
    set(state => ({
      channels: state.channels.map(ch =>
        ch.id === channelId ? { ...ch, amp: component } : ch
      ),
    })),

  removeAmp: (channelId) =>
    set(state => ({
      channels: state.channels.map(ch =>
        ch.id === channelId ? { ...ch, amp: null } : ch
      ),
    })),

  addSpeaker: (channelId, component) =>
    set(state => ({
      channels: state.channels.map(ch => {
        if (ch.id !== channelId) return ch
        const existing = ch.speakers.find(s => s.component.id === component.id)
        if (existing) {
          // Increment count
          return {
            ...ch,
            speakers: ch.speakers.map(s =>
              s.component.id === component.id
                ? { ...s, count: s.count + 1 }
                : s
            ),
          }
        }
        return { ...ch, speakers: [...ch.speakers, { component, count: 1 }] }
      }),
    })),

  setSpeakerCount: (channelId, componentId, count) =>
    set(state => ({
      channels: state.channels.map(ch => {
        if (ch.id !== channelId) return ch
        if (count <= 0) {
          return { ...ch, speakers: ch.speakers.filter(s => s.component.id !== componentId) }
        }
        return {
          ...ch,
          speakers: ch.speakers.map(s =>
            s.component.id === componentId ? { ...s, count } : s
          ),
        }
      }),
    })),

  removeSpeaker: (channelId, componentId) =>
    set(state => ({
      channels: state.channels.map(ch =>
        ch.id !== channelId
          ? ch
          : { ...ch, speakers: ch.speakers.filter(s => s.component.id !== componentId) }
      ),
    })),

  clearChannel: (channelId) =>
    set(state => ({
      channels: state.channels.map(ch =>
        ch.id !== channelId ? ch : { ...ch, amp: null, speakers: [] }
      ),
    })),

  resetAll: () =>
    set({
      channels: VENUE_CHANNELS.map(makeDefaultChannel),
      validationResult: null,
    }),

  setManufacturerFilter: (id) => set({ activeManufacturerId: id }),
  setTypeFilter: (type) => set({ activeTypeFilter: type }),

  // ── Validation ────────────────────────────────────────────────────────────
  validate: async () => {
    const { channels } = get()

    // Only include channels that have at least one speaker or an amp
    const payload = channels
      .filter(ch => ch.amp || ch.speakers.length > 0)
      .map(ch => ({
        label: ch.label,
        amplifier_id: ch.amp ? ch.amp.id : null,
        speakers: ch.speakers.map(s => ({
          component_id: s.component.id,
          count: s.count,
        })),
        wiring: ch.wiring,
        bridged: ch.bridged,
      }))

    if (payload.length === 0) {
      set({ validationResult: null })
      return
    }

    set({ isValidating: true, validationError: null })
    try {
      const result = await validateConfiguration(payload)
      set({ validationResult: result, isValidating: false })
    } catch (err) {
      set({ validationError: err.message, isValidating: false })
    }
  },
}))

export default useStore
