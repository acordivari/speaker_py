from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.manufacturer import Manufacturer
from app.schemas.manufacturer import ManufacturerRead

router = APIRouter(prefix="/manufacturers", tags=["Manufacturers"])


@router.get("/", response_model=list[ManufacturerRead])
def list_manufacturers(db: Session = Depends(get_db)):
    """Return all manufacturers in the database."""
    return db.query(Manufacturer).order_by(Manufacturer.name).all()


@router.get("/{manufacturer_id}", response_model=ManufacturerRead)
def get_manufacturer(manufacturer_id: int, db: Session = Depends(get_db)):
    """Return a single manufacturer by ID."""
    mfr = db.get(Manufacturer, manufacturer_id)
    if mfr is None:
        raise HTTPException(status_code=404, detail="Manufacturer not found.")
    return mfr
