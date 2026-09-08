from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey,
    DateTime,
)
from sqlalchemy.sql import func

from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    customer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    recipient_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    enquiry_id = Column(
        Integer,
        ForeignKey("enquiries.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    vendor_id = Column(
        Integer,
        ForeignKey("vendors.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    verification_id = Column(
        Integer,
        ForeignKey("vendor_verifications.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    title = Column(
        String(150),
        nullable=False,
    )

    message = Column(
        Text,
        nullable=False,
    )

    notification_type = Column(
        String(50),
        nullable=False,
        default="enquiry_status",
    )

    is_read = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
