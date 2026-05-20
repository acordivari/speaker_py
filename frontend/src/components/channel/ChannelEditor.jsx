import useStore, { VENUE_CHANNELS } from '../../store/useStore'
import DroppableSlot from './DroppableSlot'

export default function ChannelEditor() {
  const channels          = useStore(s => s.channels)
  const selectedChannelId = useStore(s => s.selectedChannelId)
  const selectChannel     = useStore(s => s.selectChannel)
  const setWiring         = useStore(s => s.setWiring)
  const setBridged        = useStore(s => s.setBridged)
  const setLimiterMode    = useStore(s => s.setLimiterMode)
  const removeAmp         = useStore(s => s.removeAmp)
  const removeSpeaker     = useStore(s => s.removeSpeaker)
  const setSpeakerCount   = useStore(s => s.setSpeakerCount)
  const clearChannel      = useStore(s => s.clearChannel)

  const channel = channels.find(ch => ch.id === selectedChannelId)
  if (!channel) return null

  const chanDef = VENUE_CHANNELS.find(d => d.id === selectedChannelId)

  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      {/* Tab bar — all channels */}
      <div
        className="flex overflow-x-auto border-b border-venue-border flex-shrink-0 scrollbar-none"
        role="tablist"
        aria-label="Channel selector"
      >
        {channels.map(ch => {
          const isActive  = ch.id === selectedChannelId
          const populated = ch.amp || ch.speakers.length > 0
          return (
            <button
              key={ch.id}
              role="tab"
              aria-selected={isActive}
              aria-label={ch.label}
              onClick={() => selectChannel(ch.id)}
              className="flex-shrink-0 px-3 border-b-2 transition-all whitespace-nowrap
                         flex items-center justify-center"
              style={{
                borderBottomColor: isActive ? '#00e5ff' : 'transparent',
                color: isActive ? '#00e5ff' : populated ? 'var(--color-muted)' : 'var(--color-muted)',
                background:  isActive ? '#00e5ff0a' : 'transparent',
                fontSize:    '9px',
                fontFamily:  'inherit',
                letterSpacing: '0.05em',
                minHeight:   '40px',    // WCAG 2.5.8 — touch-friendly tab height
              }}
            >
              {ch.shortLabel}
              {populated && <span className="ml-1 opacity-60" aria-hidden="true">●</span>}
            </button>
          )
        })}
      </div>

      {/* Editor body — side-by-side on md+, stacked on mobile */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">

        {/* Channel metadata + controls */}
        <div
          className="flex-shrink-0 p-3 border-b md:border-b-0 md:border-r border-venue-border
                     flex flex-row md:flex-col gap-3 md:gap-2 md:w-52 overflow-x-auto scrollbar-none"
        >
          {/* Channel name */}
          <div className="flex-shrink-0 md:flex-shrink">
            <div className="text-[9px] font-mono text-venue-muted uppercase tracking-widest">
              {channel.label}
            </div>
          </div>

          {/* Wiring mode */}
          <div className="flex-shrink-0">
            <div className="text-[9px] font-mono text-venue-muted mb-1">WIRING</div>
            <div className="flex gap-1">
              {['parallel', 'series'].map(w => (
                <button
                  key={w}
                  onClick={() => setWiring(channel.id, w)}
                  aria-pressed={channel.wiring === w}
                  className="flex-1 text-[9px] font-mono py-1.5 rounded border transition-colors
                             whitespace-nowrap touch-target-lg"
                  style={{
                    borderColor: channel.wiring === w ? '#00e5ff' : 'var(--color-border)',
                    color:       channel.wiring === w ? '#00e5ff' : 'var(--color-muted)',
                    background:  channel.wiring === w ? '#00e5ff0d' : 'transparent',
                    minHeight:   '36px',
                    padding:     '6px 8px',
                  }}
                >
                  {w === 'parallel' ? '∥' : '—'} {w.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Bridged toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setBridged(channel.id, !channel.bridged)}
              role="switch"
              aria-checked={channel.bridged}
              aria-label="Bridged mono mode"
              className="w-9 h-5 rounded-full border transition-all relative flex-shrink-0"
              style={{
                borderColor: channel.bridged ? '#ffb300' : 'var(--color-muted)',
                background:  channel.bridged ? '#ffb30033' : 'var(--color-surface)',
              }}
            >
              <div
                className="absolute top-[2px] w-4 h-4 rounded-full transition-all"
                style={{
                  left:       channel.bridged ? 'calc(100% - 18px)' : '2px',
                  background: channel.bridged ? '#ffb300' : 'var(--color-muted)',
                }}
              />
            </button>
            <span className="text-[9px] font-mono" style={{ color: channel.bridged ? '#ffb300' : 'var(--color-muted)' }}>
              BRIDGED
            </span>
          </div>

          {/* Limiter mode */}
          <div className="flex-shrink-0">
            <div className="text-[9px] font-mono text-venue-muted mb-1.5">LIMITER</div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { value: 'none',           label: 'Off',      title: 'No limiter — speakers rely on amp headroom alone', activeColor: '#7070a8' },
                { value: 'amp_dsp',        label: 'Amp DSP',  title: 'Built-in amplifier DSP limiter (recommended)',     activeColor: '#00ff88' },
                { value: 'external_rack',  label: 'Ext Rack', title: 'External DSP rack unit between console and amp',   activeColor: '#00e5ff' },
                { value: 'console_insert', label: 'Console',  title: 'Console insert only — not sufficient for speaker protection', activeColor: '#ffb300' },
              ].map(opt => {
                const active = channel.limiterMode === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setLimiterMode(channel.id, opt.value)}
                    aria-pressed={active}
                    title={opt.title}
                    className="text-[9px] font-mono py-1 px-2 rounded border transition-colors
                               whitespace-nowrap touch-target text-center"
                    style={{
                      borderColor: active ? opt.activeColor : 'var(--color-border)',
                      color:       active ? opt.activeColor : 'var(--color-muted)',
                      background:  active ? opt.activeColor + '1a' : 'transparent',
                      minHeight:   '32px',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {channel.limiterMode === 'console_insert' && (
              <div className="text-[9px] font-mono mt-1.5 leading-tight" style={{ color: '#ffb300cc' }}>
                ⚠ monitoring only
              </div>
            )}
            {(channel.limiterMode === 'amp_dsp' || channel.limiterMode === 'external_rack') && (
              <div className="text-[9px] font-mono mt-1.5 leading-tight" style={{ color: '#00ff88cc' }}>
                ✔ hardware protection active
              </div>
            )}
          </div>

          {/* Clear button */}
          {(channel.amp || channel.speakers.length > 0) && (
            <button
              onClick={() => clearChannel(channel.id)}
              aria-label={`Clear all components from ${channel.label}`}
              className="text-[9px] font-mono py-1.5 px-2 rounded border border-venue-border
                         text-venue-muted hover:border-brand-red hover:text-brand-red
                         transition-colors md:mt-auto flex-shrink-0 touch-target"
              style={{ minHeight: '32px' }}
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Slots */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          <DroppableSlot
            channelId={channel.id}
            slotType="amp"
            label="AMP"
            occupied={!!channel.amp}
            component={channel.amp}
            componentId={channel.amp?.id}
            allowedTypes={['amplifier']}
            onRemove={() => removeAmp(channel.id)}
          />

          {channel.speakers.map((entry) => (
            <DroppableSlot
              key={entry.component.id}
              channelId={channel.id}
              slotType="speaker"
              label="SPK"
              occupied={true}
              component={entry.component}
              componentId={entry.component.id}
              count={entry.count}
              onCountChange={(c) => setSpeakerCount(channel.id, entry.component.id, c)}
              onRemove={() => removeSpeaker(channel.id, entry.component.id)}
            />
          ))}

          <DroppableSlot
            channelId={channel.id}
            slotType="speaker"
            label="SPK"
            occupied={false}
            component={null}
            allowedTypes={chanDef?.allowedSpeakerTypes}
          />
        </div>
      </div>
    </div>
  )
}
