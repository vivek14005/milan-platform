from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.sql import func

from app.db.database import Base


class EnquiryConversationMessage(Base):
    __tablename__ = "enquiry_conversation_messages"

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

    sender_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sender_role = Column(
        String(20),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


class EnquiryPriceNegotiation(Base):
    __tablename__ = "enquiry_price_negotiations"
    __table_args__ = (
        UniqueConstraint(
            "enquiry_id",
            name="uq_enquiry_price_negotiation_enquiry_id",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    enquiry_id = Column(
        Integer,
        ForeignKey("enquiries.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    current_price = Column(
        Integer,
        nullable=True,
    )

    final_price = Column(
        Integer,
        nullable=True,
    )

    last_proposed_by_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    last_proposed_by_role = Column(
        String(20),
        nullable=True,
    )

    customer_confirmed = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    vendor_confirmed = Column(
        Boolean,
        default=False,
        nullable=False,
    )

    status = Column(
        String(40),
        default="negotiating",
        nullable=False,
        index=True,
    )

    rejected_by_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
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

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    finalized_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )


class EnquiryNegotiationAction(Base):
    __tablename__ = "enquiry_negotiation_actions"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    negotiation_id = Column(
        Integer,
        ForeignKey(
            "enquiry_price_negotiations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    enquiry_id = Column(
        Integer,
        ForeignKey("enquiries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    actor_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    actor_role = Column(
        String(20),
        nullable=False,
    )

    action_type = Column(
        String(40),
        nullable=False,
        index=True,
    )

    amount = Column(
        Integer,
        nullable=True,
    )

    note = Column(
        String(500),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
