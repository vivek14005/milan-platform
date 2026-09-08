from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey,
    DateTime,
    UniqueConstraint
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class VendorVerification(Base):
    __tablename__ = "vendor_verifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    vendor_id = Column(
        Integer,
        ForeignKey(
            "vendors.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        unique=True,
        index=True
    )

    # Does vendor have GST?
    has_gst = Column(
        Boolean,
        nullable=False,
        default=False
    )

    # Only required when has_gst = True
    gst_number = Column(
        String(20),
        nullable=True
    )

    # not_submitted / pending / approved / rejected
    status = Column(
        String(30),
        nullable=False,
        default="not_submitted"
    )

    admin_note = Column(
        Text,
        nullable=True
    )

    submitted_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    reviewed_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    # NEW:
    # Stores which admin approved/rejected this vendor
    reviewed_by_admin_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="SET NULL"
        ),
        nullable=True,
        index=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    documents = relationship(
        "VendorVerificationDocument",
        back_populates="verification",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint(
            "vendor_id",
            name="uq_vendor_verification"
        ),
    )