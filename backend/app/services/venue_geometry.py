"""
Venue Geometry — Mission Ballroom (Denver, CO)
==============================================
Canonical spatial description of the room, shared by the acoustics engine.

Coordinate space
----------------
We deliberately reuse the **frontend SVG viewBox** ``0 0 800 560`` as the
canonical map so the coverage grid returned by the backend aligns 1:1 with the
``VenueLayout`` rendering — no coordinate translation on the client.

* +x → stage-right wall to stage-left wall (screen left → right)
* +y → north/stage end (top) → south entrance (bottom)

Note that in this top-down schematic the **stage is at the bottom** (high y)
and the audience areas sit above it (lower y), wrapping into balconies.

Real-world scale
----------------
``METERS_PER_PX`` converts SVG pixels to metres for the inverse-square law.
It is a single tunable constant — adjust it to match the real room without
touching any physics. At 0.1 m/px the GA floor (250 px deep) reads as a
~25 m room, which lands typical concert rigs in the 95–115 dB SPL range.

Aim vectors
-----------
Each contributing position aims at a **target point** in the audience; the aim
direction is ``normalize(target - source)``. Targets are tunable and encode
real design intent (mains cover centre-to-back, front fills cover the stage
lip, delays cover the under-balcony shadow). Monitors are intentionally
excluded — they fire upstage at the performers, not the audience.
"""

from __future__ import annotations

from dataclasses import dataclass

# ── Canonical coordinate space (matches frontend SVG viewBox) ────────────────
VIEWBOX_WIDTH = 800.0
VIEWBOX_HEIGHT = 560.0

# ── Real-world scale ─────────────────────────────────────────────────────────
# Tune this single constant against the real Mission Ballroom dimensions. At
# 0.14 m/px the 250 px GA floor reads as a ~35 m room, which lands typical
# touring rigs in a believable 95–120 dB SPL range.
METERS_PER_PX = 0.14

# Minimum distance (metres) used in the inverse-square law. A listener is never
# pressed against the grille; 2 m keeps near-field cells physically sane.
MIN_DISTANCE_M = 2.0


# ── Speaker positions (SVG px) — mirror of frontend venueConfig.POSITION_COORDS
POSITION_COORDS: dict[str, tuple[float, float]] = {
    "MAIN_L":  (105.0, 215.0),
    "MAIN_R":  (695.0, 215.0),
    "SUB_C":   (400.0, 375.0),
    "FF_C":    (400.0, 415.0),
    "DELAY_L": (72.0,  260.0),
    "DELAY_R": (728.0, 260.0),
    "MON_L":   (290.0, 460.0),
    "MON_R":   (510.0, 460.0),
}

# Positions that radiate into the audience. Monitors fire upstage and are
# excluded from the audience coverage map.
AUDIENCE_POSITIONS: frozenset[str] = frozenset(
    {"MAIN_L", "MAIN_R", "SUB_C", "FF_C", "DELAY_L", "DELAY_R"}
)

# Aim targets (SVG px). Aim direction = normalize(target - position).
AIM_TARGETS: dict[str, tuple[float, float]] = {
    "MAIN_L":  (430.0, 150.0),   # cover centre-to-far-right of the floor
    "MAIN_R":  (370.0, 150.0),   # cover centre-to-far-left of the floor
    "SUB_C":   (400.0, 150.0),   # subs fire straight up the room (near-omni)
    "FF_C":    (400.0, 300.0),   # front fills cover the near-stage GA
    "DELAY_L": (60.0,  90.0),    # cover the left / back-left under-balcony
    "DELAY_R": (740.0, 90.0),    # cover the right / back-right under-balcony
}

# Default horizontal coverage (deg) when a component omits coverage data.
DEFAULT_COVERAGE_DEG = 90.0


# ── Audience areas (axis-aligned rectangles in SVG px) ───────────────────────
@dataclass(frozen=True)
class Rect:
    x0: float
    y0: float
    x1: float
    y1: float

    def contains(self, x: float, y: float) -> bool:
        return self.x0 <= x <= self.x1 and self.y0 <= y <= self.y1


# Mirrors the rects drawn in VenueLayout.jsx (GA floor + wrap balconies).
AUDIENCE_RECTS: tuple[Rect, ...] = (
    Rect(120.0, 135.0, 680.0, 385.0),   # General Admission floor
    Rect(90.0,  50.0,  710.0, 135.0),   # Back balcony
    Rect(30.0,  135.0, 120.0, 365.0),   # Left balcony
    Rect(680.0, 135.0, 770.0, 365.0),   # Right balcony
)


def in_audience(x: float, y: float) -> bool:
    """True if an SVG point falls within any audience area."""
    return any(r.contains(x, y) for r in AUDIENCE_RECTS)


# ── Reference listening points (SVG px) for summary statistics ───────────────
# Used to report the dB a fan would hear at meaningful spots in the room.
REFERENCE_POINTS: dict[str, tuple[float, float]] = {
    "foh":       (400.0, 295.0),   # front-of-house mix position
    "front_row": (400.0, 378.0),   # GA front rail, just off the stage lip
    "back_wall": (400.0, 140.0),   # back of GA floor, under the balcony lip
}
