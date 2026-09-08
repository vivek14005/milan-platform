from sqlalchemy import (
    Column,
    Integer,
    Text,
    ForeignKey,
    DateTime,
    UniqueConstraint
)

from sqlalchemy.sql import func

from app.db.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    vendor_id = Column(
        Integer,
        ForeignKey(
            "vendors.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    rating = Column(
        Integer,
        nullable=False
    )

    review_text = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "customer_id",
            "vendor_id",
            name="uq_customer_vendor_review"
        ),
    )