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

79 tests across 10 files covering layout exclusivity, drag interaction
modes, drop routing, drop slot behavior, venue position rendering,
demo tour mobile/desktop gating, limiter controls, and theme toggle.

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

- Never use compounded opacity on dim base colors — it makes helper text
  unreadably faint in both themes.
- Labels that logically precede a content block belong in normal document
  flow (flex row), not `position: absolute` overlays.
- **All structural colors must use CSS custom properties** — see the
  Theming section below. Never use raw hex values for backgrounds, borders,
  or text that should adapt to the light/dark toggle.

### Static / educational components

Inline all static data directly in the component file (as the GlossaryModal
does). No backend coupling needed for display-only reference content.

---

## Theming — dark / light toggle

The app supports a dark/light theme toggle (☀/☾ in the header). The toggle
sets `document.documentElement.dataset.theme` to `"light"` or `"dark"` and
persists the choice to `localStorage` under the key `sdl_theme`. `main.jsx`
reads this key and applies it before React mounts to prevent a flash.

### How the system works

1. **CSS custom properties** in `globals.css` define two token sets:
   - `:root` — dark defaults
   - `[data-theme="light"]` — light overrides

2. **Tailwind venue colors** in `tailwind.config.js` reference those vars
   using the space-separated RGB channel format required for opacity support:
   ```js
   venue: {
     panel: 'rgb(var(--venue-panel-rgb) / <alpha-value>)',
   }
   ```
   This means all Tailwind classes (`bg-venue-panel`, `border-venue-border`,
   `.panel`, etc.) automatically pick up the active theme at runtime.

3. **Global light-mode overrides** in `globals.css` adapt Tailwind's static
   text utilities that don't know about the theme:
   ```css
   [data-theme="light"] .text-white,
   [data-theme="light"] .text-slate-200 { color: var(--color-text); }
   [data-theme="light"] .text-slate-400  { color: var(--color-muted); }
   ```

4. **Inline styles** must use `var(--color-*)` references — never raw hex.

### CSS token reference

| Token | Dark | Light | Use for |
|-------|------|-------|---------|
| `--color-bg` | `#0b0b18` | `#f4f6ff` | Page background |
| `--color-panel` | `#161626` | `#ffffff` | Panel/card backgrounds |
| `--color-surface` | `#1e1e36` | `#eef0fb` | Elevated surfaces, inputs |
| `--color-surface-alt` | `#0f0f20` | `#f8f9ff` | Modals, overlays |
| `--color-border` | `#3c3c68` | `#c0c7e8` | Standard borders |
| `--color-border-dim` | `#28284e` | `#d0d5ed` | Subtle / secondary borders |
| `--color-border-inner` | `#1e1e36` | `#e0e4f4` | Inner dividers |
| `--color-muted` | `#7070a8` | `#5558a0` | Muted / secondary text |
| `--color-text` | `#e2e8f0` | `#1a1c38` | Primary body text |
| `--color-text-2` | `#c0c0d8` | `#2a2d50` | Secondary text |
| `--color-text-3` | `#9090b8` | `#3a3d6a` | Tertiary text |
| `--color-text-dim` | `#4a4a6a` | `#6870b0` | Dim / placeholder text |

Brand accent colors (`#00e5ff`, `#00ff88`, `#ffb300`, `#ff3d00`, `#ff8c00`)
do not change between themes — they are always used at full saturation.

### Rules for every new component or style change

1. **No raw hex for structural colors.** If you find yourself typing `#161626`,
   `#3c3c68`, `#7070a8`, or any of the dark-era palette values as an inline
   style, stop. Use the CSS var from the table above instead.

2. **No `text-white` or `text-slate-*` for body text.** Use `var(--color-text)`,
   `var(--color-text-2)`, or `var(--color-muted)` in an inline style, or add a
   CSS-var-backed Tailwind token. The global overrides in `globals.css` catch
   existing usages but are a fallback, not a license to add new ones.

3. **Tailwind classes backed by venue tokens are safe.** `bg-venue-panel`,
   `border-venue-border`, `text-venue-muted`, `.panel` all adapt automatically.

4. **Brand accent colors with alpha suffixes are safe.** `#00e5ff44`,
   `#ff8c0011` etc. are intentional semi-transparent tints on accent colors —
   these stay the same in both themes.

5. **Restart the dev server after changing `tailwind.config.js`.** Vite watches
   source files but Tailwind's config is processed at startup; changes to
   venue token definitions require a server restart to regenerate the CSS.

6. **Write a test for any new theme-sensitive UI.** `ThemeToggle.test.jsx`
   covers the toggle mechanism. Component-level tests should verify that
   aria attributes and text content are correct regardless of theme state.

### How we got here (context)

The original codebase was built dark-only with hardcoded hex values
everywhere (`#161626`, `#3c3c68`, `#7070a8`, etc.) in inline `style` props,
and Tailwind's static text utilities (`text-white`, `text-slate-200`) used
throughout. When the light theme was added, the CSS custom properties
cascaded correctly for Tailwind venue classes, but all the hardcoded inline
styles and static text utilities were invisible to the cascade — they just
kept their fixed dark values. The fix required converting every structural
color to a `var()` reference and adding global CSS overrides for the Tailwind
utilities. The dev server also needed a full restart because `tailwind.config.js`
changes aren't hot-reloaded. Total scope: 10+ components, ~80 color
references, one full dev server cycle.

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
