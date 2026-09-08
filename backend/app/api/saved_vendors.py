from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.saved_vendor import SavedVendor
from app.models.vendor import Vendor
from app.api.auth import get_current_user


router = APIRouter(
    prefix="/saved-vendors",
    tags=["Saved Vendors"]
)


# =========================================================
# SAVE VENDOR
# =========================================================

@router.post("/{vendor_id}")
def save_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["sub"])

    # Only customers should save vendors
    if current_user.get("role", "").lower() == "vendor":
        raise HTTPException(
            status_code=403,
            detail="Vendor accounts cannot save vendors."
        )

    vendor = (
        db.query(Vendor)
        .filter(Vendor.id == vendor_id)
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found."
        )

    already_saved = (
        db.query(SavedVendor)
        .filter(
            SavedVendor.customer_id == user_id,
            SavedVendor.vendor_id == vendor_id
        )
        .first()
    )

    if already_saved:
        return {
            "message": "Vendor already saved.",
            "saved": True
        }

    saved_vendor = SavedVendor(
        customer_id=user_id,
        vendor_id=vendor_id
    )

    db.add(saved_vendor)
    db.commit()
    db.refresh(saved_vendor)

    return {
        "message": "Vendor saved successfully.",
        "saved": True,
        "saved_vendor_id": saved_vendor.id
    }


# =========================================================
# UNSAVE VENDOR
# =========================================================

@router.delete("/{vendor_id}")
def unsave_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["sub"])

    saved_vendor = (
        db.query(SavedVendor)
        .filter(
            SavedVendor.customer_id == user_id,
            SavedVendor.vendor_id == vendor_id
        )
        .first()
    )

    if not saved_vendor:
        return {
            "message": "Vendor is not saved.",
            "saved": False
        }

    db.delete(saved_vendor)
    db.commit()

    return {
        "message": "Vendor removed from saved vendors.",
        "saved": False
    }


# =========================================================
# CHECK SAVE STATUS
# =========================================================

@router.get("/{vendor_id}/status")
def saved_vendor_status(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["sub"])

    saved_vendor = (
        db.query(SavedVendor)
        .filter(
            SavedVendor.customer_id == user_id,
            SavedVendor.vendor_id == vendor_id
        )
        .first()
    )

    return {
        "vendor_id": vendor_id,
        "saved": saved_vendor is not None
    }


# =========================================================
# GET ALL SAVED VENDORS
# IMPORTANT: keep this route AFTER /{vendor_id}/status
# =========================================================

@router.get("")
def get_saved_vendors(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["sub"])

    saved_rows = (
        db.query(SavedVendor)
        .filter(SavedVendor.customer_id == user_id)
        .order_by(SavedVendor.created_at.desc())
        .all()
    )

    vendors = []

    for saved in saved_rows:

        vendor = (
            db.query(Vendor)
            .filter(Vendor.id == saved.vendor_id)
            .first()
        )

        if vendor:
            vendors.append({
                "saved_id": saved.id,
                "saved_at": saved.created_at,
                "vendor": {
                    "id": vendor.id,
                    "business_name": vendor.business_name,
                    "category": vendor.category,
                    "phone": vendor.phone,
                    "state": vendor.state,
                    "district": vendor.district,
                    "area": vendor.area,
                    "pincode": vendor.pincode,
                    "address": vendor.address,
                    "description": vendor.description,
                    "is_verified": vendor.is_verified
                }
            })

    return {
        "count": len(vendors),
        "vendors": vendors
    }
@router.get("/vendor/me/count")
def get_my_saved_count(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user["sub"])

    # Vendor account check
    if current_user.get("role", "").lower() != "vendor":
        raise HTTPException(
            status_code=403,
            detail="Only vendor accounts can access this."
        )

    # Logged-in user's vendor profile
    vendor = (
        db.query(Vendor)
        .filter(Vendor.user_id == user_id)
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor profile not found."
        )

    # Count how many customers saved this vendor
    saves_count = (
        db.query(SavedVendor)
        .filter(SavedVendor.vendor_id == vendor.id)
        .count()
    )

    return {
        "vendor_id": vendor.id,
        "profile_saves": saves_count
    }