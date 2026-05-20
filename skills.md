# Sound Design Lab — Engineering Skills & Patterns

Cross-device compatibility guidelines and patterns to prevent regressions.

---

## Mobile / Desktop layout rules

### Conditional rendering, never CSS toggling

Desktop and mobile layouts are **conditionally rendered** via `useIsMobile()`,
not CSS-hidden simultaneously:

```jsx
{!isMobile && <DesktopLayout />}
{isMobile  && <MobileLayout  />}
```

**Why**: If both layouts mount together, every `DraggableCard` registers two
`useDraggable` hooks with the same ID. dnd-kit uses the last-registered
element's bounding rect — if that element is hidden (zero rect), the drag ghost
appears at the viewport origin.

### jsdom and CSS media queries

jsdom does not evaluate CSS media queries. Tests must use `useIsMobile` mock
to control layout:

```js
vi.mock('../hooks/useIsMobile', () => ({ useIsMobile: vi.fn() }))
import { useIsMobile } from '../hooks/useIsMobile'
useIsMobile.mockReturnValue(true)   // mobile
useIsMobile.mockReturnValue(false)  // desktop
```

Never write a test that asserts layout visibility via Tailwind responsive
classes (`hidden`, `md:flex`) — those are invisible to jsdom.

---

## Portal / overlay patterns

### Single-container portal for iOS Safari

When rendering a complex overlay (multiple visual layers + interactive panel)
via `createPortal`, use a **single fixed container** rather than multiple
sibling fixed elements:

```jsx
// WRONG — multiple fixed siblings cause iOS touch routing bugs
createPortal(
  <>
    <OverlayDiv style={{ position: 'fixed', zIndex: 999 }} />
    <Panel      style={{ position: 'fixed', zIndex: 1001 }} />
  </>,
  document.body
)

// CORRECT — single container owns pointer-events and z-index
const container = document.createElement('div')
container.style.cssText = 'position:fixed;inset:0;z-index:999;pointer-events:auto'
document.body.appendChild(container)

createPortal(
  <>
    <OverlayDiv style={{ pointerEvents: 'none' }} />  {/* decorative only */}
    <Panel      style={{ zIndex: 2 }} />              {/* relative to container */}
  </>,
  container
)
```

**Why**: iOS Safari does not always respect z-index for touch event dispatch
on sibling `position: fixed` elements in portals. A single container is a
single compositing layer — touch events route to the highest-z-index element
within it correctly.

### Cleanup

Always remove the container in the `useEffect` cleanup:

```jsx
useEffect(() => {
  document.body.appendChild(container)
  return () => document.body.removeChild(container)
}, [])
```

---

## Tour / demo features

### Desktop-only auto-start

Any interactive tour that highlights desktop-specific UI elements must not
auto-start on mobile. Gate the initial state:

```js
useState(() => window.innerWidth >= 768 && !localStorage.getItem('tour_seen_key'))
```

Mobile users have platform-specific onboarding (e.g., `MobileOnboarding`).

### Post-close navigation on mobile

When a tour or walkthrough closes on mobile, always navigate to a meaningful
tab so the user isn't left on an empty screen:

```jsx
if (isMobile) setMobileTab('venue')   // or whichever tab makes sense
```

### Never trigger Zustand store updates from a useEffect that fires on step transitions

**Bug**: calling a store action (e.g. `loadPreset`) from a `useEffect` whose
dependency is a step index causes a mid-render cascade on the last step:

```
setStepIndex(lastStep)
  → React renders DemoTour
  → useEffect fires: loadPreset() → Zustand set()
  → App (subscribed to channels) re-renders → new onClose closure
  → DemoTour re-renders again mid-cycle
  → portal content enters intermediate state → blank screen on mobile
```

**Fix**: move the store action into the click handler (e.g. `handleNext`) so
React 18 batches it with the close call in a single render:

```jsx
// WRONG — causes mid-render cascade
useEffect(() => {
  if (step.isLast) loadPreset(FUNKTION_ONE_PRESET)
}, [stepIndex])

// CORRECT — batched in the event handler, one render
const handleNext = useCallback(() => {
  if (stepIndex < DEMO_STEPS.length - 1) {
    setStepIndex(i => i + 1)
  } else {
    loadPreset(FUNKTION_ONE_PRESET)  // batched with onClose
    onClose()
  }
}, [stepIndex, onClose, loadPreset])
```

**Rule**: store actions that should fire "when the user completes a step" belong
in the event handler for that completion action — not in a `useEffect` that
watches for the step number to change.

---

## Touch target sizing

iOS HIG minimum: 44×44pt. Google Material: 48×48dp.
All primary action buttons must have `min-height: 44px; min-width: 44px` on
touch devices. Use the `.touch-target-lg` utility from `globals.css`.

`touch-action: manipulation` removes the 300ms tap delay on iOS Safari for
non-scrolling interactive elements (buttons, links):

```jsx
<button style={{ touchAction: 'manipulation' }}>...</button>
```

---

## Testing philosophy

### Test mobile AND desktop variants

Every new feature that has conditional rendering between mobile and desktop
must have at least one test for each layout. Use the `useIsMobile` mock:

```js
describe('on mobile', () => {
  beforeEach(() => useIsMobile.mockReturnValue(true))
  it('...', () => { ... })
})
describe('on desktop', () => {
  beforeEach(() => useIsMobile.mockReturnValue(false))
  it('...', () => { ... })
})
```

### Portals are queryable

React Testing Library's `screen` queries search the entire `document`. Portal
content rendered into `document.body` IS findable with `screen.getBy...` — no
special handling required.

### localStorage in tests

```js
vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)   // first visit
vi.spyOn(Storage.prototype, 'setItem')                          // capture calls
```

Reset in `afterEach` with `vi.restoreAllMocks()` or `vi.clearAllMocks()`.

### window.innerWidth in tests

jsdom defaults to `innerWidth = 1024`. When testing the `demoActive` auto-start
gate (which reads `window.innerWidth` directly in the `useState` initialiser),
set the value explicitly before render:

```js
Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true })  // mobile
Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true }) // desktop
```

Restore in `afterEach` to avoid cross-test pollution.
