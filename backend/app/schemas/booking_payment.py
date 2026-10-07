from pydantic import BaseModel, Field, field_validator


class PaymentProofReject(BaseModel):
    reason: str = Field(
        min_length=2,
        max_length=300,
    )

    @field_validator("reason")
    @classmethod
    def clean_reason(cls, value: str):
        return value.strip()
