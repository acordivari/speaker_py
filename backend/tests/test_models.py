"""
Unit tests for SQLAlchemy models and their helper methods.
"""
import pytest
from app.models.enums import ComponentType, PowerType, ConnectorType


class TestManufacturerModel:
    def test_all_manufacturers_seeded(self, db_session):
        from app.models.manufacturer import Manufacturer
        mfrs = db_session.query(Manufacturer).all()
        names = {m.name for m in mfrs}
        assert "Funktion-One" in names
        assert "Danley Sound Labs" in names
        assert "L-Acoustics" in names
        assert "d&b audiotechnik" in names
        assert "Meyer Sound" in names
        assert "QSC" in names
        assert "Lab.gruppen" in names

    def test_manufacturer_repr(self, db_session):
        from app.models.manufacturer import Manufacturer
        mfr = db_session.query(Manufacturer).filter_by(name="Meyer Sound").first()
        assert "Meyer Sound" in repr(mfr)

    def test_manufacturer_has_components(self, db_session):
        from app.models.manufacturer import Manufacturer
        mfr = db_session.query(Manufacturer).filter_by(name="d&b audiotechnik").first()
        assert len(mfr.components) > 0

    def test_manufacturer_dsp_ecosystem(self, db_session):
        from app.models.manufacturer import Manufacturer
        la = db_session.query(Manufacturer).filter_by(name="L-Acoustics").first()
        assert la.dsp_ecosystem is not None
        assert "LA Network" in la.dsp_ecosystem or "Soundvision" in la.dsp_ecosystem


class TestComponentModel:
    def test_total_components_seeded(self, all_components):
        # We seed 22 components across 7 manufacturers
        assert len(all_components) >= 20

    def test_passive_speaker_is_passive(self, speaker_v8):
        assert speaker_v8 is not None
        assert speaker_v8.is_passive is True
        assert speaker_v8.is_active is False
        assert speaker_v8.is_speaker is True
        assert speaker_v8.is_amplifier is False

    def test_active_speaker_is_active(self, speaker_leopard):
        assert speaker_leopard is not None
        assert speaker_leopard.is_active is True
        assert speaker_leopard.is_passive is False

    def test_amplifier_is_amplifier(self, amp_d80):
        assert amp_d80 is not None
        assert amp_d80.is_amplifier is True
        assert amp_d80.is_speaker is False

    def test_component_repr(self, amp_d80):
        r = repr(amp_d80)
        assert "D80" in r
        assert "amplifier" in r

    def test_speaker_impedance_data(self, speaker_v8):
        assert speaker_v8.nominal_impedance_ohms == 8.0

    def test_speaker_power_data(self, speaker_v8):
        assert speaker_v8.power_handling_rms_watts == 500.0
        assert speaker_v8.power_handling_peak_watts == 2000.0

    def test_speaker_sensitivity(self, speaker_sh96):
        assert speaker_sh96.sensitivity_db_spl == 109.0

    def test_subwoofer_frequency_range(self, speaker_th118):
        assert speaker_th118.freq_response_low_hz <= 40.0
        assert speaker_th118.freq_response_high_hz >= 100.0

    def test_active_speaker_no_impedance(self, speaker_leopard):
        # Active speakers don't have a nominal impedance — they have AC power specs
        assert speaker_leopard.nominal_impedance_ohms is None
        assert speaker_leopard.voltage_nominal is not None

    def test_amp_power_at_exact_impedance(self, amp_d80):
        assert amp_d80.output_power_at_impedance(8.0) == 2000.0
        assert amp_d80.output_power_at_impedance(4.0) == 4000.0

    def test_amp_power_at_interpolated_impedance(self, amp_d80):
        # 6 Ω is between 4 Ω and 8 Ω — power should be between 2000 and 4000
        p = amp_d80.output_power_at_impedance(6.0)
        assert p is not None
        assert 2000.0 < p < 4000.0

    def test_amp_power_at_high_impedance_extrapolates(self, amp_d80):
        p = amp_d80.output_power_at_impedance(16.0)
        # Should be less than 8 Ω power
        assert p is not None
        assert p < amp_d80.output_power_at_impedance(8.0)

    def test_amp_power_at_below_min_returns_none(self, amp_plx3602):
        # PLX3602 min is 2 Ω; 1 Ω is below minimum
        p = amp_plx3602.output_power_at_impedance(1.0)
        assert p is None

    def test_non_amplifier_power_returns_none(self, speaker_v8):
        assert speaker_v8.output_power_at_impedance(8.0) is None

    def test_speakon_connectors_on_passive_speakers(self, all_components):
        from app.models.enums import PowerType
        passive = [c for c in all_components if c.power_type == PowerType.PASSIVE and c.is_speaker]
        for spk in passive:
            assert spk.input_connector in (
                ConnectorType.SPEAKON_NL4,
                ConnectorType.SPEAKON_NL8,
                ConnectorType.SPEAKON_NL2,
                None,  # a few older models may not specify
            ), f"{spk.model_number} has unexpected connector {spk.input_connector}"

    def test_active_speakers_use_xlr_input(self, all_components):
        active = [c for c in all_components if c.is_active and c.is_speaker]
        assert len(active) > 0
        for spk in active:
            assert spk.input_connector == ConnectorType.XLR_3PIN, (
                f"{spk.model_number} should use XLR input"
            )

    def test_amplifiers_use_speakon_output(self, all_components):
        amps = [c for c in all_components if c.is_amplifier]
        for amp in amps:
            assert amp.output_connector == ConnectorType.SPEAKON_NL4

    def test_f221_is_4ohm_parallel_rated(self, speaker_f221):
        # F221 dual 21" — standard parallel wiring is 4 Ω
        assert speaker_f221.nominal_impedance_ohms == 4.0

    def test_ks28_is_4ohm(self, speaker_ks28):
        assert speaker_ks28.nominal_impedance_ohms == 4.0
