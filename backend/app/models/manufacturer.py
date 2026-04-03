from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Manufacturer(Base):
    """
    A speaker or amplifier manufacturer.

    Flagship professional manufacturers each have their own DSP ecosystems,
    connector standards, and amplifier pairings — all of which affect system
    compatibility when mixing brands.
    """

    __tablename__ = "manufacturers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, unique=True)
    country = Column(String(80), nullable=False)
    founded_year = Column(Integer, nullable=True)
    headquarters = Column(String(120), nullable=True)
    specialty = Column(String(255), nullable=True)          # e.g. "touring line arrays"
    dsp_ecosystem = Column(String(120), nullable=True)      # proprietary DSP platform name
    preferred_amp_brand = Column(String(120), nullable=True)  # brand typically paired with
    description = Column(Text, nullable=True)

    components = relationship("Component", back_populates="manufacturer")

    def __repr__(self) -> str:
        return f"<Manufacturer id={self.id} name={self.name!r}>"
