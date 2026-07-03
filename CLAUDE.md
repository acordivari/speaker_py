# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Sound Design Lab: educational web app for live sound engineers. Users assign real speaker/amp
components to 8 channel positions on a Mission Ballroom (Denver) floor plan and get real-time
compatibility validation, an SPL coverage heatmap, audible fault auditioning, and graded missions.
Not a DAW plugin — it's FastAPI + SQLAlchemy 2 + SQLite + Pydantic v2 (backend) and
React 18 + Vite + Tailwind + Zustand + dnd-kit (frontend). Deploys: Render (`render.yaml`) + Netlify.

## Commands

```bash
# Backend (http://127.0.0.1:8000, docs at /docs; seeds SQLite on first boot)
cd backend && .venv/bin/python run.py
.venv/bin/pytest tests/ -v            # backend tests (in-memory DB, fresh seed per session)

# Frontend (http://localhost:3000; proxies /api and /audio to :8000 — no CORS locally)
cd frontend && npm run dev
npm test                              # vitest single pass
npm run test:watch
```

### Python environment — critical
`.python-version` (3.11) is **Render-only**; local machine tops out at `python3.9`. Rebuild the
venv only this way — never install packages ad-hoc; `requirements.txt` is the single source of truth:
```bash
cd backend && rm -rf .venv && python3.9 -m venv .venv
.venv/bin/pip install --upgrade pip && .venv/bin/pip install -r requirements.txt
```
`eval_type_backport` stays in requirements: Pydantic v2 schemas use `int | None` syntax that
Python 3.9 can't evaluate; the package is a no-op on 3.11.

## Backend architecture

Layered: `app/api/` (routers) → `app/schemas/` (Pydantic) → `app/services/` (all logic) →
`app/models/` (ORM) with `app/data/seed.py` seeding real-world specs at startup.

- `services/compatibility.py` — the validation engine. Models parallel/series/bridged impedance and
  power-at-load; emits `CompatibilityIssue`s keyed by `IssueCode` (in `models/enums.py`) with
  severity error/warning/info. `services/education.py` writes each issue's plain-English
  `educational_explanation` and `recommendation`.
- `services/acoustics.py` — pure SPL physics (inverse-square, off-axis dispersion, incoherent
  summation), tested with analytic checks (doubling distance = −6 dB, etc.).
- `services/coverage.py` — bridges rig → SPL grid; **reuses** compatibility's
  `channel_amp_output_watts` so the heatmap reflects actual delivered power.
- `services/venue_geometry.py` — canonical room: positions, aim vectors, audience polygons in the
  **same `0 0 800 560` SVG space the frontend draws**, so coverage grids render with no coordinate
  translation. Keep backend geometry and `VenueLayout.jsx` in sync.

## Frontend architecture

Single Zustand store (`src/store/useStore.js`) holds everything: `channels[8]`, fetched
components/manufacturers, `validationResult` + `coverageResult` (both refetched, debounced 600 ms,
after every channel change), scenario/medal state (localStorage), and mobile `tapSelectedComponent`.
Three learning streams reuse that data: coverage heatmap (`components/venue/`), Web Audio fault
auditioning (`src/audio/` — `faultProfiles.js` maps IssueCode → honest audible effect),
and client-side graded missions (`src/scenarios/` — pure criteria/scoring, no backend).

### Non-negotiable frontend rules (hard-won; see skills.md for full rationale + code)
- **dnd-kit**: `pointerWithin` collision detection only — `closestCenter` picks the wrong slot for
  the adjacent AMP/SPEAKER targets. Mobile has no drag; it uses tap-to-assign via the store.
- **Layouts**: desktop/mobile are conditionally rendered via `useIsMobile()` — never CSS-hidden
  simultaneously (`hidden md:flex`). Dual-mounting duplicates dnd-kit draggable IDs and breaks the
  drag ghost. Same rule in tests: jsdom ignores media queries; mock `useIsMobile`.
- **Portals/overlays**: one fixed container appended to `document.body` owns pointer-events and
  z-index (multiple fixed siblings break iOS Safari touch routing). Follow DemoTour's pattern.
- **Store actions on step/tour completion** go in the click handler, never a `useEffect` watching a
  step index (mid-render Zustand cascade → blank screen on mobile).
- **Theming**: `data-theme` on `<html>` + CSS custom properties in `globals.css` back the Tailwind
  `venue-*` tokens. No raw hex or `text-white`/`text-slate-*` for structural/body colors — use
  `var(--color-*)`. Brand accents (`#00e5ff`, `#00ff88`, `#ffb300`, `#ff3d00`, `#ff8c00`) are
  theme-invariant. Restart the dev server after editing `tailwind.config.js` (not hot-reloaded).
- **Animated SVG children** need `transform-box: fill-box; transform-origin: center`.
- The demo tour auto-starts desktop-only (`data-tour` targets exist only in the desktop layout).
- New theme- or layout-sensitive UI needs tests for both mobile and desktop variants.
- **UI text**: never compound opacity on dim base colors (helper text goes unreadable in both
  themes); labels that precede a content block go in normal flex flow, not `position: absolute`.
- **Static/educational content** (glossary-style reference data): inline the data in the component
  file like `GlossaryModal` does — no backend coupling for display-only content.
- Theme choice persists to localStorage key `sdl_theme`; `main.jsx` applies it pre-mount to avoid
  a flash. Token values (dark/light pairs) are defined in `globals.css`.

## Deployment

Render (`backend/render.yaml`, Python 3.11) + Netlify (`frontend/netlify.toml`), both auto-deploy
on push to `main`. Required env vars: Netlify `VITE_API_URL` → Render service URL; Render
`ALLOWED_ORIGINS` → Netlify site URL. `backend/audio/soundcheck.flac` (~33 MB) is committed
deliberately — under GitHub's 100 MB limit, so no persistent disk or Git LFS.

## Other docs
- `README.md` — full endpoint table, Tailscale remote-dev setup, user workflows.
- `skills.md` — detailed cross-device patterns (portals, touch targets, jsdom/localStorage test recipes).
