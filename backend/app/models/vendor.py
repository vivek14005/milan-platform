from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    Text
)

from sqlalchemy.orm import relationship

from app.db.database import Base


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        unique=True
    )

    business_name = Column(
        String(150),
        nullable=False
    )

    category = Column(
        String(100),
        nullable=False
    )

    phone = Column(
        String(20),
        nullable=False
    )

    address = Column(
        String(255),
        nullable=True
    )

    state = Column(
        String(100),
        nullable=True
    )

    district = Column(
        String(100),
        nullable=True
    )

    area = Column(
        String(150),
        nullable=True
    )

    pincode = Column(
        String(10),
        nullable=True
    )

    description = Column(
        Text,
        nullable=True
    )

    is_verified = Column(
        Boolean,
        default=False,
        nullable=False
    )

    profile_views = Column(
        Integer,
        default=0,
        nullable=False
    )

    media = relationship(
        "VendorMedia",
        back_populates="vendor",
        cascade="all, delete-orphan"
    )