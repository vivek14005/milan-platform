from sqlalchemy import Column, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.sql import func

from app.db.database import Base


class SavedVendor(Base):
    __tablename__ = "saved_vendors"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    vendor_id = Column(
        Integer,
        ForeignKey("vendors.id", ondelete="CASCADE"),
        nullable=False,
        index=True
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
            name="uq_customer_saved_vendor"
        ),
    )