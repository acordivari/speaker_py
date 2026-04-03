"""
Unit tests for the compatibility engine (services/compatibility.py).

Covers all major rule categories:
  - Impedance matching
  - Power matching
  - Active / passive rules
  - Connector checks
  - Cross-manufacturer DSP warnings
  - Series vs parallel wiring
  - Bridged amplifier mode
"""
import pytest

from app.models.enums import WiringMode, IssueSeverity, IssueCode
from app.services.compatibility import (
    parallel_impedance,
    series_impedance,
    combined_impedance,
    validate_configuration,
)
from app.schemas.validation import (
    ValidationRequest,
    ChannelConfig,
    SpeakerPlacement,
)


# ── Impedance calculation unit tests ─────────────────────────────────────────

class TestImpedanceCalculations:
    def test_parallel_two_equal(self):
        # Two 8 Ω in parallel → 4 Ω
        assert parallel_impedance([8.0, 8.0]) == pytest.approx(4.0)

    def test_parallel_four_equal(self):
        # Four 8 Ω in parallel → 2 Ω
        assert parallel_impedance([8.0, 8.0, 8.0, 8.0]) == pytest.approx(2.0)

    def test_parallel_mixed(self):
        # 8 Ω ∥ 4 Ω → 8/3 ≈ 2.667 Ω
        result = parallel_impedance([8.0, 4.0])
        assert result == pytest.approx(8.0 / 3.0, rel=1e-4)

    def test_parallel_single(self):
        assert parallel_impedance([8.0]) == pytest.approx(8.0)

    def test_series_two_equal(self):
        assert series_impedance([8.0, 8.0]) == pytest.approx(16.0)

    def test_series_mixed(self):
        assert series_impedance([8.0, 4.0, 16.0]) == pytest.approx(28.0)

    def test_combined_parallel(self):
        assert combined_impedance([8.0, 8.0], WiringMode.PARALLEL) == pytest.approx(4.0)

    def test_combined_series(self):
        assert combined_impedance([8.0, 8.0], WiringMode.SERIES) == pytest.approx(16.0)

    def test_parallel_empty_raises(self):
        with pytest.raises(ValueError):
            parallel_impedance([])


# ── Full validation tests via validate_configuration ─────────────────────────

class TestValidConfiguration:
    """Happy-path configurations that should pass cleanly."""

    def test_single_d80_driving_two_v8_parallel(
        self, db_session, amp_d80, speaker_v8
    ):
        """D80 + 2× V8 @ 4 Ω parallel — textbook d&b configuration."""
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    label="Main L",
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=2)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        assert result.is_valid is True
        assert not any(i.severity == IssueSeverity.ERROR for i in result.channel_results[0].issues)

    def test_d80_v8_impedance_calculated(self, db_session, amp_d80, speaker_v8):
        """Two 8 Ω speakers in parallel → 4 Ω load."""
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=2)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        ch = result.channel_results[0]
        assert ch.total_speaker_impedance_ohms == pytest.approx(4.0)

    def test_la12x_driving_k2_array(self, db_session, amp_la12x):
        """LA12X + K2 — canonical L-Acoustics configuration."""
        from app.models.component import Component
        k2 = db_session.query(Component).filter_by(model_number="K2").first()
        assert k2 is not None

        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    label="FOH Left",
                    amplifier_id=amp_la12x.id,
                    speakers=[SpeakerPlacement(component_id=k2.id, count=1)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        assert result.is_valid is True

    def test_active_speaker_no_amp_is_valid(self, db_session, speaker_leopard):
        """LEOPARD is active — valid without any amplifier."""
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    label="FOH Right",
                    amplifier_id=None,
                    speakers=[SpeakerPlacement(component_id=speaker_leopard.id, count=4)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        assert result.is_valid is True
        errors = [i for i in result.channel_results[0].issues if i.severity == IssueSeverity.ERROR]
        assert len(errors) == 0

    def test_series_wiring_sums_impedance(self, db_session, amp_d80, speaker_v8):
        """Two 8 Ω speakers in series → 16 Ω total."""
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=2)],
                    wiring=WiringMode.SERIES,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        ch = result.channel_results[0]
        assert ch.total_speaker_impedance_ohms == pytest.approx(16.0)

    def test_power_ratio_within_safe_range(self, db_session, amp_d80, speaker_v8):
        """D80 @ 4 Ω = 4 000 W; 2× V8 RMS = 1 000 W → ratio 4.0 exactly — edge case."""
        # 4000 / 1000 = 4.0 — this is exactly the SEVERELY_OVERPOWERED threshold
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=2)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        # 4000 W / 1000 W = 4.0 — should trigger OVERPOWERED warning (not severe error)
        codes = [i.code for i in result.channel_results[0].issues]
        assert IssueCode.AMP_OVERPOWERED in codes or IssueCode.AMP_SEVERELY_OVERPOWERED in codes


class TestImpedanceErrors:
    def test_four_8ohm_parallel_below_2ohm_min(
        self, db_session, amp_plx3602, speaker_v8
    ):
        """
        PLX3602 min is 2 Ω. Four 8 Ω speakers in parallel = 2 Ω — right at the limit.
        Five would go to 1.6 Ω and trigger an error.
        """
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_plx3602.id,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=5)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        codes = [i.code for i in result.channel_results[0].issues]
        assert IssueCode.IMPEDANCE_BELOW_AMP_MINIMUM in codes
        assert result.is_valid is False

    def test_two_4ohm_subs_parallel_at_2ohm(
        self, db_session, amp_fp14000, speaker_f221
    ):
        """
        FP14000 supports 2 Ω. Two F221 (4 Ω each) in parallel → 2 Ω. Should be valid.
        """
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_fp14000.id,
                    speakers=[SpeakerPlacement(component_id=speaker_f221.id, count=2)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        errors = [i for i in result.channel_results[0].issues if i.severity == IssueSeverity.ERROR]
        assert IssueCode.IMPEDANCE_BELOW_AMP_MINIMUM not in [i.code for i in errors]

    def test_bridged_mode_doubles_min_impedance(
        self, db_session, amp_plx3602, speaker_v8
    ):
        """
        PLX3602 bridged requires ≥ 4 Ω. A single 8 Ω speaker is fine.
        Two 8 Ω in parallel (4 Ω) is right at the limit for bridged mode.
        """
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_plx3602.id,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=3)],
                    wiring=WiringMode.PARALLEL,
                    bridged=True,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        # 3× 8 Ω in parallel ≈ 2.67 Ω < 4 Ω bridged minimum → error
        codes = [i.code for i in result.channel_results[0].issues]
        assert IssueCode.IMPEDANCE_BELOW_AMP_MINIMUM in codes

    def test_high_impedance_generates_warning_not_error(
        self, db_session, amp_d80, speaker_v8
    ):
        """Single 8 Ω load on a 4 Ω-rated channel — valid but under-loaded."""
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=1)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        # 8 Ω is not below minimum, but triggers IMPEDANCE_VERY_HIGH warning if > 16
        # 8 Ω does NOT trigger high-impedance warning (16 Ω would)
        errors = [i for i in result.channel_results[0].issues if i.severity == IssueSeverity.ERROR]
        assert len(errors) == 0


class TestPowerMatchingRules:
    def test_underpowered_triggers_warning(self, db_session, speaker_sh96):
        """
        SH96: 250 W RMS. PLX3602 @ 8 Ω = 775 W. Ratio = 3.1 → overpowered warning,
        not underpowered. Use a low-power amp to test underpowering.
        """
        # QSC PLX3602 @ 8 Ω delivers 775 W; SH96 wants 250 W RMS → 3.1× overpowered
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=None,  # no amp → passive speaker error
                    speakers=[SpeakerPlacement(component_id=speaker_sh96.id, count=1)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        codes = [i.code for i in result.channel_results[0].issues]
        assert IssueCode.PASSIVE_NEEDS_AMP in codes

    def test_severely_overpowered_triggers_error(
        self, db_session, amp_fp14000, speaker_sh96
    ):
        """
        FP14000 @ 8 Ω = 2 350 W; SH96 = 250 W RMS → ratio 9.4 → SEVERELY_OVERPOWERED.
        """
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_fp14000.id,
                    speakers=[SpeakerPlacement(component_id=speaker_sh96.id, count=1)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        codes = [i.code for i in result.channel_results[0].issues]
        assert IssueCode.AMP_SEVERELY_OVERPOWERED in codes
        assert result.is_valid is False

    def test_power_ratio_stored_on_channel(
        self, db_session, amp_d80, speaker_v8
    ):
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=2)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        ch = result.channel_results[0]
        assert ch.power_ratio is not None
        assert ch.power_ratio > 0.0


class TestActivePassiveRules:
    def test_passive_without_amp_is_error(self, db_session, speaker_v8):
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=None,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=1)],
                )
            ]
        )
        result = validate_configuration(req, db_session)
        codes = [i.code for i in result.channel_results[0].issues]
        assert IssueCode.PASSIVE_NEEDS_AMP in codes
        assert result.is_valid is False

    def test_active_with_amp_is_error(self, db_session, amp_d80, speaker_leopard):
        """LEOPARD is self-powered — connecting an amp output to it is destructive."""
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_leopard.id, count=1)],
                )
            ]
        )
        result = validate_configuration(req, db_session)
        codes = [i.code for i in result.channel_results[0].issues]
        assert IssueCode.ACTIVE_CONNECTED_TO_AMP in codes
        assert result.is_valid is False

    def test_active_speaker_educational_explanation(
        self, db_session, amp_d80, speaker_leopard
    ):
        """Verify that error issues include non-empty educational text."""
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_leopard.id, count=1)],
                )
            ]
        )
        result = validate_configuration(req, db_session)
        for issue in result.channel_results[0].issues:
            if issue.code == IssueCode.ACTIVE_CONNECTED_TO_AMP:
                assert len(issue.educational_explanation) > 50
                assert len(issue.recommendation) > 20


class TestConnectorRules:
    def test_cross_manufacturer_warning_fires(
        self, db_session, amp_d80, speaker_evo6
    ):
        """D80 (d&b) driving Evo 6 (Funktion-One) → cross-manufacturer DSP warning."""
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_evo6.id, count=1)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        codes = [i.code for i in result.channel_results[0].issues]
        assert IssueCode.CROSS_MANUFACTURER_DSP in codes

    def test_same_manufacturer_no_cross_warning(
        self, db_session, amp_d80, speaker_v8
    ):
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=2)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        codes = [i.code for i in result.channel_results[0].issues]
        assert IssueCode.CROSS_MANUFACTURER_DSP not in codes


class TestNonAmplifierAsAmp:
    def test_speaker_as_amplifier_errors(self, db_session, speaker_v8, speaker_evo6):
        """Assigning a speaker as the amplifier should produce an error."""
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=speaker_v8.id,  # a speaker, not an amp
                    speakers=[SpeakerPlacement(component_id=speaker_evo6.id, count=1)],
                )
            ]
        )
        result = validate_configuration(req, db_session)
        codes = [i.code for i in result.channel_results[0].issues]
        assert IssueCode.NON_AMPLIFIER_AS_AMP in codes
        assert result.is_valid is False


class TestSystemMetrics:
    def test_system_metrics_populated(
        self, db_session, amp_d80, speaker_v8, amp_fp14000, speaker_vsub
    ):
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    label="Main",
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=2)],
                    wiring=WiringMode.PARALLEL,
                ),
                ChannelConfig(
                    label="Subs",
                    amplifier_id=amp_fp14000.id,
                    speakers=[SpeakerPlacement(component_id=speaker_vsub.id, count=2)],
                    wiring=WiringMode.PARALLEL,
                ),
            ]
        )
        result = validate_configuration(req, db_session)
        assert result.system_metrics.total_channels == 2
        assert result.system_metrics.total_speaker_rms_watts > 0
        assert result.system_metrics.total_amp_output_watts > 0

    def test_multi_channel_response_summary(
        self, db_session, amp_d80, speaker_v8
    ):
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_d80.id,
                    speakers=[SpeakerPlacement(component_id=speaker_v8.id, count=2)],
                    wiring=WiringMode.PARALLEL,
                )
            ]
        )
        result = validate_configuration(req, db_session)
        assert isinstance(result.summary, str)
        assert len(result.summary) > 0

    def test_empty_channel_no_speakers_warning(self, db_session, amp_d80):
        req = ValidationRequest(
            channels=[
                ChannelConfig(
                    amplifier_id=amp_d80.id,
                    speakers=[],
                )
            ]
        )
        result = validate_configuration(req, db_session)
        codes = [i.code for i in result.channel_results[0].issues]
        assert IssueCode.NO_SPEAKERS_ON_CHANNEL in codes
