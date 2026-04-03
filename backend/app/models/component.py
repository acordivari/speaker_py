from __future__ import annotations

from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.enums import ComponentType, PowerType, ConnectorType


class Component(Base):
    """
    A single loudspeaker cabinet, subwoofer, amplifier, or signal processor.

    Speaker-specific fields (impedance, power handling, sensitivity, frequency response)
    are populated for FULL_RANGE / LINE_ARRAY / SUBWOOFER / MONITOR / FILL components.

    Amplifier-specific fields (output_power_* , min_load_impedance, channels) are
    populated for AMPLIFIER components.

    Active speakers set power_type=ACTIVE and populate voltage_nominal /
    current_draw_amps instead of impedance and power-handling fields.
    """

    __tablename__ = "components"

    id = Column(Integer, primary_key=True, index=True)
    manufacturer_id = Column(Integer, ForeignKey("manufacturers.id"), nullable=False)

    # ── Identity ────────────────────────────────────────────────────────────
    name = Column(String(120), nullable=False)           # Human-readable display name
    model_number = Column(String(80), nullable=False)
    component_type = Column(SAEnum(ComponentType), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    price_usd = Column(Float, nullable=True)

    # ── Speaker / Cabinet Properties ────────────────────────────────────────
    power_type = Column(SAEnum(PowerType), nullable=True)

    # Passive speaker electrical characteristics
    nominal_impedance_ohms = Column(Float, nullable=True)   # e.g. 8.0
    power_handling_rms_watts = Column(Float, nullable=True) # Continuous / AES
    power_handling_peak_watts = Column(Float, nullable=True)# Program / peak

    # Acoustic characteristics
    sensitivity_db_spl = Column(Float, nullable=True)       # dB SPL @ 1 W / 1 m
    freq_response_low_hz = Column(Float, nullable=True)     # −6 dB lower limit
    freq_response_high_hz = Column(Float, nullable=True)    # −6 dB upper limit
    max_spl_db = Column(Float, nullable=True)               # Linear peak SPL

    # Coverage pattern
    coverage_horizontal_deg = Column(Float, nullable=True)
    coverage_vertical_deg = Column(Float, nullable=True)

    # Active speaker AC power requirements
    voltage_nominal = Column(Float, nullable=True)          # e.g. 120 or 240
    current_draw_amps = Column(Float, nullable=True)

    # ── Amplifier Properties ────────────────────────────────────────────────
    channels = Column(Integer, nullable=True)               # Number of amp channels
    output_power_at_8ohm_watts = Column(Float, nullable=True)  # per channel
    output_power_at_4ohm_watts = Column(Float, nullable=True)
    output_power_at_2ohm_watts = Column(Float, nullable=True)
    min_load_impedance_ohms = Column(Float, nullable=True)
    has_onboard_dsp = Column(Boolean, nullable=True, default=False)

    # ── Connectivity ────────────────────────────────────────────────────────
    # For amplifiers: input_connector is signal in (XLR), output_connector is speaker out (Speakon)
    # For passive speakers: input_connector is speaker cable in (Speakon)
    # For active speakers: input_connector is signal in (XLR), power_connector is AC mains
    input_connector = Column(SAEnum(ConnectorType), nullable=True)
    output_connector = Column(SAEnum(ConnectorType), nullable=True)  # for daisy-chain / loop-thru
    power_connector = Column(SAEnum(ConnectorType), nullable=True)   # AC mains (active only)

    # ── Physical ────────────────────────────────────────────────────────────
    weight_kg = Column(Float, nullable=True)
    width_mm = Column(Float, nullable=True)
    height_mm = Column(Float, nullable=True)
    depth_mm = Column(Float, nullable=True)

    # ── Relationships ────────────────────────────────────────────────────────
    manufacturer = relationship("Manufacturer", back_populates="components")

    def __repr__(self) -> str:
        return (
            f"<Component id={self.id} model={self.model_number!r} "
            f"type={self.component_type}>"
        )

    # ── Convenience helpers ──────────────────────────────────────────────────
    @property
    def is_speaker(self) -> bool:
        return self.component_type in (
            ComponentType.FULL_RANGE,
            ComponentType.LINE_ARRAY,
            ComponentType.SUBWOOFER,
            ComponentType.MONITOR,
            ComponentType.FILL,
        )

    @property
    def is_amplifier(self) -> bool:
        return self.component_type == ComponentType.AMPLIFIER

    @property
    def is_active(self) -> bool:
        return self.power_type == PowerType.ACTIVE

    @property
    def is_passive(self) -> bool:
        return self.power_type == PowerType.PASSIVE

    def output_power_at_impedance(self, impedance_ohms: float) -> float | None:
        """
        Return the amplifier's rated output power (watts, per channel) for the
        given load impedance.  Linearly interpolates between known data points;
        returns None if this component is not an amplifier.
        """
        if not self.is_amplifier:
            return None

        known = {}
        if self.output_power_at_8ohm_watts is not None:
            known[8.0] = self.output_power_at_8ohm_watts
        if self.output_power_at_4ohm_watts is not None:
            known[4.0] = self.output_power_at_4ohm_watts
        if self.output_power_at_2ohm_watts is not None:
            known[2.0] = self.output_power_at_2ohm_watts

        if not known:
            return None

        # Exact match
        if impedance_ohms in known:
            return known[impedance_ohms]

        # Sort ascending impedance — interpolate / extrapolate linearly
        sorted_z = sorted(known.keys())
        if impedance_ohms > sorted_z[-1]:
            # Higher impedance → less power; extrapolate downward
            z_hi, z_lo = sorted_z[-1], sorted_z[-2] if len(sorted_z) > 1 else sorted_z[-1]
            if z_hi == z_lo:
                return known[z_hi]
            p_hi, p_lo = known[z_hi], known[z_lo]
            slope = (p_hi - p_lo) / (z_hi - z_lo)
            return max(0.0, p_hi + slope * (impedance_ohms - z_hi))

        if impedance_ohms < sorted_z[0]:
            # Lower impedance than min rated — return None (dangerous territory)
            return None

        # Interpolate between two surrounding points
        for i in range(len(sorted_z) - 1):
            z_lo, z_hi = sorted_z[i], sorted_z[i + 1]
            if z_lo <= impedance_ohms <= z_hi:
                t = (impedance_ohms - z_lo) / (z_hi - z_lo)
                return known[z_lo] + t * (known[z_hi] - known[z_lo])

        return None
