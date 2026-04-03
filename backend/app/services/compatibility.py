from __future__ import annotations

"""
Compatibility Engine
====================
Core service that validates a multi-channel speaker/amplifier configuration.

Terminology
-----------
* Channel     – one amplifier output driving one or more speaker cabinets.
* Wiring      – PARALLEL (impedance drops) or SERIES (impedance rises).
* Bridged     – both amplifier channels combined for mono output; doubles
                voltage but doubles minimum impedance requirement as well.

Key physics
-----------
Parallel impedance:   1/Z_total = Σ(1/Zᵢ)
Series impedance:     Z_total   = ΣZᵢ
Power at a load:      P = V² / Z  (amplifier output tracks impedance)
Safe amp/speaker ratio: 0.5× – 2× RMS continuous rating (hard limit: <4×)
"""

import math
from sqlalchemy.orm import Session

from app.models.component import Component
from app.models.enums import (
    ComponentType,
    PowerType,
    ConnectorType,
    WiringMode,
    IssueSeverity,
    IssueCode,
)
from app.schemas.validation import (
    ChannelConfig,
    ValidationRequest,
    CompatibilityIssue,
    ChannelResult,
    ValidationResponse,
    SystemMetrics,
)
from app.schemas.component import ComponentSummary
from app.services.education import get_education


# ── Impedance helpers ────────────────────────────────────────────────────────

def parallel_impedance(impedances: list[float]) -> float:
    """Return combined impedance of cabinets wired in parallel."""
    if not impedances:
        raise ValueError("Cannot compute parallel impedance of an empty list.")
    return 1.0 / sum(1.0 / z for z in impedances)


def series_impedance(impedances: list[float]) -> float:
    """Return combined impedance of cabinets wired in series."""
    return sum(impedances)


def combined_impedance(impedances: list[float], wiring: WiringMode) -> float:
    if wiring == WiringMode.PARALLEL:
        return parallel_impedance(impedances)
    return series_impedance(impedances)


# ── Issue factory ────────────────────────────────────────────────────────────

def _issue(
    severity: IssueSeverity,
    code: IssueCode,
    message: str,
) -> CompatibilityIssue:
    edu = get_education(code)
    return CompatibilityIssue(
        severity=severity,
        code=code,
        message=message,
        educational_explanation=edu["explanation"],
        recommendation=edu["recommendation"],
    )


# ── Component summary helper ─────────────────────────────────────────────────

def _summary(component: Component) -> ComponentSummary:
    return ComponentSummary(
        id=component.id,
        name=component.name,
        model_number=component.model_number,
        component_type=component.component_type,
        power_type=component.power_type,
        nominal_impedance_ohms=component.nominal_impedance_ohms,
        power_handling_rms_watts=component.power_handling_rms_watts,
        manufacturer_name=(
            component.manufacturer.name if component.manufacturer else None
        ),
    )


# ── Per-channel validation ───────────────────────────────────────────────────

def _validate_channel(
    channel: ChannelConfig,
    amp: Component | None,
    speakers: list[Component],  # already expanded for count
) -> ChannelResult:
    issues: list[CompatibilityIssue] = []
    is_valid = True

    amp_summary = _summary(amp) if amp is not None else None
    speaker_summaries = [_summary(s) for s in speakers]

    # ── 1. Amplifier type check ──────────────────────────────────────────
    if amp is not None and not amp.is_amplifier:
        issues.append(
            _issue(
                IssueSeverity.ERROR,
                IssueCode.NON_AMPLIFIER_AS_AMP,
                f"'{amp.name}' is a {amp.component_type.value}, not an amplifier.",
            )
        )
        is_valid = False
        # Can't proceed with meaningful analysis; return early
        return ChannelResult(
            label=channel.label,
            amplifier=amp_summary,
            speakers=speaker_summaries,
            wiring=channel.wiring,
            bridged=channel.bridged,
            is_valid=False,
            issues=issues,
        )

    # ── 2. Empty channel ─────────────────────────────────────────────────
    if not speakers and amp is not None:
        issues.append(
            _issue(
                IssueSeverity.WARNING,
                IssueCode.NO_SPEAKERS_ON_CHANNEL,
                f"Amplifier '{amp.name}' has no speakers assigned.",
            )
        )
        return ChannelResult(
            label=channel.label,
            amplifier=amp_summary,
            speakers=[],
            wiring=channel.wiring,
            bridged=channel.bridged,
            is_valid=True,
            issues=issues,
        )

    # ── 3. Active vs passive checks ──────────────────────────────────────
    active_speakers = [s for s in speakers if s.is_active]
    passive_speakers = [s for s in speakers if s.is_passive]

    for spk in active_speakers:
        if amp is not None:
            issues.append(
                _issue(
                    IssueSeverity.ERROR,
                    IssueCode.ACTIVE_CONNECTED_TO_AMP,
                    f"'{spk.name}' is a self-powered active speaker — do not connect "
                    f"it to an external power amplifier output.",
                )
            )
            is_valid = False
        # Active speakers are otherwise fine without an amp

    for spk in passive_speakers:
        if amp is None:
            issues.append(
                _issue(
                    IssueSeverity.ERROR,
                    IssueCode.PASSIVE_NEEDS_AMP,
                    f"'{spk.name}' is a passive speaker and has no amplifier assigned.",
                )
            )
            is_valid = False

    # ── 4. Connector compatibility ───────────────────────────────────────
    if amp is not None and passive_speakers:
        amp_out = amp.output_connector
        for spk in passive_speakers:
            spk_in = spk.input_connector
            if amp_out is not None and spk_in is not None and amp_out != spk_in:
                # XLR on a speaker-level amp output is always an error
                if amp_out == ConnectorType.XLR_3PIN:
                    issues.append(
                        _issue(
                            IssueSeverity.ERROR,
                            IssueCode.SPEAKER_LEVEL_ON_LINE_LEVEL,
                            f"Amplifier '{amp.name}' uses XLR speaker outputs — "
                            f"XLR carries line-level signal, not speaker-level power. "
                            f"Use Speakon NL4.",
                        )
                    )
                    is_valid = False
                else:
                    issues.append(
                        _issue(
                            IssueSeverity.WARNING,
                            IssueCode.CONNECTOR_MISMATCH,
                            f"Amplifier '{amp.name}' output ({amp_out.value}) does not "
                            f"match '{spk.name}' input ({spk_in.value}). An adapter or "
                            f"custom cable will be required.",
                        )
                    )

    # ── 5. Impedance analysis (passive speakers only) ────────────────────
    total_impedance: float | None = None
    total_rms: float | None = None
    amp_output: float | None = None
    power_ratio: float | None = None

    if amp is not None and passive_speakers:
        impedances = [
            s.nominal_impedance_ohms
            for s in passive_speakers
            if s.nominal_impedance_ohms is not None
        ]

        if impedances:
            z = combined_impedance(impedances, channel.wiring)

            # Bridged mode doubles effective impedance requirement
            effective_min_z = (amp.min_load_impedance_ohms or 4.0)
            if channel.bridged:
                effective_min_z = effective_min_z * 2

            total_impedance = z

            if z < effective_min_z:
                issues.append(
                    _issue(
                        IssueSeverity.ERROR,
                        IssueCode.IMPEDANCE_BELOW_AMP_MINIMUM,
                        f"Total load impedance {z:.2f} Ω is below "
                        f"'{amp.name}' minimum of {effective_min_z:.0f} Ω"
                        + (" (bridged mode doubles the minimum)" if channel.bridged else "")
                        + ".",
                    )
                )
                is_valid = False

            elif z > 16.0:
                issues.append(
                    _issue(
                        IssueSeverity.WARNING,
                        IssueCode.IMPEDANCE_VERY_HIGH,
                        f"Total load impedance {z:.1f} Ω is high — the amplifier will "
                        f"deliver significantly less than its rated power.",
                    )
                )

            # Power analysis
            effective_z_for_power = z / 2 if channel.bridged else z
            amp_output = amp.output_power_at_impedance(effective_z_for_power)
            if channel.bridged and amp_output is not None:
                amp_output = amp_output * 2  # bridged roughly doubles per-channel power

            total_rms = sum(
                s.power_handling_rms_watts
                for s in passive_speakers
                if s.power_handling_rms_watts is not None
            ) or None

            if amp_output is not None and total_rms:
                power_ratio = amp_output / total_rms

                if power_ratio > 4.0:
                    issues.append(
                        _issue(
                            IssueSeverity.ERROR,
                            IssueCode.AMP_SEVERELY_OVERPOWERED,
                            f"Amplifier output {amp_output:.0f} W is {power_ratio:.1f}× the "
                            f"speakers' combined {total_rms:.0f} W RMS — severe over-powering, "
                            f"will destroy drivers.",
                        )
                    )
                    is_valid = False

                elif power_ratio > 2.0:
                    issues.append(
                        _issue(
                            IssueSeverity.WARNING,
                            IssueCode.AMP_OVERPOWERED,
                            f"Amplifier output {amp_output:.0f} W is {power_ratio:.1f}× "
                            f"speakers' combined {total_rms:.0f} W RMS — use a limiter.",
                        )
                    )

                elif power_ratio < 0.5:
                    issues.append(
                        _issue(
                            IssueSeverity.WARNING,
                            IssueCode.AMP_UNDERPOWERED,
                            f"Amplifier output {amp_output:.0f} W is only {power_ratio:.2f}× "
                            f"speakers' combined {total_rms:.0f} W RMS — clipping risk.",
                        )
                    )

    # ── 6. Cross-manufacturer DSP warning ────────────────────────────────
    if amp is not None and passive_speakers:
        amp_mfr = amp.manufacturer_id if amp.manufacturer else None
        for spk in passive_speakers:
            spk_mfr = spk.manufacturer_id if spk.manufacturer else None
            if amp_mfr and spk_mfr and amp_mfr != spk_mfr:
                issues.append(
                    _issue(
                        IssueSeverity.WARNING,
                        IssueCode.CROSS_MANUFACTURER_DSP,
                        f"'{amp.name}' (manufacturer #{amp_mfr}) is driving "
                        f"'{spk.name}' (manufacturer #{spk_mfr}) — "
                        f"cross-brand pairing loses factory DSP presets and protection curves.",
                    )
                )
                break  # one warning per channel is enough

    return ChannelResult(
        label=channel.label,
        amplifier=amp_summary,
        speakers=speaker_summaries,
        wiring=channel.wiring,
        bridged=channel.bridged,
        total_speaker_impedance_ohms=total_impedance,
        total_speaker_rms_watts=total_rms,
        amp_output_watts=amp_output,
        power_ratio=power_ratio,
        is_valid=is_valid,
        issues=issues,
    )


# ── Main validation entry point ───────────────────────────────────────────────

def validate_configuration(
    request: ValidationRequest,
    db: Session,
) -> ValidationResponse:
    """
    Validate a multi-channel speaker / amplifier configuration.

    Fetches component records from the database, expands speaker counts,
    runs per-channel and global checks, and returns a fully annotated result.
    """
    channel_results: list[ChannelResult] = []
    global_issues: list[CompatibilityIssue] = []

    for channel in request.channels:
        # Fetch amplifier
        amp: Component | None = None
        if channel.amplifier_id is not None:
            amp = db.get(Component, channel.amplifier_id)
            if amp is None:
                global_issues.append(
                    _issue(
                        IssueSeverity.ERROR,
                        IssueCode.NON_AMPLIFIER_AS_AMP,
                        f"No component found with id={channel.amplifier_id} "
                        f"(assigned as amplifier on channel '{channel.label}').",
                    )
                )
                continue

        # Fetch and expand speakers (respect count)
        speakers: list[Component] = []
        for placement in channel.speakers:
            spk = db.get(Component, placement.component_id)
            if spk is None:
                global_issues.append(
                    _issue(
                        IssueSeverity.ERROR,
                        IssueCode.PASSIVE_NEEDS_AMP,
                        f"No component found with id={placement.component_id} "
                        f"(assigned as speaker on channel '{channel.label}').",
                    )
                )
                continue
            speakers.extend([spk] * placement.count)

        result = _validate_channel(channel, amp, speakers)
        channel_results.append(result)

    # ── System-level metrics ─────────────────────────────────────────────
    total_speaker_rms = sum(
        r.total_speaker_rms_watts
        for r in channel_results
        if r.total_speaker_rms_watts is not None
    )
    total_amp_output = sum(
        r.amp_output_watts
        for r in channel_results
        if r.amp_output_watts is not None
    )

    # Rough max SPL estimate: sensitivity + 10*log10(total_rms / 1W)
    # This is a very rough heuristic — real SPL depends on coupling, distance, etc.
    estimated_max_spl: float | None = None
    spl_data_points = []
    for result in channel_results:
        for spk_summary in result.speakers:
            spk = db.get(Component, spk_summary.id)
            if (
                spk
                and spk.sensitivity_db_spl
                and spk.power_handling_rms_watts
                and spk.power_handling_rms_watts > 0
            ):
                contribution = spk.sensitivity_db_spl + 10 * math.log10(
                    spk.power_handling_rms_watts
                )
                spl_data_points.append(contribution)

    if spl_data_points:
        # Combine multiple sources (rough sum in linear pressure domain)
        linear_sum = sum(10 ** (v / 20) for v in spl_data_points)
        estimated_max_spl = round(20 * math.log10(linear_sum), 1)

    metrics = SystemMetrics(
        total_channels=len(channel_results),
        total_speaker_rms_watts=round(total_speaker_rms, 1),
        total_amp_output_watts=round(total_amp_output, 1),
        estimated_max_spl_db=estimated_max_spl,
    )

    all_valid = all(r.is_valid for r in channel_results) and not any(
        i.severity == IssueSeverity.ERROR for i in global_issues
    )

    # ── Summary message ──────────────────────────────────────────────────
    error_count = sum(
        1
        for r in channel_results
        for i in r.issues
        if i.severity == IssueSeverity.ERROR
    ) + sum(1 for i in global_issues if i.severity == IssueSeverity.ERROR)

    warning_count = sum(
        1
        for r in channel_results
        for i in r.issues
        if i.severity == IssueSeverity.WARNING
    ) + sum(1 for i in global_issues if i.severity == IssueSeverity.WARNING)

    if all_valid and warning_count == 0:
        summary = (
            f"System is fully compatible across all {len(channel_results)} channel(s). "
            f"Total amplifier output: {total_amp_output:.0f} W driving "
            f"{total_speaker_rms:.0f} W RMS of speaker load."
        )
    elif all_valid:
        summary = (
            f"System will function but has {warning_count} warning(s). "
            f"Review highlighted channels before deployment."
        )
    else:
        summary = (
            f"Configuration has {error_count} error(s) and {warning_count} warning(s). "
            f"Errors must be resolved to prevent hardware damage or system failure."
        )

    return ValidationResponse(
        is_valid=all_valid,
        channel_results=channel_results,
        system_metrics=metrics,
        global_issues=global_issues,
        summary=summary,
    )
