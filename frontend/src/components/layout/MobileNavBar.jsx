import useStore from '../../store/useStore'

const TABS = [
  { id: 'library',  label: 'Library',  icon: '◫' },
  { id: 'venue',    label: 'Venue',    icon: '⌂' },
  { id: 'channels', label: 'Channels', icon: '≡' },
  { id: 'results',  label: 'Results',  icon: '◎' },
]

export default function MobileNavBar({ tab, setTab }) {
  const validationResult = useStore(s => s.validationResult)
  const channels         = useStore(s => s.channels)

  const errorCount = validationResult
    ? validationResult.channel_results.flatMap(ch => ch.issues).filter(i => i.severity === 'error').length
      + validationResult.global_issues.filter(i => i.severity === 'error').length
    : 0

  const warnCount = validationResult
    ? validationResult.channel_results.flatMap(ch => ch.issues).filter(i => i.severity === 'warning').length
      + validationResult.global_issues.filter(i => i.severity === 'warning').length
    : 0

  const channelCount = channels.filter(ch => ch.amp || ch.speakers.length > 0).length

  function badge(tabId) {
    if (tabId === 'results') {
      if (errorCount > 0) return { label: errorCount, color: '#ff3d00' }
      if (warnCount  > 0) return { label: warnCount,  color: '#ffb300' }
      if (validationResult?.is_valid) return { label: '✓', color: '#00ff88' }
    }
    if (tabId === 'channels' && channelCount > 0) {
      return { label: channelCount, color: '#00e5ff' }
    }
    return null
  }

  return (
    <nav
      role="tablist"
      aria-label="Main navigation"
      className="flex-shrink-0 flex border-t"
      style={{
        background:   '#0b0b18',
        borderColor:  '#3c3c68',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {TABS.map(t => {
        const active = tab === t.id
        const b      = badge(t.id)
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            aria-label={t.label}
            onClick={() => setTab(t.id)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5
                       transition-colors duration-150 relative"
            style={{
              color:      active ? '#00e5ff' : '#7070a8',
              background: active ? '#00e5ff08' : 'transparent',
              minHeight:  '56px',
            }}
          >
            {/* Active indicator bar */}
            {active && (
              <div
                className="absolute top-0 left-2 right-2 h-0.5 rounded-b"
                style={{ background: '#00e5ff' }}
              />
            )}

            {/* Icon + badge */}
            <div className="relative">
              <span className="text-base leading-none">{t.icon}</span>
              {b && (
                <span
                  className="absolute -top-1.5 -right-2.5 text-[8px] font-mono font-bold
                             rounded-full px-1 min-w-[14px] text-center leading-4"
                  style={{ background: b.color + '22', color: b.color, border: `1px solid ${b.color}66` }}
                >
                  {b.label}
                </span>
              )}
            </div>

            <span className="text-[9px] font-mono tracking-wide">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
