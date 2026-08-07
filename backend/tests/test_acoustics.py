"""
Coverage / acoustics tests.

The physics functions are pure, so most assertions are analytic (hand-checked
against the inverse-square and pressure-summation laws) — no DB needed. The
endpoint tests exercise the full config → SPL grid pipeline against seed data.
"""
import math

import pytest

from app.services.acoustics import (
    Source,
    spl_at_distance,
    off_axis_attenuation_db,
    sum_levels,
    spl_at_point,
    compute_spl_grid,
)
from app.services.venue_geometry import (
    in_audience,
    REFERENCE_POINTS,
    AUDIENCE_POSITIONS,
    VIEWBOX_WIDTH,
    VIEWBOX_HEIGHT,
)


# ── Inverse-square law ───────────────────────────────────────────────────────

class TestInverseSquare:
    def test_pure_inverse_square_beyond_floor(self):
        # 1 W radiating to 10 m: 100 − 20·log10(10) = 80 dB.
        assert spl_at_distance(100.0, 1.0, 10.0) == pytest.approx(80.0)

    def test_doubling_distance_loses_six_db(self):
        near = spl_at_distance(100.0, 1.0, 5.0)
        far = spl_at_distance(100.0, 1.0, 10.0)
        assert near - far == pytest.approx(6.0206, abs=1e-3)

    def test_doubling_power_adds_three_db(self):
        single = spl_at_distance(100.0, 1.0, 5.0)
        double = spl_at_distance(100.0, 2.0, 5.0)
        assert double - single == pytest.approx(3.0103, abs=1e-3)

    def test_distance_floor_prevents_singularity(self):
        # Anything closer than the 2 m floor is treated as 2 m.
        floored = spl_at_distance(100.0, 1.0, 2.0)
        assert spl_at_distance(100.0, 1.0, 0.1) == pytest.approx(floored)
        assert spl_at_distance(100.0, 1.0, 0.5) == pytest.approx(floored)


# ── Off-axis dispersion ──────────────────────────────────────────────────────

class TestOffAxis:
    def test_on_axis_is_zero_attenuation(self):
        assert off_axis_attenuation_db(0.0, 90.0) == 0.0

    def test_coverage_edge_is_six_db_down(self):
        # The rated coverage angle is the −6 dB beamwidth.
        assert off_axis_attenuation_db(45.0, 90.0) == pytest.approx(6.0)

    def test_further_off_axis_falls_faster(self):
        edge = off_axis_attenuation_db(45.0, 90.0)
        beyond = off_axis_attenuation_db(67.5, 90.0)
        assert beyond > edge

    def test_attenuation_is_clamped(self):
        assert off_axis_attenuation_db(180.0, 40.0) <= 40.0

    def test_zero_coverage_is_safe(self):
        assert off_axis_attenuation_db(30.0, 0.0) == 0.0


# ── Incoherent power-domain summation ────────────────────────────────────────

class TestLevelSum:
    def test_two_equal_sources_add_three_db(self):
        # Uncorrelated broadband sources sum in the intensity domain (+3 dB).
        assert sum_levels([100.0, 100.0]) == pytest.approx(103.0103, abs=1e-3)

    def test_single_source_unchanged(self):
        assert sum_levels([103.0]) == pytest.approx(103.0)

    def test_empty_returns_none(self):
        assert sum_levels([]) is None

    def test_louder_source_dominates(self):
        combined = sum_levels([100.0, 80.0])
        # Adding a source 20 dB quieter lifts the total by well under 1 dB.
        assert 100.0 < combined < 101.0


# ── Point / grid sampling ────────────────────────────────────────────────────

class TestSpatialSampling:
    def _source(self, **kw):
        base = dict(x=400.0, y=300.0, sensitivity_db=100.0, power_w=100.0, coverage_deg=90.0)
        base.update(kw)
        return Source(**base)

    def test_silent_source_contributes_nothing(self):
        assert spl_at_point([self._source(power_w=0.0)], 400.0, 200.0) is None

    def test_directional_source_quieter_off_axis(self):
        # Aimed straight up the room (−y). On-axis point is directly ahead;
        # off-axis point is to the side at the same distance.
        src = self._source(aim_x=0.0, aim_y=-1.0)
        on_axis = spl_at_point([src], 400.0, 200.0)   # 100 px directly ahead
        off_axis = spl_at_point([src], 500.0, 300.0)  # 100 px to the side
        assert on_axis > off_axis

    def test_grid_spans_viewbox_and_masks_non_audience(self):
        grid = compute_spl_grid([self._source()], cell_size=10.0)
        assert grid.cols == math.ceil(VIEWBOX_WIDTH / 10.0)
        assert grid.rows == math.ceil(VIEWBOX_HEIGHT / 10.0)
        assert len(grid.values) == grid.cols * grid.rows
        # Some audience cells have values; non-audience cells are None.
        assert any(v is not None for v in grid.values)
        assert any(v is None for v in grid.values)

    def test_no_sources_yields_all_none(self):
        grid = compute_spl_grid([], cell_size=20.0)
        assert all(v is None for v in grid.values)
        assert grid.min_spl is None and grid.max_spl is None


# ── Venue geometry ───────────────────────────────────────────────────────────

class TestVenueGeometry:
    def test_ga_floor_centre_is_audience(self):
        assert in_audience(400.0, 260.0) is True

    def test_stage_is_not_audience(self):
        assert in_audience(400.0, 450.0) is False

    def test_reference_points_are_in_audience(self):
        for name, (x, y) in REFERENCE_POINTS.items():
            assert in_audience(x, y) is True, f"{name} should be in an audience area"

    def test_monitors_excluded_from_audience_positions(self):
        assert "MON_L" not in AUDIENCE_POSITIONS
        assert "MON_R" not in AUDIENCE_POSITIONS
        assert "MAIN_L" in AUDIENCE_POSITIONS


# ── Endpoint: full config → coverage pipeline ────────────────────────────────

class TestCoverageEndpoint:
    def test_valid_rig_returns_grid_and_stats(self, client, amp_d80, speaker_v8):
        payload = {
            "channels": [
                {
                    "position_key": "MAIN_L",
                    "label": "Main Left",
                    "amplifier_id": amp_d80.id,
                    "speakers": [{"component_id": speaker_v8.id, "count": 2}],
                    "wiring": "parallel",
                    "bridged": False,
                }
            ]
        }
        r = client.post("/api/v1/coverage/", json=payload)
        assert r.status_code == 200
        data = r.json()

        assert data["grid"]["cols"] == 80 and data["grid"]["rows"] == 56
        assert any(v is not None for v in data["grid"]["values"])
        assert data["stats"]["active_source_count"] == 2
        # Two passive V8 boxes on a D80 should land in a plausible concert range.
        assert 80.0 < data["stats"]["foh_spl_db"] < 135.0

    def test_monitor_position_contributes_no_sources(self, client, amp_d80, speaker_v8):
        payload = {
            "channels": [
                {
                    "position_key": "MON_L",
                    "label": "Monitor L",
                    "amplifier_id": amp_d80.id,
                    "speakers": [{"component_id": speaker_v8.id, "count": 2}],
                }
            ]
        }
        r = client.post("/api/v1/coverage/", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["stats"]["active_source_count"] == 0
        assert all(v is None for v in data["grid"]["values"])

    def test_empty_channel_reports_no_sources(self, client):
        payload = {"channels": [{"position_key": "MAIN_L", "label": "Main Left"}]}
        r = client.post("/api/v1/coverage/", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["stats"]["active_source_count"] == 0
        assert "No active sources" in data["summary"]

    def test_seventeen_channels_rejected(self, client):
        payload = {
            "channels": [
                {"position_key": "MAIN_L", "label": "Main Left"} for _ in range(17)
            ]
        }
        r = client.post("/api/v1/coverage/", json=payload)
        assert r.status_code == 422

    def test_sixteen_channels_accepted(self, client):
        payload = {
            "channels": [
                {"position_key": "MAIN_L", "label": "Main Left"} for _ in range(16)
            ]
        }
        r = client.post("/api/v1/coverage/", json=payload)
        assert r.status_code != 422
        assert r.status_code == 200
