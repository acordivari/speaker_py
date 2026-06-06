# Sound Design Lab

An interactive educational tool for live sound engineers. Design a professional PA system for **Mission Ballroom** (Denver, CO) by assigning real-world speaker and amplifier components to venue positions, then get real-time compatibility feedback covering impedance, power matching, and wiring safety.

---

## What it does

Sound Design Lab simulates the decisions a systems engineer makes when specifying a venue rig:

- **Browse** a curated library of professional components from Funktion-One, L-Acoustics, d&b audiotechnik, Danley Sound Labs, Meyer Sound, QSC, and Lab.gruppen
- **Assign** amplifiers and speakers to eight channel positions on a Mission Ballroom floor plan
- **Validate** configurations instantly against electrical compatibility rules
- **See** a real-time SPL **coverage heatmap** predicting how loud every part of the audience will be
- **Learn** from per-issue explanations that describe the physics behind each warning or error
- **Hear** what a fault actually *sounds* like — **audition** clipping, limiting, dropouts and more, A/B against clean audio
- **Practice** with **guided missions** that grade your rig live against real-world objectives and award medals
- **Play** an optional soundcheck audio file streamed from the backend, with oscilloscope + spectrum visualizers
- **Switch** between dark and light themes

The three interactive learning streams follow a **See it → Hear it → Do it** arc: the coverage heatmap, the audible fault auditioning, and the guided missions respectively.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI 0.115 + Uvicorn |
| Database | SQLite + SQLAlchemy 2 ORM |
| Validation | Schemas via Pydantic v2 |
| Frontend | React 18 + Vite 5 |
| State | Zustand |
| Drag and drop | dnd-kit |
| Styling | Tailwind CSS (CSS-variable theming, dark/light) |
| Audio | Web Audio API (coverage faults + soundcheck visualizers) |
| Tests (backend) | pytest + pytest-asyncio |
| Tests (frontend) | Vitest + React Testing Library |
| Deploy: backend | Render (Python 3.11) |
| Deploy: frontend | Netlify |

---

## Running locally

### Prerequisites

- **Python 3.9** (the local interpreter — see [Python environment note](#python-environment) below)
- **Node.js 20+** and npm

### 1. Backend

```bash
cd backend
rm -rf .venv
python3.9 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt
.venv/bin/python run.py
```

The API starts at **http://127.0.0.1:8000** with auto-reload enabled. On first boot it creates `sound_design.db` and seeds it with manufacturer and component data from real-world datasheets.

Interactive API docs are available at **http://127.0.0.1:8000/docs**.

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts at **http://localhost:3000**. All `/api` and `/audio` requests are proxied to the backend at port 8000 — no CORS configuration needed for local development.

### Enabling soundcheck audio

The soundcheck feature streams a FLAC file through the backend. To enable it:

1. Place a file named `soundcheck.flac` in `backend/audio/`
2. Restart the backend

The RUN SOUNDCHECK button (desktop header) and ◉ icon (mobile header) will activate automatically when the file is detected. Without it the button remains visible but inactive.

### Remote testing over Tailscale

To test the dev server from another device on your tailnet, set your machine's
Tailscale MagicDNS hostname in a local env file. `vite.config.js` reads it and,
when present, binds the dev server to all interfaces and whitelists the host in
Vite's `allowedHosts` (Vite otherwise rejects unknown `Host` headers with
*"Blocked request. This host is not allowed."*).

```bash
cp frontend/.env.example frontend/.env
# then edit frontend/.env:
#   TAILSCALE_HOST=your-machine.tailXXXX.ts.net
```

Restart `npm run dev` (Vite config changes are not hot-reloaded), keep the
backend running on `:8000`, then browse from any tailnet device to
**`http://your-machine.tailXXXX.ts.net:3000`**. The `/api` and `/audio` proxy
forwards to the backend server-side, so requests stay same-origin — no CORS or
backend changes required.

> `frontend/.env` is **gitignored** (never committed). `frontend/.env.example`
> is the committed template. Without `TAILSCALE_HOST` set, the dev server stays
> localhost-only.

---

## Python environment

**`.python-version` (3.11) is for Render only.** The local machine uses `python3.9`.

Always rebuild the venv from scratch using the commands above — never install packages individually. `requirements.txt` is the single source of truth.

`eval_type_backport` is listed as a dependency because Pydantic v2 uses `int | None` union syntax (Python 3.10+) that Python 3.9 cannot evaluate at runtime. The package teaches Python 3.9 how to handle it and is a no-op on 3.11.

---

## Backend architecture

```
backend/
├── app/
│   ├── main.py            # FastAPI app, middleware, router registration
│   ├── database.py        # SQLAlchemy engine + session factory
│   ├── models/
│   │   ├── component.py   # Component ORM model
│   │   ├── manufacturer.py
│   │   └── enums.py       # ComponentType, WiringMode, IssueSeverity, IssueCode, …
│   ├── schemas/
│   │   ├── component.py   # Pydantic request/response shapes
│   │   ├── validation.py  # ValidationRequest, ChannelResult, CompatibilityIssue
│   │   └── coverage.py    # CoverageRequest, CoverageGrid, CoverageStats
│   ├── api/
│   │   ├── components.py      # GET  /api/v1/components/
│   │   ├── manufacturers.py   # GET  /api/v1/manufacturers/
│   │   ├── validation.py      # POST /api/v1/validate/
│   │   ├── coverage.py        # POST /api/v1/coverage/
│   │   └── soundcheck.py      # GET  /api/v1/soundcheck/info
│   ├── services/
│   │   ├── compatibility.py   # Validation engine (physics + rule checks)
│   │   ├── acoustics.py       # Pure SPL physics: inverse-square + dispersion
│   │   ├── venue_geometry.py  # Mission Ballroom positions, scale, audience areas
│   │   ├── coverage.py        # Coverage engine (config → SPL grid, reuses compatibility)
│   │   └── education.py       # Per-issue explanations and recommendations
│   └── data/
│       └── seed.py            # Real-world component specs seeded at startup
├── audio/                 # Soundcheck FLAC served as static files
├── tests/
│   ├── test_compatibility.py  # Impedance math, power rules, wiring
│   ├── test_acoustics.py      # Inverse-square, dispersion, summation, coverage endpoint
│   ├── test_api.py            # HTTP-level endpoint tests
│   └── test_models.py         # ORM model tests
├── requirements.txt
└── run.py                 # Uvicorn entry point
```

### API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/manufacturers/` | All manufacturers with metadata |
| `GET` | `/api/v1/components/` | All components (filterable by type, manufacturer) |
| `POST` | `/api/v1/validate/` | Validate a full multi-channel configuration |
| `POST` | `/api/v1/coverage/` | Predict the SPL coverage grid + stats for a positioned rig |
| `GET` | `/api/v1/soundcheck/info` | Whether a soundcheck audio file is available |
| `GET` | `/audio/soundcheck.flac` | Stream the soundcheck FLAC (Range requests supported) |
| `GET` | `/` | Health check |

### Validation engine

`app/services/compatibility.py` is the core of the backend. It receives a `ValidationRequest` — a list of channel configs, each pairing an amplifier with one or more speaker cabinets — and returns per-channel metrics and a flat list of `CompatibilityIssue` objects.

**Physics modelled:**

- **Parallel impedance:** `1/Z = Σ(1/Zᵢ)` — adding speakers in parallel lowers the load seen by the amp
- **Series impedance:** `Z = ΣZᵢ` — adding speakers in series raises the load
- **Bridged mode:** doubles amplifier output voltage; minimum load impedance doubles to maintain safe operation
- **Power at load:** `P = V²/Z` — output watts track the actual impedance presented

**Rule categories and their severities:**

| Code prefix | What is checked | Typical severity |
|---|---|---|
| `PASSIVE_NEEDS_AMP` | Passive speaker with no amplifier assigned | error |
| `ACTIVE_CONNECTED_TO_AMP` | Active (self-powered) speaker connected to an external amp | error |
| `IMPEDANCE_BELOW_AMP_MINIMUM` | Load drops below the amp's minimum rated impedance | error |
| `AMP_SEVERELY_OVERPOWERED` | Amp output exceeds 4× speaker RMS rating | error |
| `AMP_OVERPOWERED` | Amp output is 2–4× speaker RMS | warning |
| `AMP_UNDERPOWERED` | Amp output is below 50% of speaker RMS | warning |
| `CONNECTOR_MISMATCH` | Signal-level connector used at speaker level | error |
| `CROSS_MANUFACTURER_DSP` | Speakers from a proprietary DSP ecosystem paired with a foreign amp | warning |
| `NO_SPEAKERS_ON_CHANNEL` | Amplifier assigned but no speakers | info |

Each issue ships with `educational_explanation` and `recommendation` fields written by `app/services/education.py` — plain-English explanations of the underlying physics designed for students and intermediate engineers.

### Coverage / SPL prediction engine

`POST /api/v1/coverage/` predicts how loud each part of the audience will be,
powering the frontend heatmap. It is built backend-first as pure, testable
physics:

- **`acoustics.py`** — the deterministic physics core:
  - **Inverse-square law:** `SPL(d) = sensitivity₁ₘ + 10·log₁₀(P) − 20·log₁₀(d)` (−6 dB per doubling of distance)
  - **Off-axis dispersion:** the rated coverage angle is the −6 dB beamwidth; level rolls off quadratically off-axis
  - **Incoherent power summation:** uncorrelated sources add as `10·log₁₀(Σ 10^(SPLᵢ/10))` (+3 dB per doubling) — the conventional, conservative choice for broadband coverage
- **`venue_geometry.py`** — the canonical room: speaker positions (in the same `0 0 800 560` SVG space the frontend draws), per-position aim vectors, audience polygons (GA floor + balconies), a tunable `METERS_PER_PX` scale, and a distance floor. Monitors are excluded (they fire upstage).
- **`coverage.py`** — bridges a rig to the field: it **reuses the compatibility engine's** `channel_amp_output_watts` so the map reflects each channel's *actual delivered power*, turns every cabinet into a directional source, and returns a row-major SPL grid plus summary stats (FOH / front-row / back-wall dB and a percentile-based front-to-back uniformity).

The response grid is expressed in the frontend's SVG coordinate space, so cells render with no coordinate translation.

### Running backend tests

```bash
cd backend
.venv/bin/pytest tests/ -v
```

107 tests across four files. The test suite runs against an in-memory SQLite database seeded fresh for each session — no persistent state between runs. `test_acoustics.py` additionally exercises the coverage physics with analytic checks (e.g. doubling distance loses 6 dB; two equal sources sum to +3 dB).

---

## Frontend architecture

```
frontend/src/
├── App.jsx                    # Root: DnD context, layout switching, tour + scenario state
├── store/
│   └── useStore.js            # Zustand store — channels, validation, coverage, scenarios
├── components/
│   ├── Header.jsx             # Action bar + mobile chips (F1, TOUR, MISSIONS, theme toggle)
│   ├── palette/
│   │   ├── ComponentPalette.jsx   # Filterable component library
│   │   └── DraggableCard.jsx      # Drag (desktop) / tap-to-select (mobile)
│   ├── venue/
│   │   ├── VenueLayout.jsx        # SVG floor plan of Mission Ballroom
│   │   ├── VenuePosition.jsx      # Individual position ring with status colour
│   │   ├── CoverageHeatmap.jsx    # SPL grid painted into the venue SVG
│   │   ├── CoverageLegend.jsx     # Color scale + FOH/back-wall/uniformity readouts
│   │   └── coverageScale.js       # Pure SPL→color mapping (fixed dB domain)
│   ├── channel/
│   │   ├── ChannelEditor.jsx      # Amp + speaker slot editor for selected channel
│   │   └── DroppableSlot.jsx      # Accepts drops (desktop) / tap-assign (mobile)
│   ├── validation/
│   │   ├── ValidationPanel.jsx    # Per-channel and global issues display
│   │   ├── IssueCard.jsx          # Expandable issue + inline "Hear it" control
│   │   └── AuditionControl.jsx    # Play/stop + live Clean↔Faulted toggle
│   ├── scenarios/
│   │   ├── ScenarioBar.jsx        # Active mission bar with live-graded objectives
│   │   └── ScenarioPicker.jsx     # Mission chooser modal
│   ├── layout/
│   │   ├── MobileNavBar.jsx       # 5-tab bottom nav (LIBRARY/MAP/ASSIGN/CHECK/GUIDE)
│   │   └── MobileOnboarding.jsx   # Getting-started card shown before first config
│   ├── demo/
│   │   ├── demoSteps.js           # 8-step tour content definitions
│   │   ├── DemoTour.jsx           # Portal controller — spotlight + panel + animation
│   │   ├── DemoSpotlight.jsx      # 4-rect overlay with cyan cutout around target
│   │   ├── DemoPanel.jsx          # Step panel with navigation (Back / Next / Skip)
│   │   └── DemoDragAnimation.jsx  # Looping ghost card animation for drag demo step
│   ├── soundcheck/
│   │   └── SoundcheckModal.jsx
│   └── glossary/
│       └── GlossaryModal.jsx      # Inline electrical engineering reference
├── audio/                     # Fault auditioning (Web Audio, client-side)
│   ├── faultProfiles.js       # Curated IssueCode → audible effect map
│   ├── auditionEngine.js      # Synth loop generator + switchable DSP graph
│   └── useAudition.js         # useSyncExternalStore hook over the engine
├── scenarios/                 # Guided missions (pure logic + content)
│   ├── criteria.js            # Criterion factories (noErrors, backWallAtLeast, …)
│   ├── scenarios.js           # Declarative mission definitions
│   └── scoreScenario.js       # Rubric scoring + medal tiers
├── hooks/
│   └── useIsMobile.js         # MediaQueryList at 768 px breakpoint
└── services/
    └── api.js                 # Axios client — proxied to /api/v1
```

### State management

The entire application state lives in a single Zustand store (`store/useStore.js`). Key slices:

- **`channels`** — array of 8 channel objects, each holding `amp`, `speakers[]`, `wiring`, `bridged`, and `limiterMode`
- **`manufacturers` / `components`** — fetched from the API once on mount
- **`validationResult`** — the last response from `POST /api/v1/validate/`, updated after every channel change (debounced 600 ms)
- **`coverageResult` / `showCoverage`** — the last `POST /api/v1/coverage/` response (computed alongside validation) and the heatmap toggle
- **`activeScenarioId` / `completedScenarios`** — the running mission and earned medals (persisted to `localStorage`)
- **`selectedChannelId`** — which position the Channel Editor is showing
- **`tapSelectedComponent`** — the component held in "tap-to-assign" mode on mobile

### Drag and drop

Desktop uses dnd-kit with `PointerSensor` (6 px activation distance) and `pointerWithin` collision detection. `pointerWithin` uses the actual cursor position rather than the drag ghost's geometric center — this matters because `closestCenter` (the naive default) caused the wrong slot to register when dragging to closely-spaced AMP and SPEAKER slots.

Mobile uses tap-to-assign: tapping a `DraggableCard` sets `tapSelectedComponent` in the store; tapping a `DroppableSlot` reads that value, validates the type, and assigns if compatible.

### Layout switching

Desktop (`md` breakpoint and above) and mobile layouts are **conditionally rendered** — not CSS-hidden simultaneously:

```jsx
{!isMobile && <DesktopThreeColumn />}
{isMobile  && <MobileSinglePanel  />}
```

This is critical. If both layouts mount together, every `DraggableCard` registers two `useDraggable` hooks with the same ID. dnd-kit uses the last-registered element's bounding rect — if that element is hidden (zero rect), the drag ghost appears hundreds of pixels above the cursor.

### Interactive tour

The `DemoTour` component renders via a React portal directly into `document.body`, placing it above all other z-index layers. It reads `data-tour` attributes from key DOM elements to calculate spotlight positions at runtime:

| Attribute | Element |
|---|---|
| `data-tour="palette"` | Component library aside |
| `data-tour="venue"` | Venue map wrapper |
| `data-tour="channel-editor"` | Channel editor wrapper |
| `data-tour="validation"` | Validation panel aside |
| `data-tour="header-reset"` | RESET button |
| `data-tour="header-f1"` | F1 PRESET button |

The tour's final step calls `loadPreset(FUNKTION_ONE_PRESET)` from the Zustand store, loading a complete Funktion-One configuration across all eight channels before closing.

### SPL coverage heatmap ("See it")

As the rig changes, the app fetches `POST /api/v1/coverage/` (debounced, alongside validation) and paints the returned SPL grid over the venue floor with `CoverageHeatmap`. Because the backend grid uses the same `0 0 800 560` SVG space as `VenueLayout`, cells drop straight in with no coordinate translation. A fixed-domain blue→red color scale (`coverageScale.js`) keeps colors comparable across rigs, and `CoverageLegend` shows the scale plus live FOH / front-row / back-wall dB and a front-to-back uniformity figure. Toggle it with the **SPL Map** chip in the venue panel header.

### Audible fault auditioning ("Hear it")

Every validation issue with an honest audible consequence gets a **▶ Hear it** control in its card (`AuditionControl`, surfaced in the collapsed row). The engine (`auditionEngine.js`) is a Web Audio singleton: it generates one short, transient-rich loop (pink-noise bed + kick/snare hits, so clipping and limiting are obvious) and plays it through a switchable DSP graph. A live **Clean ↔ Faulted** toggle flips the processing in real time over the same audio. `faultProfiles.js` maps each `IssueCode` to an honest effect (`clip`, `stress`, `breakup`, `weak`, `dropout`, `pump`, `mute`); codes with no genuine sound (connector adapters, lost factory DSP, info/nominal notices) intentionally get no button. The engine degrades gracefully where Web Audio is unavailable.

### Guided missions ("Do it")

The **◎ MISSIONS** chip opens `ScenarioPicker`, a set of progressive briefs that each teach one concept (impedance → stereo mains & level → whole-room coverage → driver protection). Starting one drops a `ScenarioBar` below the header that grades the live rig **as you build** — objectives tick green in real time with no submit button. Scoring is entirely client-side over the data already in the store:

- **`criteria.js`** — pure criterion factories (`noErrors`, `backWallAtLeast`, `fohAtLeast`, `uniformityAtMost`, `minActiveSources`, `positionsFilled`, `everyChannelProtected`)
- **`scenarios.js`** — declarative mission content (thresholds calibrated against the real engine)
- **`scoreScenario.js`** — completion + medal tiers: all required objectives → complete; stretch goals earn **Bronze → Silver → Gold**

Best medal per mission persists to `localStorage`. Missions reuse both the validation results *and* the coverage stats, tying the three learning streams together.

### Theming (dark / light)

A ☀ / ☾ header toggle sets `document.documentElement.dataset.theme` and persists to `localStorage` (`sdl_theme`), applied before React mounts to avoid a flash. All structural colors are CSS custom properties (`:root` dark defaults, `[data-theme="light"]` overrides) referenced by Tailwind venue tokens, so the whole UI — including the heatmap legend and mission bar — adapts at runtime.

### Running frontend tests

```bash
cd frontend
npm test          # single pass
npm run test:watch  # interactive watch mode
```

132 tests across 17 files:

| File | What it covers |
|---|---|
| `App.layout.test.jsx` | Layout exclusivity (desktop/mobile never both mounted), mobile header direct actions, onboarding card visibility |
| `dragDropRouting.test.jsx` | `handleDragEnd` routing — speaker→speaker, amp→amp, cross-type rejections |
| `DraggableCard.test.jsx` | Drag listeners on desktop, tap-to-select button on mobile |
| `DroppableSlot.test.jsx` | Instructional text, tap-assign acceptance, incompatible-type rejection |
| `VenuePosition.test.jsx` | `.pos-ring` animation class rules, ring colour states |
| `MobileNavBar.test.jsx` | Tab labels, active state, ASSIGN highlight when tap-selected, badge counts |
| `MobileOnboarding.test.jsx` | Heading, step references, onTour/onPreset callbacks |
| `DemoTour.test.jsx` | Tour gating and single-fixed-container portal pattern |
| `ChannelEditor.test.jsx` | Limiter controls, mutual exclusivity, status text |
| `ThemeToggle.test.jsx` | Dark/light toggle mechanism and aria state |
| `Coverage.test.jsx` | SPL→color scale + heatmap cell rendering / null masking / toggle |
| `faultProfiles.test.js` | Curated `IssueCode` → effect map; non-audible codes return null |
| `AuditionControl.test.jsx` | Hear-it gating, Clean/Faulted toggle, engine wiring (hook mocked) |
| `IssueCard.test.jsx` | Audition button surfaced in the collapsed row, not nested in the toggle |
| `scenarioCriteria.test.js` | Each criterion's pass/fail against crafted live contexts |
| `scoreScenario.test.js` | Bronze/Silver/Gold medal tiers and `bestMedal` |
| `ScenarioBar.test.jsx` | Live grading display, completion persistence, exit |

---

## Using the app

### Desktop workflow

1. **Browse the Component Library** in the left panel. Filter by type (Line Array, Subwoofer, etc.) or manufacturer, or search by model name.
2. **Click a position ring** on the venue map to select it. The Channel Editor opens in the bottom panel.
3. **Drag a component** from the library and drop it onto the AMP or SPEAKER slot in the Channel Editor.
4. **Watch the validation panel** on the right. Issues appear immediately as you build the configuration.
5. **Adjust wiring** (parallel / series) and **bridged mode** in the Channel Editor to resolve impedance issues.
6. **Read the coverage heatmap** on the venue map — it recolors live by predicted SPL, with FOH / back-wall / uniformity readouts below. Toggle it with the **SPL Map** chip.
7. **Hear a fault** — expand any audible issue and press **▶ Hear it**, then flip Clean ↔ Faulted to A/B the consequence.
8. **Take a mission** — open **◎ MISSIONS** for a graded challenge whose objectives tick green as you build.

### Mobile workflow

1. **GETTING STARTED card** — on first load the Library tab shows a quick-start guide. Tap **F1 PRESET** to load a working reference configuration instantly, or tap **TOUR** for a guided walkthrough.
2. **LIBRARY tab** — tap a component to select it. The ASSIGN tab in the bottom nav turns orange and pulses to indicate you have a component ready to place.
3. **ASSIGN tab** — tap the AMP or SPEAKER slot to place the selected component. A banner at the top confirms what is held and offers a cancel option.
4. **CHECK tab** — review validation results. The tab badge shows an error count (red), warning count (amber), or a green ✓ when everything is valid.
5. **GUIDE tab** — inline electrical engineering reference covering impedance, power, connectors, and wiring modes.

### Shortcuts

| Action | Desktop | Mobile |
|---|---|---|
| Load Funktion-One reference config | **F1 PRESET** button | **F1** chip in header |
| Start guided tour | **▶ TOUR** button | **TOUR** chip in header |
| Open guided missions | **◎ MISSIONS** button | **◎** chip in header |
| Toggle the SPL coverage map | **SPL Map** chip (venue header) | **SPL Map** chip |
| Open audio glossary | **⌁ REFERENCE** button | **GUIDE** tab |
| Run soundcheck audio | **◉ RUN SOUNDCHECK** | **◉** icon in header |
| Switch dark / light theme | **☀ / ☾** toggle | **☀ / ☾** icon |
| Clear all channels | **RESET** button | **↺** icon in header |

### Reading validation results

Each issue in the Check panel has three fields:

- **Message** — what is wrong and where (e.g. "Main Left: amplifier output 1,800 W exceeds 4× speaker RMS 400 W")
- **Explanation** — the physics behind it
- **Recommendation** — a concrete fix

Severity levels:

- **error (red)** — hardware damage or system failure risk. Must be resolved before use.
- **warning (amber)** — performance degradation likely. Should be reviewed.
- **info (cyan)** — best-practice suggestion. Safe to proceed.

Issues whose fault has an audible consequence also carry a **▶ Hear it** control: press it to play a synthesized loop through that fault, and toggle **Clean ↔ Faulted** to compare against unaffected audio in real time.

---

## Deployment

| Service | Config | Auto-deploy |
|---|---|---|
| Render (backend) | `render.yaml` | On push to `main` |
| Netlify (frontend) | `frontend/netlify.toml` | On push to `main` |

**Environment variables to set:**

| Where | Variable | Value |
|---|---|---|
| Netlify | `VITE_API_URL` | Your Render service URL (e.g. `https://sound-design-api.onrender.com`) |
| Render | `ALLOWED_ORIGINS` | Your Netlify site URL (e.g. `https://your-site.netlify.app`) |

The soundcheck audio file (`backend/audio/soundcheck.flac`, ~33 MB) is committed directly to the repository — within GitHub's 100 MB file limit, so no Git LFS or persistent disk is required on Render.
