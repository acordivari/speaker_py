import useStore from '../../store/useStore'

const TABS = [
  { id: 'library',  label: 'LIBRARY', icon: '◫' },
  { id: 'venue',    label: 'MAP',     icon: '⌂' },
  { id: 'channels', label: 'ASSIGN',  icon: '⊕' },
  { id: 'results',  label: 'CHECK',   icon: '◎' },
  { id: 'ref',      label: 'GUIDE',   icon: '⌁' },
]

export default function MobileNavBar({ tab, setTab }) {
  const validationResult     = useStore(s => s.validationResult)
  const channels             = useStore(s => s.channels)
  const tapSelectedComponent = useStore(s => s.tapSelectedComponent)

  const isValid = validationResult?.is_valid ?? false

  const errorCount = validationResult
    ? validationResult.channel_results.flatMap(ch => ch.issues).filter(i => i.severity === 'error').length
      + validationResult.global_issues.filter(i => i.severity === 'error').length
    : 0

  const warnCount = validationResult
    ? validationResult.channel_results.flatMap(ch => ch.issues).filter(i => i.severity === 'warning').length
      + validationResult.global_issues.filter(i => i.severity === 'warning').length
    : 0

  const channelCount = channels.filter(ch => ch.amp || ch.speakers.length > 0).length

  // Key changes when badge state changes, forcing re-mount and replaying the pop animation
  const badgeKey = validationResult ? `${errorCount}-${warnCount}-${isValid}` : 'none'

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
        background:    '#0b0b18',
        borderColor:   '#3c3c68',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        overflow:      'visible',
      }}
    >
      {TABS.map(t => {
        const active               = tab === t.id
        const b                    = badge(t.id)
        const isAssignHighlighted  = t.id === 'channels' && !!tapSelectedComponent && !active

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
              color:      active ? '#00e5ff' : isAssignHighlighted ? '#ff8c00' : '#7070a8',
              background: active ? '#00e5ff08' : 'transparent',
              animation:  isAssignHighlighted ? 'nav-tab-pulse 1s ease-in-out infinite' : undefined,
              minHeight:  '56px',
            }}
          >
            {/* "See results" callout — floats above CHECK tab when valid and not active */}
            {t.id === 'results' && !active && isValid && (
              <div
                className="absolute bottom-full left-1/2 whitespace-nowrap text-[8px]
                           font-mono px-1.5 py-0.5 rounded pointer-events-none"
                style={{
                  transform:    'translateX(-50%)',
                  marginBottom: '5px',
                  color:        '#00ff88',
                  background:   '#00ff8814',
                  border:       '1px solid #00ff8866',
                }}
                aria-hidden="true"
              >
                see results ↑
              </div>
            )}

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
                  key={badgeKey}
                  className="absolute -top-1.5 -right-2.5 text-[8px] font-mono font-bold
                             rounded-full px-1 min-w-[14px] text-center leading-4"
                  style={{
                    background: b.color + '22',
                    color:      b.color,
                    border:     `1px solid ${b.color}66`,
                    animation:  'badge-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  }}
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
