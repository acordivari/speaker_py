from __future__ import annotations

from pydantic import BaseModel, Field

from app.schemas.validation import ChannelConfig


# ── Request ──────────────────────────────────────────────────────────────────

class CoverageChannel(ChannelConfig):
    """
    A validation channel plus the venue position it occupies. ``position_key``
    matches the keys in the venue geometry (e.g. ``MAIN_L``, ``SUB_C``). The
    extra field lets the coverage engine place each source spatially; channels
    on non-audience positions (monitors) are ignored.
    """
    position_key: str = Field(..., description="Venue position, e.g. 'MAIN_L'")


class CoverageRequest(BaseModel):
    channels: list[CoverageChannel] = Field(..., min_length=1, max_length=16)
    cell_size: float = Field(
        default=10.0, ge=4.0, le=40.0,
        description="Grid cell size in SVG px. Smaller = finer (and heavier).",
    )


# ── Response ─────────────────────────────────────────────────────────────────

class CoverageGrid(BaseModel):
    """
    SPL samples on a regular grid spanning the SVG viewbox (0 0 800 560). Values
    are row-major; ``None`` marks cells outside any audience area. Cell ``i`` sits
    at SVG ``x = (i % cols + 0.5) * cell_size``, ``y = (i // cols + 0.5) * cell_size``.
    """
    cols: int
    rows: int
    cell_size: float
    values: list[float | None]
    min_spl_db: float | None = None
    max_spl_db: float | None = None


class CoverageStats(BaseModel):
    foh_spl_db: float | None = None        # dB at the FOH mix position
    front_row_spl_db: float | None = None  # dB at the GA front rail
    back_wall_spl_db: float | None = None  # dB at the back of the GA floor
    uniformity_db: float | None = None     # max−min across audience (lower = more even)
    active_source_count: int = 0           # radiating cabinets included


class CoverageResponse(BaseModel):
    grid: CoverageGrid
    stats: CoverageStats
    summary: str
