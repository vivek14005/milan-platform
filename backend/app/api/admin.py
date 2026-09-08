from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional

from app.db.database import get_db
from app.core.security import get_current_user

from app.models.user import User
from app.models.notifications import Notification
from app.models.vendor import Vendor
from app.models.vendor_verification import VendorVerification
from app.models.vendor_verification_document import VendorVerificationDocument


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


# =========================================================
# SCHEMAS
# =========================================================

class RejectVerificationRequest(BaseModel):
    admin_note: str


class UpdateAdminProfileRequest(BaseModel):
    full_name: str
    phone: str
    address: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    area: Optional[str] = None
    pincode: Optional[str] = None


# =========================================================
# ADMIN SECURITY
# =========================================================

def require_admin(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    role = current_user.get("role", "").strip().lower()

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )

    if role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    user = (
        db.query(User)
        .filter(User.id == int(user_id))
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Admin user not found."
        )

    if user.role.strip().lower() != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required."
        )

    return user


# =========================================================
# SERIALIZER
# =========================================================

def serialize_verification(
    verification,
    db: Session
):
    vendor = (
        db.query(Vendor)
        .filter(Vendor.id == verification.vendor_id)
        .first()
    )

    vendor_user = None

    if vendor:
        vendor_user = (
            db.query(User)
            .filter(User.id == vendor.user_id)
            .first()
        )

    reviewer = None

    if verification.reviewed_by_admin_id:
        reviewer = (
            db.query(User)
            .filter(
                User.id
                == verification.reviewed_by_admin_id
            )
            .first()
        )

    documents = (
        db.query(VendorVerificationDocument)
        .filter(
            VendorVerificationDocument.verification_id
            == verification.id
        )
        .all()
    )

    return {
        "id": verification.id,
        "vendor_id": verification.vendor_id,

        "vendor": {
            "business_name": (
                vendor.business_name if vendor else None
            ),
            "category": (
                vendor.category if vendor else None
            ),
            "phone": (
                vendor.phone if vendor else None
            ),
            "state": (
                vendor.state if vendor else None
            ),
            "district": (
                vendor.district if vendor else None
            ),
            "area": (
                vendor.area if vendor else None
            ),
            "is_verified": (
                vendor.is_verified if vendor else False
            ),
            "owner_name": (
                vendor_user.full_name
                if vendor_user else None
            ),
            "owner_email": (
                vendor_user.email
                if vendor_user else None
            )
        },

        "has_gst": verification.has_gst,
        "gst_number": verification.gst_number,

        "status": verification.status,
        "admin_note": verification.admin_note,

        "submitted_at": verification.submitted_at,
        "reviewed_at": verification.reviewed_at,
        "reviewed_by_admin_id": (
            verification.reviewed_by_admin_id
        ),
        "reviewed_by_admin_name": (
            reviewer.full_name if reviewer else None
        ),
        "created_at": verification.created_at,

        "documents": [
            {
                "id": document.id,
                "document_type": document.document_type,
                "file_url": document.file_url,
                "original_filename": document.original_filename,
                "uploaded_at": document.uploaded_at
            }
            for document in documents
        ]
    }


# =========================================================
# ADMIN PROFILE
# =========================================================

@router.get("/profile")
def get_admin_profile(
    admin: User = Depends(require_admin)
):
    # These are the fields already used by Milan's User model.
    # Address fields are returned only if they exist on the model.
    return {
        "admin": {
            "id": admin.id,
            "full_name": admin.full_name,
            "email": admin.email,
            "phone": admin.phone,
            "role": admin.role,
            "address": getattr(admin, "address", None),
            "state": getattr(admin, "state", None),
            "district": getattr(admin, "district", None),
            "area": getattr(admin, "area", None),
            "pincode": getattr(admin, "pincode", None)
        }
    }


@router.put("/profile")
def update_admin_profile(
    data: UpdateAdminProfileRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    full_name = data.full_name.strip()
    phone = data.phone.strip()

    if not full_name:
        raise HTTPException(
            status_code=400,
            detail="Full name is required."
        )

    if not phone:
        raise HTTPException(
            status_code=400,
            detail="Phone number is required."
        )

    existing_phone = (
        db.query(User)
        .filter(
            User.phone == phone,
            User.id != admin.id
        )
        .first()
    )

    if existing_phone:
        raise HTTPException(
            status_code=409,
            detail="This phone number is already in use."
        )

    admin.full_name = full_name
    admin.phone = phone
    admin.address = (
        data.address.strip()
        if data.address and data.address.strip()
        else None
    )
    admin.state = (
        data.state.strip()
        if data.state and data.state.strip()
        else None
    )
    admin.district = (
        data.district.strip()
        if data.district and data.district.strip()
        else None
    )
    admin.area = (
        data.area.strip()
        if data.area and data.area.strip()
        else None
    )
    admin.pincode = (
        data.pincode.strip()
        if data.pincode and data.pincode.strip()
        else None
    )

    db.commit()
    db.refresh(admin)

    return {
        "message": "Admin profile updated successfully.",
        "admin": {
            "id": admin.id,
            "full_name": admin.full_name,
            "email": admin.email,
            "phone": admin.phone,
            "role": admin.role,
            "address": admin.address,
            "state": admin.state,
            "district": admin.district,
            "area": admin.area,
            "pincode": admin.pincode
        }
    }


# =========================================================
# ADMIN DASHBOARD STATS
# =========================================================

@router.get("/dashboard-stats")
def get_admin_dashboard_stats(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)

    today_start = datetime(
        now.year,
        now.month,
        now.day,
        tzinfo=timezone.utc
    )

    total_requests = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.status.in_(
                ["pending", "approved", "rejected"]
            )
        )
        .count()
    )

    pending = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.status == "pending"
        )
        .count()
    )

    approved_total = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.status == "approved"
        )
        .count()
    )

    rejected_total = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.status == "rejected"
        )
        .count()
    )

    approved_today = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.status == "approved",
            VendorVerification.reviewed_by_admin_id
            == admin.id,
            VendorVerification.reviewed_at
            >= today_start
        )
        .count()
    )

    rejected_today = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.status == "rejected",
            VendorVerification.reviewed_by_admin_id
            == admin.id,
            VendorVerification.reviewed_at
            >= today_start
        )
        .count()
    )

    reviewed_today = (
        approved_today + rejected_today
    )

    recent_verifications = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.reviewed_by_admin_id
            == admin.id,
            VendorVerification.reviewed_at.isnot(None)
        )
        .order_by(
            VendorVerification.reviewed_at.desc()
        )
        .limit(8)
        .all()
    )

    return {
        "stats": {
            "total_requests": total_requests,
            "pending": pending,
            "approved_total": approved_total,
            "rejected_total": rejected_total,
            "approved_today": approved_today,
            "rejected_today": rejected_today,
            "reviewed_today": reviewed_today
        },
        "recent_activity": [
            serialize_verification(
                verification,
                db
            )
            for verification in recent_verifications
        ]
    }


# =========================================================
# GET ALL VERIFICATIONS
# =========================================================

@router.get("/verifications")
def get_verifications(
    status: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(VendorVerification)

    if status:
        normalized_status = status.strip().lower()

        allowed_statuses = {
            "not_submitted",
            "pending",
            "approved",
            "rejected"
        }

        if normalized_status not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail="Invalid verification status."
            )

        query = query.filter(
            VendorVerification.status == normalized_status
        )

    verifications = (
        query
        .order_by(
            VendorVerification.created_at.desc()
        )
        .all()
    )

    return {
        "count": len(verifications),
        "verifications": [
            serialize_verification(
                verification,
                db
            )
            for verification in verifications
        ]
    }


# =========================================================
# GET SINGLE VERIFICATION
# =========================================================

@router.get("/verifications/{verification_id}")
def get_verification_details(
    verification_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    verification = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.id
            == verification_id
        )
        .first()
    )

    if not verification:
        raise HTTPException(
            status_code=404,
            detail="Verification request not found."
        )

    return {
        "verification": serialize_verification(
            verification,
            db
        )
    }


# =========================================================
# APPROVE VERIFICATION
# =========================================================

@router.put(
    "/verifications/{verification_id}/approve"
)
def approve_verification(
    verification_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    verification = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.id
            == verification_id
        )
        .first()
    )

    if not verification:
        raise HTTPException(
            status_code=404,
            detail="Verification request not found."
        )

    if verification.status != "pending":
        raise HTTPException(
            status_code=409,
            detail=(
                "Only pending verification requests "
                "can be approved."
            )
        )

    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.id == verification.vendor_id
        )
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found."
        )

    verification.status = "approved"
    verification.admin_note = None
    verification.reviewed_at = datetime.now(
        timezone.utc
    )

    # NEW: remember which admin approved the vendor.
    verification.reviewed_by_admin_id = admin.id

    vendor.is_verified = True

    db.add(
        Notification(
            customer_id=None,
            recipient_user_id=vendor.user_id,
            vendor_id=vendor.id,
            verification_id=verification.id,
            title="Verification Approved ✓",
            message=(
                f"Congratulations! {vendor.business_name or 'Your business'} "
                "has been verified by Milan."
            ),
            notification_type="verification_approved",
            is_read=False
        )
    )

    db.commit()

    db.refresh(verification)
    db.refresh(vendor)

    return {
        "message": "Vendor verification approved successfully.",
        "verification": serialize_verification(
            verification,
            db
        )
    }


# =========================================================
# REJECT VERIFICATION
# =========================================================

@router.put(
    "/verifications/{verification_id}/reject"
)
def reject_verification(
    verification_id: int,
    data: RejectVerificationRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    verification = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.id
            == verification_id
        )
        .first()
    )

    if not verification:
        raise HTTPException(
            status_code=404,
            detail="Verification request not found."
        )

    if verification.status != "pending":
        raise HTTPException(
            status_code=409,
            detail=(
                "Only pending verification requests "
                "can be rejected."
            )
        )

    note = data.admin_note.strip()

    if not note:
        raise HTTPException(
            status_code=400,
            detail="Rejection reason is required."
        )

    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.id == verification.vendor_id
        )
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found."
        )

    verification.status = "rejected"
    verification.admin_note = note
    verification.reviewed_at = datetime.now(
        timezone.utc
    )

    # NEW: remember which admin rejected the vendor.
    verification.reviewed_by_admin_id = admin.id

    vendor.is_verified = False

    db.add(
        Notification(
            customer_id=None,
            recipient_user_id=vendor.user_id,
            vendor_id=vendor.id,
            verification_id=verification.id,
            title="Verification Rejected",
            message=(
                "Your Milan verification request was rejected."
                + (
                    f" Reason: {verification.admin_note}"
                    if verification.admin_note
                    else ""
                )
            ),
            notification_type="verification_rejected",
            is_read=False
        )
    )

    db.commit()

    db.refresh(verification)
    db.refresh(vendor)

    return {
        "message": "Vendor verification rejected.",
        "verification": serialize_verification(
            verification,
            db
        )
    }
