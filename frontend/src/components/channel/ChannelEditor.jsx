import useStore, { VENUE_CHANNELS } from '../../store/useStore'
import DroppableSlot from './DroppableSlot'

export default function ChannelEditor() {
  const channels          = useStore(s => s.channels)
  const selectedChannelId = useStore(s => s.selectedChannelId)
  const selectChannel     = useStore(s => s.selectChannel)
  const setWiring         = useStore(s => s.setWiring)
  const setBridged        = useStore(s => s.setBridged)
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
      <div className="flex overflow-x-auto border-b border-venue-border flex-shrink-0 scrollbar-none">
        {channels.map(ch => {
          const isActive  = ch.id === selectedChannelId
          const populated = ch.amp || ch.speakers.length > 0
          return (
            <button
              key={ch.id}
              onClick={() => selectChannel(ch.id)}
              className="flex-shrink-0 px-3 py-2 text-[9px] font-mono tracking-wider
                         border-b-2 transition-all whitespace-nowrap"
              style={{
                borderBottomColor: isActive ? '#00e5ff' : 'transparent',
                color: isActive
                  ? '#00e5ff'
                  : populated
                    ? '#6060a0'
                    : '#7070a8',
                background: isActive ? '#00e5ff0a' : 'transparent',
              }}
            >
              {ch.shortLabel}
              {populated && <span className="ml-1 opacity-60">●</span>}
            </button>
          )
        })}
      </div>

      {/* Editor body */}
      <div className="flex flex-1 overflow-hidden gap-0 min-h-0">
        {/* Left: channel metadata */}
        <div className="w-48 flex-shrink-0 p-3 border-r border-venue-border flex flex-col gap-2">
          <div>
            <div className="text-[9px] font-mono text-venue-muted uppercase tracking-widest">
              {channel.label}
            </div>
            <div className="text-[8px] font-mono text-slate-400 mt-0.5 leading-relaxed">
              {chanDef?.description}
            </div>
          </div>

          {/* Wiring mode */}
          <div>
            <div className="text-[9px] font-mono text-venue-muted mb-1">WIRING</div>
            <div className="flex gap-1">
              {['parallel', 'series'].map(w => (
                <button
                  key={w}
                  onClick={() => setWiring(channel.id, w)}
                  className="flex-1 text-[9px] font-mono py-1 rounded border transition-colors"
                  style={{
                    borderColor: channel.wiring === w ? '#00e5ff' : '#3c3c68',
                    color:       channel.wiring === w ? '#00e5ff' : '#7070a0',
                    background:  channel.wiring === w ? '#00e5ff0d' : 'transparent',
                  }}
                >
                  {w === 'parallel' ? '∥ PARALLEL' : '— SERIES'}
                </button>
              ))}
            </div>
          </div>

          {/* Bridged toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBridged(channel.id, !channel.bridged)}
              className="w-7 h-4 rounded-full border transition-all relative flex-shrink-0"
              style={{
                borderColor: channel.bridged ? '#ffb300' : '#7070a8',
                background:  channel.bridged ? '#ffb30033' : '#161626',
              }}
            >
              <div
                className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                style={{
                  left:       channel.bridged ? 'calc(100% - 14px)' : '2px',
                  background: channel.bridged ? '#ffb300' : '#7070a8',
                }}
              />
            </button>
            <span className="text-[9px] font-mono" style={{ color: channel.bridged ? '#ffb300' : '#7070a0' }}>
              BRIDGED
            </span>
          </div>

          {/* Clear button */}
          {(channel.amp || channel.speakers.length > 0) && (
            <button
              onClick={() => clearChannel(channel.id)}
              className="text-[9px] font-mono py-1 rounded border border-venue-border
                         text-venue-muted hover:border-brand-red hover:text-brand-red
                         transition-colors mt-auto"
            >
              CLEAR CHANNEL
            </button>
          )}
        </div>

        {/* Right: slots */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {/* Amp slot */}
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

          {/* Speaker slots */}
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

          {/* Empty speaker drop zone — always shown */}
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
