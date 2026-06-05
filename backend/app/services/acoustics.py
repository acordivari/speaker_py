"""
Acoustics Core
==============
Pure, deterministic SPL-prediction physics. No database, no framework — every
function here is analytically checkable, which is why the coverage feature is
built backend-first.

Physics
-------
Inverse-square law (free field, point source)::

    SPL(d) = sensitivity_1m + 10·log10(P) − 20·log10(d)

    where  sensitivity_1m = dB SPL @ 1 W / 1 m
           P              = electrical power delivered to the driver (W)
           d              = distance from source to listener (m)

    → every doubling of distance costs 6 dB (−20·log10(2) ≈ −6.02).

Off-axis dispersion
-------------------
A speaker's rated coverage angle is its −6 dB beamwidth, so a listener at the
edge of coverage (±coverage/2 off the aim axis) hears 6 dB less than on-axis.
We model the rolloff as quadratic in the off-axis ratio::

    ratio = off_axis_angle / (coverage / 2)
    attenuation_dB = 6 · ratio²      (= 6 dB exactly at the coverage edge)

Multiple sources
----------------
Broadband program from separate cabinets is largely uncorrelated, so we sum in
the **intensity (power) domain** — the conventional simplification for coverage
prediction::

    SPL_total = 10·log10( Σ 10^(SPLᵢ / 10) )

    → two equal sources sum to +3 dB (10·log10(2) ≈ 3.01). This is deliberately
      conservative: coherent pressure summation (+6 dB/doubling) would wildly
      overestimate a stacked L + R + sub + array rig.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from app.services.venue_geometry import (
    MIN_DISTANCE_M,
    METERS_PER_PX,
    VIEWBOX_WIDTH,
    VIEWBOX_HEIGHT,
    in_audience,
)

# Off-axis attenuation is clamped so a listener fully behind a speaker is heavily
# but not infinitely attenuated (keeps pressure sums numerically sane).
MAX_OFF_AXIS_ATTEN_DB = 40.0


@dataclass(frozen=True)
class Source:
    """A single radiating cabinet positioned in SVG-pixel space."""
    x: float
    y: float
    sensitivity_db: float          # dB SPL @ 1 W / 1 m
    power_w: float                 # electrical power delivered to this cabinet
    coverage_deg: float            # horizontal −6 dB beamwidth
    aim_x: float | None = None     # aim unit-vector (None → omnidirectional)
    aim_y: float | None = None


def unit_vector(dx: float, dy: float) -> tuple[float, float] | None:
    """Normalize a vector; returns None for a zero-length vector."""
    mag = math.hypot(dx, dy)
    if mag == 0.0:
        return None
    return dx / mag, dy / mag


def spl_at_distance(sensitivity_db: float, power_w: float, distance_m: float) -> float:
    """On-axis SPL at a distance via the inverse-square law."""
    d = max(distance_m, MIN_DISTANCE_M)
    return sensitivity_db + 10.0 * math.log10(power_w) - 20.0 * math.log10(d)


def off_axis_attenuation_db(
    angle_deg: float, coverage_deg: float
) -> float:
    """
    Positive dB of attenuation for a listener ``angle_deg`` off the aim axis,
    given a ``coverage_deg`` (−6 dB) beamwidth. 0 dB on-axis, 6 dB at the edge.
    """
    if coverage_deg <= 0:
        return 0.0
    half = coverage_deg / 2.0
    ratio = angle_deg / half
    return min(6.0 * ratio * ratio, MAX_OFF_AXIS_ATTEN_DB)


def _source_contribution_db(src: Source, px_x: float, py: float) -> float | None:
    """SPL contribution (dB) of one source at an SVG point, or None if silent."""
    if src.power_w <= 0:
        return None

    dx = px_x - src.x
    dy = py - src.y
    distance_m = math.hypot(dx, dy) * METERS_PER_PX
    spl = spl_at_distance(src.sensitivity_db, src.power_w, distance_m)

    # Apply directivity when the source is aimed.
    if src.aim_x is not None and src.aim_y is not None:
        listener = unit_vector(dx, dy)
        if listener is not None:
            dot = max(-1.0, min(1.0, listener[0] * src.aim_x + listener[1] * src.aim_y))
            angle_deg = math.degrees(math.acos(dot))
            spl -= off_axis_attenuation_db(angle_deg, src.coverage_deg)

    return spl


def sum_levels(spls_db: list[float]) -> float | None:
    """Combine SPLs of uncorrelated sources in the intensity (power) domain."""
    if not spls_db:
        return None
    intensity = sum(10.0 ** (s / 10.0) for s in spls_db)
    return 10.0 * math.log10(intensity)


def spl_at_point(sources: list[Source], px_x: float, py: float) -> float | None:
    """Combined SPL (dB) from all sources at an SVG point, or None if silent."""
    contributions = [
        c
        for src in sources
        if (c := _source_contribution_db(src, px_x, py)) is not None
    ]
    return sum_levels(contributions)


@dataclass(frozen=True)
class SplGrid:
    cols: int
    rows: int
    cell_size: float                # px per cell in SVG space
    values: list[float | None]      # row-major; None = outside audience areas
    min_spl: float | None
    max_spl: float | None


def compute_spl_grid(sources: list[Source], cell_size: float = 10.0) -> SplGrid:
    """
    Sample combined SPL across the venue on a regular grid. Cells outside the
    audience areas are ``None`` so the client paints only seated areas. Cell
    centres drive the calculation; the grid spans the full SVG viewbox so the
    client can place cells with no coordinate translation.
    """
    cols = int(math.ceil(VIEWBOX_WIDTH / cell_size))
    rows = int(math.ceil(VIEWBOX_HEIGHT / cell_size))

    values: list[float | None] = []
    min_spl: float | None = None
    max_spl: float | None = None

    for row in range(rows):
        cy = (row + 0.5) * cell_size
        for col in range(cols):
            cx = (col + 0.5) * cell_size
            if not in_audience(cx, cy) or not sources:
                values.append(None)
                continue
            spl = spl_at_point(sources, cx, cy)
            values.append(spl)
            if spl is not None:
                min_spl = spl if min_spl is None else min(min_spl, spl)
                max_spl = spl if max_spl is None else max(max_spl, spl)

    return SplGrid(
        cols=cols,
        rows=rows,
        cell_size=cell_size,
        values=values,
        min_spl=min_spl,
        max_spl=max_spl,
    )
