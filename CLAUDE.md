# Sound Design Lab — Claude Code Reference

Educational tool for live sound engineers. Users drag speaker and amplifier
components onto a virtual Mission Ballroom (Denver, CO) stage and get
real-time compatibility feedback (impedance, power ratios, wiring).

---

## Stack

| Layer     | Technology |
|-----------|-----------|
| Backend   | FastAPI + SQLAlchemy 2 + SQLite + Pydantic v2 + pytest |
| Frontend  | React 18 + Vite + Tailwind CSS + dnd-kit + Zustand |
| Deploy    | Backend → Render · Frontend → Netlify |

---

## Running locally

### Backend

```bash
cd backend
.venv/bin/python run.py
```

Starts FastAPI with auto-reload at `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm run dev
```

Starts Vite dev server at `http://localhost:3000` (falls back to 3001 if
busy). Proxies `/api` and `/audio` to `http://localhost:8000`.

---

## Python environment — important

**`.python-version` (3.11) is for Render only.** The local machine has
`python3.9` as its highest available interpreter.

### Always rebuild the venv from scratch like this — nothing else

```bash
cd backend
rm -rf .venv
python3.9 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt
```

**Never** install packages individually or ad-hoc. Always use
`requirements.txt` as the single source of truth. If a new dependency is
needed, add it to `requirements.txt` first, then rebuild.

### Why `eval_type_backport` is in requirements.txt

Pydantic v2 schemas use `int | None` union syntax (Python 3.10+). Python
3.9 cannot evaluate this at runtime. `eval_type_backport` teaches Pydantic
how to handle it. The package is a no-op on Python 3.11 (Render), so it
is safe to keep in the shared requirements file.

---

## Tests

### Backend

```bash
cd backend
.venv/bin/pytest tests/ -v
```

83 tests covering compatibility rules, API endpoints, and seed data.

### Frontend

```bash
cd frontend
npm test          # single pass
npm run test:watch  # interactive watch mode
```

61 tests across 6 files covering layout exclusivity, drag interaction
modes, drop routing, drop slot behavior, venue position rendering, and
demo tour mobile/desktop gating.

---

## Frontend conventions

### Drag-and-drop

- **Desktop**: dnd-kit with `PointerSensor` (6px activation distance) and
  `pointerWithin` collision detection. `pointerWithin` uses the actual
  cursor position — not the ghost card's center — so drops land exactly
  where the user points.
- **Mobile**: tap-to-assign (no drag). Tapping a component in the library
  selects it; tapping a slot assigns it.
- **Never use `closestCenter`** for this layout — the AMP and SPEAKER slots
  are close together and the ghost's center offset causes the wrong slot to
  register.

### Layout switching (desktop vs mobile)

The desktop and mobile layouts are **conditionally rendered** via the
`useIsMobile()` hook — not CSS-hidden simultaneously. This is critical:
both layouts render `ComponentPalette` with the same dnd-kit draggable IDs.
If both are mounted at once, the hidden layout's registrations overwrite the
visible ones, producing a zero-rect that places the drag ghost hundreds of
pixels above the cursor.

```jsx
{!isMobile && <div className="desktop layout">...</div>}
{isMobile  && <div className="mobile layout">...</div>}
```

Do not revert to `hidden md:flex` / `flex md:hidden` CSS toggling.

### SVG animations

CSS `transform` on SVG child elements scales from the SVG viewport origin
`(0, 0)` by default, not the element's own center. Always include:

```css
transform-box: fill-box;
transform-origin: center;
```

on any animated SVG element. Without this, scaled circles jump across the
diagram and intercept pointer events in other panels.

### UI text and color

- Use explicit color tokens for text (`text-slate-400`, `#7070a8`) — not
  opacity modifiers stacked on dim base colors. Compounded opacity makes
  helper text unreadably faint.
- Labels that logically precede a content block belong in normal document
  flow (flex row), not `position: absolute` overlays.

### Static / educational components

Inline all static data directly in the component file (as the GlossaryModal
does). No backend coupling needed for display-only reference content.

---

## Cross-device compatibility

### The interactive tour is desktop-only (auto-start)

The demo tour (`DemoTour`, `DemoSpotlight`, `DemoPanel`) highlights elements via
`data-tour` attributes that only exist in the desktop layout. It must **not**
auto-start on mobile. The initialiser in App.jsx gates auto-start behind
`window.innerWidth >= 768`.

Users can still manually trigger the tour on mobile via the TOUR chip. After
tour close on mobile, `setMobileTab('venue')` is called so users see a
meaningful state (the populated venue map) rather than an empty library panel.

### iOS Safari portal touch events

React portals rendered into `document.body` with multiple sibling
`position: fixed` children can cause touch event routing bugs on iOS Safari —
the wrong element receives the touch even when z-index stacking should prevent
it. The fix: render all portal content into **a single fixed container element**
appended to `document.body`. The container (not individual children) owns the
`pointer-events: auto` and `z-index`. Visual overlay children can then be
`pointer-events: none`. DemoTour implements this pattern.

### New features with full-screen overlays

Any new modal, overlay, or portal that:
- Renders via `createPortal`
- Has `position: fixed` sibling elements within the portal
- Needs to intercept touch events on mobile

...must follow the single-container pattern from DemoTour, NOT the
multiple-sibling fixed-element pattern.

### Never test pointer/touch behaviour with CSS media queries

jsdom does not process CSS media queries (`md:flex`, `hidden md:block` etc.).
Layout exclusivity between desktop and mobile must be enforced via
conditional rendering (`{!isMobile && ...}` / `{isMobile && ...}`), never
via Tailwind responsive prefixes alone.

---

## Deployment

| Service  | Config file                  | Notes |
|----------|------------------------------|-------|
| Render   | `backend/render.yaml`        | Python 3.11, auto-deploy on push to `main` |
| Netlify  | `frontend/netlify.toml`      | auto-deploy on push to `main` |

Environment variables to set:
- Netlify: `VITE_API_URL` → Render service URL
- Render: `ALLOWED_ORIGINS` → Netlify site URL

The soundcheck audio file (`backend/audio/soundcheck.flac`, ~33 MB) is
committed to the repo — within GitHub's 100 MB limit, no persistent disk
or Git LFS needed.
