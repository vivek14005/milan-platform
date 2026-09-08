from sqlalchemy import Column, Integer, String
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    full_name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(100),
        unique=True,
        nullable=False
    )

    phone = Column(
        String(20),
        unique=True,
        nullable=False
    )

    password = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(20),
        nullable=False
    )

    # =====================================================
    # PROFILE / ADDRESS FIELDS
    # Optional rakhe hain taaki existing users break na hon
    # =====================================================

    address = Column(
        String(255),
        nullable=True
    )

    state = Column(
        String(100),
        nullable=True
    )

    district = Column(
        String(100),
        nullable=True
    )

    area = Column(
        String(150),
        nullable=True
    )

    pincode = Column(
        String(10),
        nullable=True
    )