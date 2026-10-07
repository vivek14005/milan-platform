from datetime import date, timedelta
from typing import Optional

from pydantic import BaseModel, field_validator


class EnquiryCreate(BaseModel):
    vendor_id: int
    package_id: Optional[int] = None
    customer_name: str
    phone: str
    wedding_date: Optional[str] = None
    message: Optional[str] = None

    @field_validator("vendor_id")
    @classmethod
    def validate_vendor_id(cls, value):
        if value <= 0:
            raise ValueError(
                "Please select a valid vendor."
            )

        return value

    @field_validator("package_id")
    @classmethod
    def validate_package_id(cls, value):
        if value is not None and value <= 0:
            raise ValueError(
                "Please select a valid package."
            )

        return value

    @field_validator("customer_name")
    @classmethod
    def validate_customer_name(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError(
                "Customer name must be at least 2 characters long."
            )

        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value):
        value = value.strip()

        if not value.isdigit():
            raise ValueError(
                "Phone number must contain digits only."
            )

        if len(value) != 10:
            raise ValueError(
                "Phone number must be exactly 10 digits."
            )

        if value[0] not in "6789":
            raise ValueError(
                "Please enter a valid Indian mobile number."
            )

        return value

    @field_validator("wedding_date")
    @classmethod
    def validate_wedding_date(cls, value):
        if not value:
            return None

        try:
            selected_date = date.fromisoformat(value)
        except ValueError:
            raise ValueError(
                "Wedding date must be a valid date."
            )

        today = date.today()

        if selected_date < today:
            raise ValueError(
                "Wedding date cannot be in the past."
            )

        max_date = today + timedelta(days=365)

        if selected_date > max_date:
            raise ValueError(
                "Wedding date cannot be more than 1 year in the future."
            )

        return value


class EnquiryStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value):
        value = value.strip().lower()

        allowed_statuses = {
            "pending",
            "accepted",
            "rejected",
            "completed",
        }

        if value not in allowed_statuses:
            raise ValueError(
                "Invalid enquiry status."
            )

        return value