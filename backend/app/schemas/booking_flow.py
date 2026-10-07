from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ConversationMessageCreate(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=2000
    )

    @field_validator("message")
    @classmethod
    def clean_message(cls, value):
        value = value.strip()

        if not value:
            raise ValueError("Message cannot be empty.")

        return value


class PriceProposalCreate(BaseModel):
    amount: int = Field(
        gt=0,
        le=100000000
    )

    note: Optional[str] = Field(
        default=None,
        max_length=500
    )

    @field_validator("note")
    @classmethod
    def clean_note(cls, value):
        if value is None:
            return None

        value = value.strip()

        return value or None


class PriceRejectionCreate(BaseModel):
    reason: Optional[str] = Field(
        default=None,
        max_length=300
    )

    @field_validator("reason")
    @classmethod
    def clean_reason(cls, value):
        if value is None:
            return None

        value = value.strip()

        return value or None