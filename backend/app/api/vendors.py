from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from sqlalchemy.orm import Session

from pathlib import Path
import shutil
import uuid


from app.db.database import get_db
from app.models.vendor import Vendor
from app.models.vendor_media import VendorMedia
from app.models.user import User
from app.schemas.vendor import VendorCreate
from app.core.security import get_current_user


router = APIRouter(
    prefix="/vendors",
    tags=["Vendors"]
)


# =========================================================
# UPLOAD SETTINGS
# =========================================================

UPLOAD_ROOT = Path("uploads")
VENDOR_UPLOAD_ROOT = UPLOAD_ROOT / "vendors"

VENDOR_UPLOAD_ROOT.mkdir(
    parents=True,
    exist_ok=True
)


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/webm",
    "video/quicktime"
}


# =========================================================
# CREATE VENDOR PROFILE
# =========================================================

@router.post("")
def create_vendor(
    vendor: VendorCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    user_id = int(current_user.get("sub"))

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    existing_vendor = (
        db.query(Vendor)
        .filter(Vendor.user_id == user_id)
        .first()
    )

    if existing_vendor:
        raise HTTPException(
            status_code=400,
            detail="Vendor profile already exists"
        )

    new_vendor = Vendor(
        user_id=user_id,
        business_name=vendor.business_name.strip(),
        category=vendor.category.strip(),
        phone=vendor.phone.strip(),

        address=(
            vendor.address.strip()
            if vendor.address
            else None
        ),

        state=(
            vendor.state.strip()
            if vendor.state
            else None
        ),

        district=(
            vendor.district.strip()
            if vendor.district
            else None
        ),

        area=(
            vendor.area.strip()
            if vendor.area
            else None
        ),

        pincode=(
            vendor.pincode.strip()
            if vendor.pincode
            else None
        ),

        description=(
            vendor.description.strip()
            if vendor.description
            else None
        ),

        profile_views=0
    )

    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)

    return {
        "message": "Vendor profile created successfully",
        "vendor": {
            "id": new_vendor.id,
            "user_id": new_vendor.user_id,
            "business_name": new_vendor.business_name,
            "category": new_vendor.category,
            "phone": new_vendor.phone,
            "address": new_vendor.address,
            "state": new_vendor.state,
            "district": new_vendor.district,
            "area": new_vendor.area,
            "pincode": new_vendor.pincode,
            "description": new_vendor.description,
            "is_verified": new_vendor.is_verified,
            "profile_views": new_vendor.profile_views
        }
    }


# =========================================================
# GET ALL VENDORS + FILTERS
# =========================================================

@router.get("")
def get_vendors(
    state: str | None = None,
    district: str | None = None,
    area: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db)
):

    query = db.query(Vendor)

    if state:
        query = query.filter(
            Vendor.state.ilike(state.strip())
        )

    if district:
        query = query.filter(
            Vendor.district.ilike(district.strip())
        )

    if area:
        query = query.filter(
            Vendor.area.ilike(area.strip())
        )

    if category:
        query = query.filter(
            Vendor.category.ilike(category.strip())
        )

    vendors = query.all()

    return {
        "count": len(vendors),

        "vendors": [
            {
                "id": vendor.id,
                "user_id": vendor.user_id,
                "business_name": vendor.business_name,
                "category": vendor.category,
                "phone": vendor.phone,
                "address": vendor.address,
                "state": vendor.state,
                "district": vendor.district,
                "area": vendor.area,
                "pincode": vendor.pincode,
                "description": vendor.description,
                "is_verified": vendor.is_verified,
                "profile_views": vendor.profile_views
            }
            for vendor in vendors
        ]
    }


# =========================================================
# GET LOGGED-IN VENDOR PROFILE
# IMPORTANT: KEEP ABOVE /{vendor_id}
# =========================================================

@router.get("/me")
def get_my_vendor_profile(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    user_id = int(current_user.get("sub"))

    vendor = (
        db.query(Vendor)
        .filter(Vendor.user_id == user_id)
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor profile not found"
        )

    return {
        "vendor": {
            "id": vendor.id,
            "user_id": vendor.user_id,
            "business_name": vendor.business_name,
            "category": vendor.category,
            "phone": vendor.phone,
            "address": vendor.address,
            "state": vendor.state,
            "district": vendor.district,
            "area": vendor.area,
            "pincode": vendor.pincode,
            "description": vendor.description,
            "is_verified": vendor.is_verified,
            "profile_views": vendor.profile_views
        }
    }


# =========================================================
# UPLOAD VENDOR PORTFOLIO
#
# POST /vendors/portfolio/upload
# =========================================================

@router.post("/portfolio/upload")
def upload_vendor_portfolio(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    user_id = int(current_user.get("sub"))

    vendor = (
        db.query(Vendor)
        .filter(Vendor.user_id == user_id)
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor profile not found"
        )

    if not files:
        raise HTTPException(
            status_code=400,
            detail="Please select at least one file"
        )

    vendor_folder = (
        VENDOR_UPLOAD_ROOT /
        str(vendor.id)
    )

    vendor_folder.mkdir(
        parents=True,
        exist_ok=True
    )

    uploaded_media = []

    for file in files:

        content_type = file.content_type or ""

        # -----------------------------------------
        # Determine media type
        # -----------------------------------------

        if content_type in ALLOWED_IMAGE_TYPES:

            media_type = "image"

        elif content_type in ALLOWED_VIDEO_TYPES:

            media_type = "video"

        else:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported file type: "
                    f"{file.filename}"
                )
            )

        # -----------------------------------------
        # Original file extension
        # -----------------------------------------

        original_filename = (
            file.filename
            or "media"
        )

        extension = Path(
            original_filename
        ).suffix.lower()

        # -----------------------------------------
        # Unique filename
        # -----------------------------------------

        unique_filename = (
            f"{uuid.uuid4().hex}{extension}"
        )

        file_path = (
            vendor_folder /
            unique_filename
        )

        # -----------------------------------------
        # Save actual file
        # -----------------------------------------

        try:

            with open(
                file_path,
                "wb"
            ) as buffer:

                shutil.copyfileobj(
                    file.file,
                    buffer
                )

        except Exception:

            raise HTTPException(
                status_code=500,
                detail=(
                    f"Could not save "
                    f"{original_filename}"
                )
            )

        finally:

            file.file.close()

        # -----------------------------------------
        # URL saved in database
        # -----------------------------------------

        file_url = (
            f"/uploads/vendors/"
            f"{vendor.id}/"
            f"{unique_filename}"
        )

        new_media = VendorMedia(
            vendor_id=vendor.id,
            media_type=media_type,
            file_url=file_url
        )

        db.add(new_media)
        db.flush()

        uploaded_media.append({
            "id": new_media.id,
            "vendor_id": vendor.id,
            "media_type": media_type,
            "file_url": file_url
        })

    db.commit()

    return {
        "message": "Portfolio media uploaded successfully",
        "count": len(uploaded_media),
        "media": uploaded_media
    }


# =========================================================
# GET MY PORTFOLIO
#
# GET /vendors/portfolio/me
# =========================================================

@router.get("/portfolio/me")
def get_my_vendor_portfolio(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    user_id = int(current_user.get("sub"))

    vendor = (
        db.query(Vendor)
        .filter(Vendor.user_id == user_id)
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor profile not found"
        )

    media = (
        db.query(VendorMedia)
        .filter(
            VendorMedia.vendor_id
            == vendor.id
        )
        .order_by(
            VendorMedia.id.desc()
        )
        .all()
    )

    return {
        "count": len(media),
        "vendor_id": vendor.id,

        "media": [
            {
                "id": item.id,
                "vendor_id": item.vendor_id,
                "media_type": item.media_type,
                "file_url": item.file_url,
                "created_at": item.created_at
            }
            for item in media
        ]
    }


# =========================================================
# DELETE PORTFOLIO MEDIA
#
# DELETE /vendors/portfolio/{media_id}
# =========================================================

@router.delete("/portfolio/{media_id}")
def delete_vendor_portfolio_media(
    media_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    user_id = int(current_user.get("sub"))

    vendor = (
        db.query(Vendor)
        .filter(Vendor.user_id == user_id)
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor profile not found"
        )

    media = (
        db.query(VendorMedia)
        .filter(
            VendorMedia.id == media_id,
            VendorMedia.vendor_id == vendor.id
        )
        .first()
    )

    if not media:
        raise HTTPException(
            status_code=404,
            detail="Media not found"
        )

    # -----------------------------------------
    # Delete physical file
    # -----------------------------------------

    relative_path = (
        media.file_url
        .replace(
            "/uploads/",
            ""
        )
    )

    physical_path = (
        UPLOAD_ROOT /
        relative_path
    )

    if physical_path.exists():

        try:
            physical_path.unlink()

        except Exception:
            pass

    # -----------------------------------------
    # Delete database row
    # -----------------------------------------

    db.delete(media)
    db.commit()

    return {
        "message": "Portfolio media deleted successfully",
        "media_id": media_id
    }


# =========================================================
# GET PUBLIC VENDOR PORTFOLIO
#
# GET /vendors/{vendor_id}/media
# =========================================================

@router.get("/{vendor_id}/media")
def get_vendor_portfolio(
    vendor_id: int,
    db: Session = Depends(get_db)
):

    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.id == vendor_id
        )
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found"
        )

    media = (
        db.query(VendorMedia)
        .filter(
            VendorMedia.vendor_id
            == vendor_id
        )
        .order_by(
            VendorMedia.id.desc()
        )
        .all()
    )

    return {
        "count": len(media),
        "vendor_id": vendor.id,

        "media": [
            {
                "id": item.id,
                "vendor_id": item.vendor_id,
                "media_type": item.media_type,
                "file_url": item.file_url,
                "created_at": item.created_at
            }
            for item in media
        ]
    }


# =========================================================
# INCREASE PROFILE VIEW
#
# POST /vendors/{vendor_id}/view
# =========================================================

@router.post("/{vendor_id}/view")
def register_vendor_profile_view(
    vendor_id: int,
    db: Session = Depends(get_db)
):

    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.id == vendor_id
        )
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found"
        )

    vendor.profile_views = (
        vendor.profile_views or 0
    ) + 1

    db.commit()
    db.refresh(vendor)

    return {
        "message": "Profile view registered successfully",
        "vendor_id": vendor.id,
        "profile_views": vendor.profile_views
    }


# =========================================================
# GET SINGLE VENDOR BY ID
# =========================================================

@router.get("/{vendor_id}")
def get_vendor_by_id(
    vendor_id: int,
    db: Session = Depends(get_db)
):

    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.id == vendor_id
        )
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found"
        )

    return {
        "vendor": {
            "id": vendor.id,
            "user_id": vendor.user_id,
            "business_name": vendor.business_name,
            "category": vendor.category,
            "phone": vendor.phone,
            "address": vendor.address,
            "state": vendor.state,
            "district": vendor.district,
            "area": vendor.area,
            "pincode": vendor.pincode,
            "description": vendor.description,
            "is_verified": vendor.is_verified,
            "profile_views": vendor.profile_views
        }
    }