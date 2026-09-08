from sqlalchemy import Column, Integer, String
from app.db.database import Base


class Pincode(Base):
    __tablename__ = "pincodes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    pincode = Column(
        String(6),
        nullable=False,
        index=True
    )

    post_office = Column(
        String(150),
        nullable=False
    )

    district = Column(
        String(100),
        nullable=False,
        index=True
    )

    state = Column(
        String(100),
        nullable=False,
        index=True
    )