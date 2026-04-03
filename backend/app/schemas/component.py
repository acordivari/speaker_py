from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.models.enums import ComponentType, PowerType, ConnectorType


class ComponentCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    manufacturer_id: int
    name: str
    model_number: str
    component_type: ComponentType
    description: str | None = None
    image_url: str | None = None
    price_usd: float | None = None

    power_type: PowerType | None = None

    # Speaker specs
    nominal_impedance_ohms: float | None = None
    power_handling_rms_watts: float | None = None
    power_handling_peak_watts: float | None = None
    sensitivity_db_spl: float | None = None
    freq_response_low_hz: float | None = None
    freq_response_high_hz: float | None = None
    max_spl_db: float | None = None
    coverage_horizontal_deg: float | None = None
    coverage_vertical_deg: float | None = None
    voltage_nominal: float | None = None
    current_draw_amps: float | None = None

    # Amplifier specs
    channels: int | None = None
    output_power_at_8ohm_watts: float | None = None
    output_power_at_4ohm_watts: float | None = None
    output_power_at_2ohm_watts: float | None = None
    min_load_impedance_ohms: float | None = None
    has_onboard_dsp: bool | None = None

    # Connectivity
    input_connector: ConnectorType | None = None
    output_connector: ConnectorType | None = None
    power_connector: ConnectorType | None = None

    # Physical
    weight_kg: float | None = None
    width_mm: float | None = None
    height_mm: float | None = None
    depth_mm: float | None = None


class ComponentRead(ComponentCreate):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    manufacturer_name: str | None = None  # populated via join

    @classmethod
    def from_orm_with_manufacturer(cls, component) -> "ComponentRead":
        data = ComponentRead.model_validate(component)
        data.manufacturer_name = component.manufacturer.name if component.manufacturer else None
        return data


class ComponentSummary(BaseModel):
    """Lightweight representation used inside validation responses."""
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    name: str
    model_number: str
    component_type: ComponentType
    power_type: PowerType | None = None
    nominal_impedance_ohms: float | None = None
    power_handling_rms_watts: float | None = None
    manufacturer_name: str | None = None
