from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.db.database import Base


class Enquiry(Base):
    __tablename__ = "enquiries"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    vendor_id = Column(
        Integer,
        ForeignKey("vendors.id"),
        nullable=False
    )

    customer_name = Column(
        String(100),
        nullable=False
    )

    phone = Column(
        String(20),
        nullable=False
    )

    wedding_date = Column(
        String(20),
        nullable=True
    )

    message = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(20),
        nullable=False,
        default="pending"
    )