from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class VendorMedia(Base):
    __tablename__ = "vendor_media"

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

    media_type = Column(
        String(20),
        nullable=False
    )

    file_url = Column(
        String(500),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    vendor = relationship(
        "Vendor",
        back_populates="media"
    )