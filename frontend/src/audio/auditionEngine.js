/**
 * Fault Audition Engine
 * =====================
 * A small Web Audio singleton that auditions what a fault sounds like. It
 * generates one short, transient-rich loop (so clipping/limiting are obvious),
 * plays it through a switchable DSP graph, and lets the UI flip between the
 * "clean" and "faulted" processing in real time over the same audio.
 *
 * Only one audition plays at a time. UI state is exposed through a tiny
 * subscribe/getState store (consumed via useSyncExternalStore). All audio nodes
 * live in module refs — never in React state.
 *
 * Audio is created lazily inside the user gesture that starts playback, so it
 * satisfies browser autoplay policy and stays inert under SSR / jsdom (where
 * AudioContext does not exist).
 */

const AudioCtx =
  typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)

export const isAuditionSupported = Boolean(AudioCtx)

// ── UI state store (subscribe / getState) ────────────────────────────────────

let state = { activeCode: null, playing: false, mode: 'fault' }
const listeners = new Set()

function setState(patch) {
  state = { ...state, ...patch }
  listeners.forEach(l => l())
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState() {
  return state
}

// ── Audio refs ───────────────────────────────────────────────────────────────

let ctx = null
let loopBuffer = null
let sourceNode = null
let lfoNode = null
let nodes = null // current effect chain { input, applyMode, dropoutDepth, ... }

// ── Synth loop: pink-noise bed + periodic kick/snare transients ──────────────

function buildLoopBuffer(audioCtx) {
  const dur = 2.0
  const sr = audioCtx.sampleRate
  const len = Math.floor(dur * sr)
  const buf = audioCtx.createBuffer(1, len, sr)
  const d = buf.getChannelData(0)

  // Pink-ish noise bed (Paul Kellet filter) at low level.
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99765 * b0 + white * 0.0990460
    b1 = 0.96300 * b1 + white * 0.2965164
    b2 = 0.57000 * b2 + white * 1.0526913
    d[i] = ((b0 + b1 + b2 + white * 0.1848) / 5) * 0.25
  }

  const beat = Math.floor(0.5 * sr) // 120 BPM → 4 beats in 2 s
  // Kicks on the beat: decaying low sine.
  for (let t = 0; t < len; t += beat) {
    for (let k = 0; k < 0.18 * sr && t + k < len; k++) {
      const env = Math.exp(-k / (0.06 * sr))
      d[t + k] += Math.sin((2 * Math.PI * 60 * k) / sr) * env * 0.8
    }
  }
  // Snares on the off-beat: decaying noise burst.
  for (let t = Math.floor(0.25 * sr); t < len; t += beat) {
    for (let k = 0; k < 0.12 * sr && t + k < len; k++) {
      const env = Math.exp(-k / (0.03 * sr))
      d[t + k] += (Math.random() * 2 - 1) * env * 0.5
    }
  }

  // Normalize so the buffer itself never clips (faults add the clipping).
  let peak = 0
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(d[i]))
  if (peak > 0) {
    const g = 0.9 / peak
    for (let i = 0; i < len; i++) d[i] *= g
  }
  return buf
}

// ── WaveShaper curves (built once per context) ───────────────────────────────

let hardClipCurve = null
let softSatCurve = null

function makeCurves() {
  const N = 1024
  hardClipCurve = new Float32Array(N)
  softSatCurve = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * 2 - 1
    hardClipCurve[i] = Math.max(-1, Math.min(1, x)) // flat-top hard clip
    softSatCurve[i] = Math.tanh(x * 2)              // smooth saturation
  }
}

// ── Effect chain ─────────────────────────────────────────────────────────────
// One union graph: input → preGain → shaper → shelf → lpf → comp → gate → out.
// Each effect is just a set of clean vs faulted parameters on these nodes.

function buildChain(audioCtx) {
  const input = audioCtx.createGain()
  const preGain = audioCtx.createGain()
  const shaper = audioCtx.createWaveShaper()
  const shelf = audioCtx.createBiquadFilter(); shelf.type = 'highshelf'; shelf.frequency.value = 3000
  const lpf = audioCtx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 20000
  const comp = audioCtx.createDynamicsCompressor()
  const gate = audioCtx.createGain()
  const out = audioCtx.createGain()

  input.connect(preGain); preGain.connect(shaper); shaper.connect(shelf)
  shelf.connect(lpf); lpf.connect(comp); comp.connect(gate); gate.connect(out)
  out.connect(audioCtx.destination)

  return { input, preGain, shaper, shelf, lpf, comp, gate, out }
}

function neutral(n) {
  const t = ctx.currentTime
  n.preGain.gain.setTargetAtTime(1, t, 0.01)
  n.shaper.curve = null
  n.shelf.gain.setTargetAtTime(0, t, 0.01)
  n.lpf.frequency.setTargetAtTime(20000, t, 0.01)
  n.comp.threshold.value = 0; n.comp.ratio.value = 1; n.comp.knee.value = 0
  n.gate.gain.setTargetAtTime(1, t, 0.01)
  n.out.gain.setTargetAtTime(0.9, t, 0.01)
}

// Each effect's faulted configuration.
const EFFECTS = {
  clip(n) {
    n.preGain.gain.value = 4
    n.shaper.curve = hardClipCurve
    n.out.gain.value = 0.5
  },
  stress(n) {
    n.preGain.gain.value = 2.5
    n.shaper.curve = softSatCurve
    n.shelf.gain.value = 9
    n.out.gain.value = 0.7
  },
  breakup(n) {
    n.preGain.gain.value = 6
    n.shaper.curve = hardClipCurve
    n.shelf.gain.value = 6
    n.out.gain.value = 0.5
    startDropout(3.0, 0.5) // ragged dropouts on top of distortion
  },
  weak(n) {
    n.lpf.frequency.value = 1500 // dull, lifeless
    n.out.gain.value = 0.2
  },
  dropout(n) {
    startDropout(3.5, 0.47)
    n.out.gain.value = 0.9
  },
  pump(n) {
    n.comp.threshold.value = -32
    n.comp.ratio.value = 20
    n.comp.knee.value = 0
    n.comp.attack.value = 0.003
    n.comp.release.value = 0.18
    n.out.gain.value = 1.3 // makeup so the pumping is audible
  },
  mute(n) {
    n.out.gain.value = 0
  },
}

// A square-wave LFO that chops the gate gain → audible on/off dropouts.
function startDropout(freq, depthBias) {
  stopDropout()
  lfoNode = ctx.createOscillator()
  lfoNode.type = 'square'
  lfoNode.frequency.value = freq
  const depth = ctx.createGain()
  depth.gain.value = 0.5
  // gate.gain swings between ~depthBias-0.5 and ~depthBias+0.5 → on/off.
  nodes.gate.gain.value = depthBias
  lfoNode.connect(depth)
  depth.connect(nodes.gate.gain)
  lfoNode.start()
}

function stopDropout() {
  if (lfoNode) {
    try { lfoNode.stop() } catch { /* already stopped */ }
    lfoNode.disconnect()
    lfoNode = null
  }
}

function applyMode(mode, effectName) {
  if (!nodes) return
  neutral(nodes)
  stopDropout()
  if (mode === 'fault' && EFFECTS[effectName]) {
    EFFECTS[effectName](nodes)
  }
}

// ── Public controls ──────────────────────────────────────────────────────────

let currentEffect = null

function teardownPlayback() {
  stopDropout()
  if (sourceNode) {
    try { sourceNode.stop() } catch { /* not started */ }
    sourceNode.disconnect()
    sourceNode = null
  }
  if (nodes) {
    Object.values(nodes).forEach(node => { try { node.disconnect() } catch { /* noop */ } })
    nodes = null
  }
}

export function stop() {
  teardownPlayback()
  currentEffect = null
  setState({ activeCode: null, playing: false })
}

/**
 * Toggle an audition. Calling again with the active code stops it. A new code
 * replaces the current audition. Starts in the faulted mode so the named
 * problem is heard immediately; flip to clean to compare.
 */
export async function audition(code, profile) {
  if (!isAuditionSupported || !profile) return

  // Clicking the playing card again → stop.
  if (state.activeCode === code && state.playing) {
    stop()
    return
  }

  teardownPlayback()

  if (!ctx) {
    ctx = new AudioCtx()
    makeCurves()
  }
  if (ctx.state === 'suspended') await ctx.resume()
  if (!loopBuffer) loopBuffer = buildLoopBuffer(ctx)

  nodes = buildChain(ctx)
  currentEffect = profile.effect
  sourceNode = ctx.createBufferSource()
  sourceNode.buffer = loopBuffer
  sourceNode.loop = true
  sourceNode.connect(nodes.input)

  applyMode('fault', currentEffect)
  sourceNode.start()
  setState({ activeCode: code, playing: true, mode: 'fault' })
}

/** Switch the live processing between 'clean' and 'fault'. */
export function setMode(mode) {
  if (!state.playing) return
  applyMode(mode, currentEffect)
  setState({ mode })
}
