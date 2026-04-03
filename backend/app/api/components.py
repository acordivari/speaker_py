from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.component import Component
from app.models.enums import ComponentType
from app.schemas.component import ComponentRead

router = APIRouter(prefix="/components", tags=["Components"])


@router.get("/", response_model=list[ComponentRead])
def list_components(
    manufacturer_id: int | None = Query(default=None, description="Filter by manufacturer"),
    component_type: ComponentType | None = Query(default=None, description="Filter by type"),
    db: Session = Depends(get_db),
):
    """
    Return all components, optionally filtered by manufacturer and/or type.

    Examples:
     - /components?component_type=subwoofer
     - /components?manufacturer_id=1
     - /components?manufacturer_id=3&component_type=amplifier
    """
    query = db.query(Component).options(joinedload(Component.manufacturer))

    if manufacturer_id is not None:
        query = query.filter(Component.manufacturer_id == manufacturer_id)
    if component_type is not None:
        query = query.filter(Component.component_type == component_type)

    components = query.order_by(Component.name).all()
    return [ComponentRead.from_orm_with_manufacturer(c) for c in components]


@router.get("/{component_id}", response_model=ComponentRead)
def get_component(component_id: int, db: Session = Depends(get_db)):
    """Return full details for a single component."""
    component = (
        db.query(Component)
        .options(joinedload(Component.manufacturer))
        .filter(Component.id == component_id)
        .first()
    )
    if component is None:
        raise HTTPException(status_code=404, detail="Component not found.")
    return ComponentRead.from_orm_with_manufacturer(component)
