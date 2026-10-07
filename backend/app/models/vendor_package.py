from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)

from app.db.database import Base


class VendorPackage(Base):
    __tablename__ = "vendor_packages"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    vendor_id = Column(
        Integer,
        ForeignKey("vendors.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    price = Column(
        Integer,
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    features = Column(
        JSON,
        nullable=False,
        default=list
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True
    )