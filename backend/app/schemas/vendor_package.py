from typing import Optional

from pydantic import BaseModel, field_validator


class VendorPackageCreate(BaseModel):
    name: str
    price: int
    description: Optional[str] = None
    features: list[str] = []
    is_active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()

        if len(value) < 2:
            raise ValueError(
                "Package name must be at least 2 characters long."
            )

        if len(value) > 100:
            raise ValueError(
                "Package name cannot exceed 100 characters."
            )

        return value

    @field_validator("price")
    @classmethod
    def validate_price(cls, value):
        if value < 0:
            raise ValueError(
                "Package price cannot be negative."
            )

        if value > 100000000:
            raise ValueError(
                "Package price is too large."
            )

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value):
        if not value:
            return None

        value = value.strip()

        if len(value) > 2000:
            raise ValueError(
                "Description cannot exceed 2000 characters."
            )

        return value or None

    @field_validator("features")
    @classmethod
    def validate_features(cls, value):
        cleaned_features = []

        for feature in value:
            feature = str(feature).strip()

            if feature:
                cleaned_features.append(feature)

        if len(cleaned_features) > 20:
            raise ValueError(
                "A package can contain up to 20 features."
            )

        return cleaned_features


class VendorPackageUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    description: Optional[str] = None
    features: Optional[list[str]] = None
    is_active: Optional[bool] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        if value is None:
            return None

        value = value.strip()

        if len(value) < 2:
            raise ValueError(
                "Package name must be at least 2 characters long."
            )

        if len(value) > 100:
            raise ValueError(
                "Package name cannot exceed 100 characters."
            )

        return value

    @field_validator("price")
    @classmethod
    def validate_price(cls, value):
        if value is None:
            return None

        if value < 0:
            raise ValueError(
                "Package price cannot be negative."
            )

        if value > 100000000:
            raise ValueError(
                "Package price is too large."
            )

        return value

    @field_validator("description")
    @classmethod
    def validate_description(cls, value):
        if value is None:
            return None

        value = value.strip()

        if len(value) > 2000:
            raise ValueError(
                "Description cannot exceed 2000 characters."
            )

        return value or None

    @field_validator("features")
    @classmethod
    def validate_features(cls, value):
        if value is None:
            return None

        cleaned_features = []

        for feature in value:
            feature = str(feature).strip()

            if feature:
                cleaned_features.append(feature)

        if len(cleaned_features) > 20:
            raise ValueError(
                "A package can contain up to 20 features."
            )

        return cleaned_features