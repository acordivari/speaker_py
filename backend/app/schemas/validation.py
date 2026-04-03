from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import IssueSeverity, IssueCode, WiringMode
from app.schemas.component import ComponentSummary


class SpeakerPlacement(BaseModel):
    """One speaker model used on a channel, possibly with multiple cabinets."""
    component_id: int
    count: int = Field(default=1, ge=1, le=32)


class ChannelConfig(BaseModel):
    """
    One amplifier output channel driving one or more speaker cabinets.

    If amplifier_id is None and all speakers are ACTIVE, the channel is valid.
    If amplifier_id is None but speakers are PASSIVE, validation will flag an error.
    """
    label: str = Field(default="Channel", description="Human-readable label, e.g. 'Main L'")
    amplifier_id: int | None = None
    speakers: list[SpeakerPlacement] = Field(default_factory=list)
    wiring: WiringMode = WiringMode.PARALLEL
    bridged: bool = False


class ValidationRequest(BaseModel):
    channels: list[ChannelConfig] = Field(..., min_length=1)


# ── Response types ──────────────────────────────────────────────────────────

class CompatibilityIssue(BaseModel):
    severity: IssueSeverity
    code: IssueCode
    message: str
    educational_explanation: str
    recommendation: str


class ChannelResult(BaseModel):
    label: str
    amplifier: ComponentSummary | None = None
    speakers: list[ComponentSummary] = []
    wiring: WiringMode
    bridged: bool

    # Calculated metrics
    total_speaker_impedance_ohms: float | None = None
    total_speaker_rms_watts: float | None = None
    amp_output_watts: float | None = None          # per channel at the load impedance
    power_ratio: float | None = None               # amp_output / speaker_rms
    is_valid: bool = True
    issues: list[CompatibilityIssue] = []


class SystemMetrics(BaseModel):
    total_channels: int
    total_speaker_rms_watts: float
    total_amp_output_watts: float
    estimated_max_spl_db: float | None = None


class ValidationResponse(BaseModel):
    is_valid: bool
    channel_results: list[ChannelResult]
    system_metrics: SystemMetrics
    global_issues: list[CompatibilityIssue] = []
    summary: str
