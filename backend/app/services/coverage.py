"""
Coverage Engine
===============
Bridges a rig configuration to a predicted SPL coverage map. It resolves the
components placed at each venue position, computes the **actual delivered
power** of every channel (reusing the compatibility engine's formula), turns
each cabinet into a directional :class:`~app.services.acoustics.Source`, and
samples the resulting sound field across the audience.

Design notes
------------
* Passive cabinets share their channel's delivered amp power equally; the amp's
  output is the true electrical drive, so the map reflects the configured rig.
* Active (self-powered) cabinets use their own RMS power handling as a drive
  proxy — their internal amp is matched to the driver.
* Co-located cabinets in an array sum in the pressure domain (array gain).
* Monitors are excluded — they fire upstage, not at the audience.
"""

from __future__ import annotations

import math
from sqlalchemy.orm import Session

from app.models.component import Component
from app.schemas.coverage import (
    CoverageRequest,
    CoverageResponse,
    CoverageGrid,
    CoverageStats,
)
from app.services.acoustics import Source, compute_spl_grid, spl_at_point, unit_vector
from app.services.compatibility import channel_amp_output_watts
from app.services.venue_geometry import (
    AUDIENCE_POSITIONS,
    AIM_TARGETS,
    DEFAULT_COVERAGE_DEG,
    POSITION_COORDS,
    REFERENCE_POINTS,
)


def _build_sources(request: CoverageRequest, db: Session) -> list[Source]:
    """Resolve the configuration into positioned, directional radiating cabinets."""
    sources: list[Source] = []

    for channel in request.channels:
        pos = channel.position_key
        if pos not in AUDIENCE_POSITIONS:
            continue  # monitors / unknown positions don't cover the audience
        coords = POSITION_COORDS.get(pos)
        if coords is None:
            continue
        sx, sy = coords

        # Aim unit-vector toward this position's design target.
        target = AIM_TARGETS.get(pos)
        aim = unit_vector(target[0] - sx, target[1] - sy) if target else None
        aim_x, aim_y = (aim[0], aim[1]) if aim else (None, None)

        # Resolve and expand the cabinets on this channel.
        amp = db.get(Component, channel.amplifier_id) if channel.amplifier_id else None
        speakers: list[Component] = []
        for placement in channel.speakers:
            spk = db.get(Component, placement.component_id)
            if spk is not None:
                speakers.extend([spk] * placement.count)
        if not speakers:
            continue

        passive = [s for s in speakers if s.is_passive]
        active = [s for s in speakers if s.is_active]

        # Passive cabinets share the channel's delivered amp power.
        amp_output = channel_amp_output_watts(amp, passive, channel.wiring, channel.bridged)
        if passive and amp_output:
            per_box = amp_output / len(passive)
            for spk in passive:
                if spk.sensitivity_db_spl is None:
                    continue
                sources.append(
                    Source(
                        x=sx, y=sy,
                        sensitivity_db=spk.sensitivity_db_spl,
                        power_w=per_box,
                        coverage_deg=spk.coverage_horizontal_deg or DEFAULT_COVERAGE_DEG,
                        aim_x=aim_x, aim_y=aim_y,
                    )
                )

        # Active cabinets are self-powered; use their RMS handling as drive level.
        for spk in active:
            if spk.sensitivity_db_spl is None or not spk.power_handling_rms_watts:
                continue
            sources.append(
                Source(
                    x=sx, y=sy,
                    sensitivity_db=spk.sensitivity_db_spl,
                    power_w=spk.power_handling_rms_watts,
                    coverage_deg=spk.coverage_horizontal_deg or DEFAULT_COVERAGE_DEG,
                    aim_x=aim_x, aim_y=aim_y,
                )
            )

    return sources


def _round(value: float | None) -> float | None:
    return None if value is None else round(value, 1)


def _percentile(sorted_values: list[float], pct: float) -> float:
    """Linear-interpolated percentile of a pre-sorted list."""
    if len(sorted_values) == 1:
        return sorted_values[0]
    rank = pct / 100.0 * (len(sorted_values) - 1)
    lo = int(math.floor(rank))
    hi = int(math.ceil(rank))
    if lo == hi:
        return sorted_values[lo]
    frac = rank - lo
    return sorted_values[lo] * (1 - frac) + sorted_values[hi] * frac


def _uniformity_db(values: list[float | None]) -> float | None:
    """
    Spread of SPL across the audience as p90 − p10 (lower = more even). Using
    percentiles instead of raw max − min keeps a single near-field cell directly
    under a cabinet from dominating the figure.
    """
    audience = sorted(v for v in values if v is not None)
    if len(audience) < 2:
        return None
    return _percentile(audience, 90) - _percentile(audience, 10)


def _build_summary(stats: CoverageStats) -> str:
    if stats.active_source_count == 0:
        return (
            "No active sources placed. Assign powered speakers to venue "
            "positions to see the coverage map."
        )
    parts = [f"Predicted coverage from {stats.active_source_count} cabinet(s)."]
    if stats.foh_spl_db is not None:
        parts.append(f"FOH ≈ {stats.foh_spl_db:.0f} dB SPL.")
    if stats.front_row_spl_db is not None and stats.back_wall_spl_db is not None:
        parts.append(
            f"Front rail ≈ {stats.front_row_spl_db:.0f} dB vs back of floor "
            f"≈ {stats.back_wall_spl_db:.0f} dB."
        )
    if stats.uniformity_db is not None:
        evenness = "even" if stats.uniformity_db <= 6 else "uneven"
        parts.append(
            f"Front-to-back variation of {stats.uniformity_db:.0f} dB across the "
            f"audience ({evenness} coverage)."
        )
    return " ".join(parts)


def compute_coverage(request: CoverageRequest, db: Session) -> CoverageResponse:
    """Compute the SPL coverage grid and summary statistics for a rig."""
    sources = _build_sources(request, db)
    grid_data = compute_spl_grid(sources, request.cell_size)

    grid = CoverageGrid(
        cols=grid_data.cols,
        rows=grid_data.rows,
        cell_size=grid_data.cell_size,
        values=[_round(v) for v in grid_data.values],
        min_spl_db=_round(grid_data.min_spl),
        max_spl_db=_round(grid_data.max_spl),
    )

    stats = CoverageStats(
        foh_spl_db=_round(spl_at_point(sources, *REFERENCE_POINTS["foh"])),
        front_row_spl_db=_round(spl_at_point(sources, *REFERENCE_POINTS["front_row"])),
        back_wall_spl_db=_round(spl_at_point(sources, *REFERENCE_POINTS["back_wall"])),
        uniformity_db=_round(_uniformity_db(grid_data.values)),
        active_source_count=len(sources),
    )

    return CoverageResponse(grid=grid, stats=stats, summary=_build_summary(stats))
