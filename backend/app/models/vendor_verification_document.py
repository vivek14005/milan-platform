from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    UniqueConstraint
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class VendorVerificationDocument(Base):
    __tablename__ = "vendor_verification_documents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    verification_id = Column(
        Integer,
        ForeignKey(
            "vendor_verifications.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    # identity_proof
    # self_photo
    # gst_certificate
    # electricity_bill
    document_type = Column(
        String(50),
        nullable=False
    )

    file_url = Column(
        String(500),
        nullable=False
    )

    original_filename = Column(
        String(255),
        nullable=True
    )

    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    verification = relationship(
        "VendorVerification",
        back_populates="documents"
    )

    __table_args__ = (
        UniqueConstraint(
            "verification_id",
            "document_type",
            name="uq_verification_document_type"
        ),
    )