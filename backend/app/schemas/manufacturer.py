from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class ManufacturerCreate(BaseModel):
    name: str
    country: str
    founded_year: int | None = None
    headquarters: str | None = None
    specialty: str | None = None
    dsp_ecosystem: str | None = None
    preferred_amp_brand: str | None = None
    description: str | None = None


class ManufacturerRead(ManufacturerCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
