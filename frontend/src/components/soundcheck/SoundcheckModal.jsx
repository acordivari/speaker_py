import { useEffect, useRef, useState, useCallback } from 'react'

const FFT_SIZE = 2048
const CYAN    = '#00e5ff'
const ORANGE  = '#ff8c00'
const AMBER   = '#ffb300'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(sec) {
  if (!isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = String(Math.floor(sec % 60)).padStart(2, '0')
  return `${m}:${s}`
}

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width  = rect.width  * dpr
  canvas.height = rect.height * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  return { ctx, w: rect.width, h: rect.height }
}

// ── Visualizer drawing ────────────────────────────────────────────────────────

function drawOscilloscope(canvas, analyser, timeBuf) {
  const { ctx, w, h } = setupCanvas(canvas)
  analyser.getByteTimeDomainData(timeBuf)

  ctx.fillStyle = '#0b0b18'
  ctx.fillRect(0, 0, w, h)

  // Grid
  ctx.strokeStyle = '#1e1e36'
  ctx.lineWidth = 0.5
  for (let i = 1; i < 4; i++) {
    const y = (h / 4) * i
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2)
  ctx.strokeStyle = '#28284e'; ctx.lineWidth = 1; ctx.stroke()

  // Waveform
  ctx.beginPath()
  ctx.strokeStyle = CYAN
  ctx.lineWidth = 1.5
  ctx.shadowBlur = 6
  ctx.shadowColor = CYAN

  const sliceW = w / timeBuf.length
  let x = 0
  for (let i = 0; i < timeBuf.length; i++) {
    const v = timeBuf[i] / 128.0
    const y = (v / 2) * h
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    x += sliceW
  }
  ctx.stroke()
  ctx.shadowBlur = 0
}

function drawSpectrum(canvas, analyser, freqBuf) {
  const { ctx, w, h } = setupCanvas(canvas)
  analyser.getByteFrequencyData(freqBuf)

  ctx.fillStyle = '#0b0b18'
  ctx.fillRect(0, 0, w, h)

  // Grid lines
  ctx.strokeStyle = '#1e1e36'
  ctx.lineWidth = 0.5
  for (let i = 1; i < 4; i++) {
    const y = (h / 4) * i
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  const bins     = freqBuf.length
  const barW     = Math.max(1, (w / bins) * 1.8)
  const gap      = (w - barW * bins) / bins

  for (let i = 0; i < bins; i++) {
    const ratio     = freqBuf[i] / 255
    const barH      = ratio * h
    const x         = i * (barW + gap)

    // Colour: cyan at low amplitude → orange at high
    const grad = ctx.createLinearGradient(0, h, 0, h - barH)
    grad.addColorStop(0,   CYAN)
    grad.addColorStop(0.6, AMBER)
    grad.addColorStop(1,   ORANGE)
    ctx.fillStyle = grad
    ctx.fillRect(x, h - barH, barW, barH)

    // Peak dot
    if (ratio > 0.02) {
      ctx.fillStyle = '#ffffff44'
      ctx.fillRect(x, h - barH - 2, barW, 2)
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SoundcheckModal({ onClose, channels, soundcheckInfo }) {
  const [status,      setStatus]      = useState('idle')   // idle | loading | ready | playing | paused | error
  const [errMsg,      setErrMsg]      = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration,    setDuration]    = useState(0)

  const audioRef    = useRef(null)
  const ctxRef      = useRef(null)
  const analyserRef = useRef(null)
  const timeBufRef  = useRef(null)
  const freqBufRef  = useRef(null)
  const rafRef      = useRef(null)
  const oscRef      = useRef(null)
  const specRef     = useRef(null)
  const sourceRef   = useRef(null) // MediaElementSourceNode — created once

  // Summary stats from channels
  const activeChannels = channels.filter(ch => ch.amp || ch.speakers.length > 0)
  const totalSpeakers  = channels.reduce((s, ch) =>
    s + ch.speakers.reduce((n, e) => n + e.count, 0), 0)

  // ── Audio element setup (mount only — no Web Audio API yet) ────────────────
  // We load metadata here so duration is available before the user clicks play.
  // Web Audio API (AudioContext + analyser) is created on first play click so it
  // lives entirely inside a user gesture, satisfying browser autoplay policy.
  function initAudioElement() {
    if (audioRef.current) return
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'   // required for Web Audio API across origins
    audio.preload     = 'auto'
    audio.src         = `${import.meta.env.VITE_API_URL ?? ''}${soundcheckInfo.url}`

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
      setStatus('ready')
    })
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime))
    audio.addEventListener('ended', () => {
      setStatus('ready')
      setCurrentTime(0)
      cancelAnimationFrame(rafRef.current)
      clearCanvases()
    })
    audio.addEventListener('error', () => {
      setErrMsg('Failed to load audio file.')
      setStatus('error')
    })

    audioRef.current = audio
    setStatus('loading')
  }

  // Wire Web Audio API on first play (must be inside user gesture)
  function initWebAudio() {
    if (ctxRef.current) return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const ctx      = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize              = FFT_SIZE
    analyser.smoothingTimeConstant = 0.8

    const source = ctx.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(ctx.destination)

    ctxRef.current      = ctx
    analyserRef.current = analyser
    sourceRef.current   = source
    timeBufRef.current  = new Uint8Array(analyser.fftSize)
    freqBufRef.current  = new Uint8Array(analyser.frequencyBinCount)
  }

  function clearCanvases() {
    for (const ref of [oscRef, specRef]) {
      if (!ref.current) continue
      const { ctx, w, h } = setupCanvas(ref.current)
      ctx.fillStyle = '#0b0b18'
      ctx.fillRect(0, 0, w, h)
    }
  }

  // ── Render loop ────────────────────────────────────────────────────────────
  const renderLoop = useCallback(() => {
    if (!analyserRef.current) return
    if (oscRef.current)  drawOscilloscope(oscRef.current,  analyserRef.current, timeBufRef.current)
    if (specRef.current) drawSpectrum(specRef.current, analyserRef.current, freqBufRef.current)
    rafRef.current = requestAnimationFrame(renderLoop)
  }, [])

  // ── Controls ───────────────────────────────────────────────────────────────
  async function handlePlay() {
    try {
      // Wire Web Audio inside the click handler — browser autoplay policy
      // requires AudioContext creation + resume + play() to originate from
      // a user gesture with no async breaks before them.
      initWebAudio()
      const ctx   = ctxRef.current
      const audio = audioRef.current
      if (!ctx || !audio) return

      if (ctx.state === 'suspended') await ctx.resume()
      await audio.play()
      setStatus('playing')
      rafRef.current = requestAnimationFrame(renderLoop)
    } catch (e) {
      setErrMsg(`Playback failed: ${e.message}`)
      setStatus('error')
    }
  }

  function handlePause() {
    audioRef.current?.pause()
    cancelAnimationFrame(rafRef.current)
    setStatus('paused')
  }

  function handleSeek(e) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const pct = e.nativeEvent.offsetX / e.currentTarget.offsetWidth
    audio.currentTime = pct * duration
  }

  // ── Start loading audio metadata when modal opens ─────────────────────────
  useEffect(() => {
    if (soundcheckInfo.available) initAudioElement()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      audioRef.current?.pause()
      ctxRef.current?.close()
    }
  }, [])

  // ── Keyboard shortcut ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') {
        e.preventDefault()
        if (status === 'playing') handlePause()
        else if (status === 'ready' || status === 'paused') handlePlay()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status])

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#000000cc', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative flex flex-col rounded-xl border overflow-hidden"
        style={{
          width: 'min(92vw, 900px)',
          maxHeight: '90vh',
          background: '#0f0f20',
          borderColor: '#3c3c68',
          boxShadow: `0 0 60px #00e5ff18, 0 24px 80px #00000088`,
        }}
      >
        {/* ── Header bar ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b"
             style={{ borderColor: '#28284e' }}>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest"
                 style={{ color: CYAN }}>
              Soundcheck
            </div>
            <div className="text-sm font-bold text-white font-mono tracking-wide">
              Mission Ballroom
              <span className="text-xs font-normal ml-2"
                    style={{ color: ORANGE }}>Denver, CO</span>
            </div>
          </div>

          {/* Channel summary pills */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border"
                  style={{ color: CYAN, borderColor: CYAN + '44', background: CYAN + '0d' }}>
              {activeChannels.length} channels
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded border"
                  style={{ color: AMBER, borderColor: AMBER + '44', background: AMBER + '0d' }}>
              {totalSpeakers} elements
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-slate-400
                       hover:text-white hover:bg-white/10 transition-colors font-mono text-lg"
          >
            ×
          </button>
        </div>

        {/* ── Visualizers ────────────────────────────────────────────── */}
        <div className="flex gap-2 p-3 flex-1 min-h-0" style={{ minHeight: '260px' }}>
          {/* Oscilloscope */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <div className="text-[8px] font-mono uppercase tracking-widest text-venue-muted">
              Oscilloscope · time domain
            </div>
            <canvas
              ref={oscRef}
              className="flex-1 w-full rounded"
              style={{ background: '#0b0b18', border: '1px solid #1e1e36', minHeight: '140px' }}
            />
          </div>

          {/* Spectrum */}
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <div className="text-[8px] font-mono uppercase tracking-widest text-venue-muted">
              Spectrum analyzer · frequency domain
            </div>
            <canvas
              ref={specRef}
              className="flex-1 w-full rounded"
              style={{ background: '#0b0b18', border: '1px solid #1e1e36', minHeight: '140px' }}
            />
          </div>
        </div>

        {/* ── Transport ──────────────────────────────────────────────── */}
        <div className="px-4 pb-4 space-y-3">
          {/* File info */}
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
            <span>{soundcheckInfo.filename ?? 'soundcheck.flac'}</span>
            <span>{fmtTime(currentTime)} / {fmtTime(duration)}</span>
          </div>

          {/* Progress bar */}
          <div
            className="w-full rounded-full cursor-pointer relative overflow-hidden"
            style={{ height: '4px', background: '#1e1e36' }}
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(to right, ${CYAN}, ${ORANGE})`,
                boxShadow: status === 'playing' ? `0 0 8px ${CYAN}88` : 'none',
              }}
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3">
            {/* Play / Pause */}
            {status !== 'playing' ? (
              <button
                onClick={handlePlay}
                disabled={status === 'loading' || status === 'error' || status === 'idle'}
                className="flex items-center gap-2 px-4 py-1.5 rounded border text-xs font-mono
                           font-bold tracking-wider transition-all disabled:opacity-30"
                style={{
                  borderColor: CYAN,
                  color: CYAN,
                  background: CYAN + '15',
                  boxShadow: `0 0 12px ${CYAN}22`,
                }}
              >
                ▶ {status === 'loading' ? 'LOADING…' : status === 'paused' ? 'RESUME' : 'PLAY'}
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-4 py-1.5 rounded border text-xs font-mono
                           font-bold tracking-wider transition-all"
                style={{ borderColor: AMBER, color: AMBER, background: AMBER + '15' }}
              >
                ⏸ PAUSE
              </button>
            )}

            {/* Status badge */}
            <div className="ml-auto text-[9px] font-mono tracking-widest"
                 style={{ color: STATUS_COLOR[status] ?? '#7070a8' }}>
              {STATUS_LABEL[status]}
            </div>
          </div>

          {/* Error state */}
          {status === 'error' && (
            <div className="text-xs font-mono text-red-400 bg-red-900/20 border border-red-700/30
                            rounded px-3 py-2">
              {errMsg}
            </div>
          )}

          {/* No-file hint */}
          {status === 'idle' && !soundcheckInfo.available && (
            <div className="text-[10px] font-mono text-slate-400 bg-venue-surface border
                            border-venue-border rounded px-3 py-2 leading-relaxed">
              No audio file loaded. Place a FLAC file at{' '}
              <code className="text-cyan-400">backend/audio/soundcheck.flac</code>{' '}
              and restart the backend.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const STATUS_LABEL = {
  idle:    '— INITIALIZING —',
  loading: 'BUFFERING…',
  ready:   'READY',
  playing: '● LIVE',
  paused:  '⏸ PAUSED',
  error:   '✖ ERROR',
}

const STATUS_COLOR = {
  idle:    '#7070a8',
  loading: '#7070a8',
  ready:   '#7070a8',
  playing: '#00ff88',
  paused:  '#ffb300',
  error:   '#ff3d00',
}
