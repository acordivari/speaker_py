"""
Integration tests for all REST API endpoints.
Uses a FastAPI TestClient backed by the in-memory SQLite database.
"""
import pytest


class TestHealthEndpoint:
    def test_health_ok(self, client):
        r = client.get("/")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestManufacturersEndpoint:
    def test_list_manufacturers(self, client):
        r = client.get("/api/v1/manufacturers/")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 7

    def test_manufacturers_have_required_fields(self, client):
        r = client.get("/api/v1/manufacturers/")
        for mfr in r.json():
            assert "id" in mfr
            assert "name" in mfr
            assert "country" in mfr

    def test_get_manufacturer_by_id(self, client, db_session):
        from app.models.manufacturer import Manufacturer
        mfr = db_session.query(Manufacturer).filter_by(name="Meyer Sound").first()
        r = client.get(f"/api/v1/manufacturers/{mfr.id}")
        assert r.status_code == 200
        assert r.json()["name"] == "Meyer Sound"

    def test_get_manufacturer_not_found(self, client):
        r = client.get("/api/v1/manufacturers/99999")
        assert r.status_code == 404

    def test_manufacturer_includes_description(self, client):
        r = client.get("/api/v1/manufacturers/")
        for mfr in r.json():
            assert mfr.get("description") is not None


class TestComponentsEndpoint:
    def test_list_all_components(self, client):
        r = client.get("/api/v1/components/")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 20

    def test_components_have_required_fields(self, client):
        r = client.get("/api/v1/components/")
        for comp in r.json():
            assert "id" in comp
            assert "name" in comp
            assert "model_number" in comp
            assert "component_type" in comp

    def test_filter_by_component_type_subwoofer(self, client):
        r = client.get("/api/v1/components/?component_type=subwoofer")
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        for comp in data:
            assert comp["component_type"] == "subwoofer"

    def test_filter_by_component_type_amplifier(self, client):
        r = client.get("/api/v1/components/?component_type=amplifier")
        data = r.json()
        assert len(data) >= 4  # D80, LA12X, LA4X, PLX3602, FP14000
        for comp in data:
            assert comp["component_type"] == "amplifier"

    def test_filter_by_manufacturer(self, client, db_session):
        from app.models.manufacturer import Manufacturer
        mfr = db_session.query(Manufacturer).filter_by(name="Danley Sound Labs").first()
        r = client.get(f"/api/v1/components/?manufacturer_id={mfr.id}")
        data = r.json()
        assert len(data) >= 4  # SH96, SH50, TH118, BC218, SM80F
        for comp in data:
            assert comp["manufacturer_name"] == "Danley Sound Labs"

    def test_filter_combined(self, client, db_session):
        from app.models.manufacturer import Manufacturer
        mfr = db_session.query(Manufacturer).filter_by(name="L-Acoustics").first()
        r = client.get(f"/api/v1/components/?manufacturer_id={mfr.id}&component_type=amplifier")
        data = r.json()
        assert len(data) >= 2  # LA12X, LA4X
        for comp in data:
            assert comp["component_type"] == "amplifier"
            assert comp["manufacturer_name"] == "L-Acoustics"

    def test_get_component_by_id(self, client, amp_d80):
        r = client.get(f"/api/v1/components/{amp_d80.id}")
        assert r.status_code == 200
        data = r.json()
        assert data["model_number"] == "D80"
        assert data["component_type"] == "amplifier"
        assert data["output_power_at_4ohm_watts"] == 4000.0

    def test_get_component_not_found(self, client):
        r = client.get("/api/v1/components/99999")
        assert r.status_code == 404

    def test_component_includes_manufacturer_name(self, client, speaker_v8):
        r = client.get(f"/api/v1/components/{speaker_v8.id}")
        data = r.json()
        assert data["manufacturer_name"] == "d&b audiotechnik"

    def test_active_speakers_have_no_impedance(self, client, speaker_leopard):
        r = client.get(f"/api/v1/components/{speaker_leopard.id}")
        data = r.json()
        assert data["nominal_impedance_ohms"] is None
        assert data["power_type"] == "active"

    def test_passive_speakers_have_impedance(self, client, speaker_v8):
        r = client.get(f"/api/v1/components/{speaker_v8.id}")
        data = r.json()
        assert data["nominal_impedance_ohms"] == 8.0
        assert data["power_type"] == "passive"

    def test_amplifiers_have_power_specs(self, client, amp_fp14000):
        r = client.get(f"/api/v1/components/{amp_fp14000.id}")
        data = r.json()
        assert data["output_power_at_2ohm_watts"] == 7000.0
        assert data["output_power_at_4ohm_watts"] == 4400.0
        assert data["min_load_impedance_ohms"] == 2.0


class TestValidationEndpoint:
    def test_valid_d80_v8_configuration(self, client, amp_d80, speaker_v8):
        payload = {
            "channels": [
                {
                    "label": "Main Left",
                    "amplifier_id": amp_d80.id,
                    "speakers": [{"component_id": speaker_v8.id, "count": 2}],
                    "wiring": "parallel",
                    "bridged": False,
                }
            ]
        }
        r = client.post("/api/v1/validate/", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["is_valid"] is True
        assert len(data["channel_results"]) == 1
        assert data["channel_results"][0]["total_speaker_impedance_ohms"] == pytest.approx(4.0)

    def test_passive_without_amp_returns_error(self, client, speaker_v8):
        payload = {
            "channels": [
                {
                    "label": "Broken Channel",
                    "amplifier_id": None,
                    "speakers": [{"component_id": speaker_v8.id, "count": 1}],
                    "wiring": "parallel",
                }
            ]
        }
        r = client.post("/api/v1/validate/", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["is_valid"] is False
        issue_codes = [i["code"] for i in data["channel_results"][0]["issues"]]
        assert "PASSIVE_NEEDS_AMP" in issue_codes

    def test_active_with_amp_returns_error(self, client, amp_d80, speaker_leopard):
        payload = {
            "channels": [
                {
                    "amplifier_id": amp_d80.id,
                    "speakers": [{"component_id": speaker_leopard.id, "count": 1}],
                    "wiring": "parallel",
                }
            ]
        }
        r = client.post("/api/v1/validate/", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["is_valid"] is False
        issue_codes = [i["code"] for i in data["channel_results"][0]["issues"]]
        assert "ACTIVE_CONNECTED_TO_AMP" in issue_codes

    def test_impedance_below_minimum_returns_error(
        self, client, amp_plx3602, speaker_v8
    ):
        # 5× 8 Ω in parallel = 1.6 Ω < 2 Ω minimum
        payload = {
            "channels": [
                {
                    "amplifier_id": amp_plx3602.id,
                    "speakers": [{"component_id": speaker_v8.id, "count": 5}],
                    "wiring": "parallel",
                }
            ]
        }
        r = client.post("/api/v1/validate/", json=payload)
        data = r.json()
        assert data["is_valid"] is False
        codes = [i["code"] for i in data["channel_results"][0]["issues"]]
        assert "IMPEDANCE_BELOW_AMP_MINIMUM" in codes

    def test_cross_manufacturer_warning(self, client, amp_d80, speaker_evo6):
        payload = {
            "channels": [
                {
                    "amplifier_id": amp_d80.id,
                    "speakers": [{"component_id": speaker_evo6.id, "count": 1}],
                    "wiring": "parallel",
                }
            ]
        }
        r = client.post("/api/v1/validate/", json=payload)
        data = r.json()
        codes = [i["code"] for i in data["channel_results"][0]["issues"]]
        assert "CROSS_MANUFACTURER_DSP" in codes

    def test_multi_channel_request(
        self, client, amp_d80, speaker_v8, amp_fp14000, speaker_vsub
    ):
        payload = {
            "channels": [
                {
                    "label": "Array L",
                    "amplifier_id": amp_d80.id,
                    "speakers": [{"component_id": speaker_v8.id, "count": 2}],
                    "wiring": "parallel",
                },
                {
                    "label": "Array R",
                    "amplifier_id": amp_d80.id,
                    "speakers": [{"component_id": speaker_v8.id, "count": 2}],
                    "wiring": "parallel",
                },
                {
                    "label": "Subs",
                    "amplifier_id": amp_fp14000.id,
                    "speakers": [{"component_id": speaker_vsub.id, "count": 2}],
                    "wiring": "parallel",
                },
            ]
        }
        r = client.post("/api/v1/validate/", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert len(data["channel_results"]) == 3
        assert data["system_metrics"]["total_channels"] == 3

    def test_validation_response_includes_educational_text(
        self, client, amp_d80, speaker_leopard
    ):
        payload = {
            "channels": [
                {
                    "amplifier_id": amp_d80.id,
                    "speakers": [{"component_id": speaker_leopard.id, "count": 1}],
                    "wiring": "parallel",
                }
            ]
        }
        r = client.post("/api/v1/validate/", json=payload)
        data = r.json()
        for issue in data["channel_results"][0]["issues"]:
            assert len(issue["educational_explanation"]) > 10
            assert len(issue["recommendation"]) > 10

    def test_validation_response_has_summary(self, client, amp_d80, speaker_v8):
        payload = {
            "channels": [
                {
                    "amplifier_id": amp_d80.id,
                    "speakers": [{"component_id": speaker_v8.id, "count": 2}],
                    "wiring": "parallel",
                }
            ]
        }
        r = client.post("/api/v1/validate/", json=payload)
        data = r.json()
        assert "summary" in data
        assert len(data["summary"]) > 0

    def test_validation_invalid_component_id(self, client, amp_d80):
        payload = {
            "channels": [
                {
                    "amplifier_id": amp_d80.id,
                    "speakers": [{"component_id": 99999, "count": 1}],
                    "wiring": "parallel",
                }
            ]
        }
        r = client.post("/api/v1/validate/", json=payload)
        # Should still return 200 with a global issue rather than crashing
        assert r.status_code == 200

    def test_severely_overpowered_returns_error(
        self, client, amp_fp14000, speaker_sh96
    ):
        # FP14000 @ 8 Ω: 2 350 W; SH96 RMS: 250 W → ratio 9.4
        payload = {
            "channels": [
                {
                    "amplifier_id": amp_fp14000.id,
                    "speakers": [{"component_id": speaker_sh96.id, "count": 1}],
                    "wiring": "parallel",
                }
            ]
        }
        r = client.post("/api/v1/validate/", json=payload)
        data = r.json()
        assert data["is_valid"] is False
        codes = [i["code"] for i in data["channel_results"][0]["issues"]]
        assert "AMP_SEVERELY_OVERPOWERED" in codes
