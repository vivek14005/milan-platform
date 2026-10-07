from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.sql import func

from app.db.database import Base


class BookingPaymentProof(Base):
    __tablename__ = "booking_payment_proofs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    enquiry_id = Column(
        Integer,
        ForeignKey("enquiries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    customer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    vendor_id = Column(
        Integer,
        ForeignKey("vendors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    final_price = Column(
        Integer,
        nullable=False,
    )

    paid_amount = Column(
        Integer,
        nullable=False,
    )

    payment_type = Column(
        String(30),
        nullable=False,
        default="booking_amount",
    )

    transaction_reference = Column(
        String(120),
        nullable=True,
    )

    proof_url = Column(
        String(500),
        nullable=False,
    )

    status = Column(
        String(30),
        nullable=False,
        default="pending",
        index=True,
    )

    rejection_reason = Column(
        String(300),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    reviewed_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )
