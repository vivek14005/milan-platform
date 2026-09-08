from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from sqlalchemy.orm import Session

from pydantic import BaseModel

from datetime import datetime, timezone

from typing import Optional

import os
import shutil
import uuid


from app.db.database import get_db

from app.models.vendor import Vendor
from app.models.user import User
from app.models.notifications import Notification

from app.models.vendor_verification import (
    VendorVerification
)

from app.models.vendor_verification_document import (
    VendorVerificationDocument
)

from app.core.security import get_current_user


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/vendor-verification",
    tags=["Vendor Verification"]
)


# =========================================================
# UPLOAD DIRECTORY
# =========================================================

VERIFICATION_UPLOAD_DIR = os.path.join(
    "uploads",
    "vendor_verification"
)

os.makedirs(
    VERIFICATION_UPLOAD_DIR,
    exist_ok=True
)


# =========================================================
# FILE SETTINGS
# =========================================================

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


DOCUMENT_TYPES = {
    "identity_proof",
    "self_photo",
    "gst_certificate",
    "electricity_bill"
}


GENERAL_ALLOWED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf"
}


SELF_PHOTO_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png"
}


# =========================================================
# PYDANTIC SCHEMA
# =========================================================

class VerificationSetup(BaseModel):

    has_gst: bool

    gst_number: Optional[str] = None


# =========================================================
# CURRENT VENDOR HELPER
# =========================================================

def get_current_vendor(
    current_user: dict,
    db: Session
):

    role = (
        current_user
        .get("role", "")
        .strip()
        .lower()
    )

    if role != "vendor":

        raise HTTPException(
            status_code=403,
            detail="Only vendors can access verification."
        )


    user_id = current_user.get("sub")

    if not user_id:

        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )


    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.user_id == int(user_id)
        )
        .first()
    )


    if not vendor:

        raise HTTPException(
            status_code=404,
            detail="Vendor profile not found."
        )


    return vendor


# =========================================================
# SERIALIZE DOCUMENT
# =========================================================

def document_response(document):

    return {
        "id": document.id,
        "document_type": document.document_type,
        "file_url": document.file_url,
        "original_filename": document.original_filename,
        "uploaded_at": document.uploaded_at
    }


# =========================================================
# SERIALIZE VERIFICATION
# =========================================================

def verification_response(
    verification
):

    documents = [
        document_response(document)
        for document in verification.documents
    ]


    uploaded_types = {
        document.document_type
        for document in verification.documents
    }


    required_documents = [
        "identity_proof",
        "self_photo"
    ]


    if verification.has_gst:

        required_documents.append(
            "gst_certificate"
        )

    else:

        required_documents.append(
            "electricity_bill"
        )


    missing_documents = [
        document_type
        for document_type in required_documents
        if document_type not in uploaded_types
    ]


    return {
        "id": verification.id,

        "vendor_id":
            verification.vendor_id,

        "has_gst":
            verification.has_gst,

        "gst_number":
            verification.gst_number,

        "status":
            verification.status,

        "admin_note":
            verification.admin_note,

        "submitted_at":
            verification.submitted_at,

        "reviewed_at":
            verification.reviewed_at,

        "created_at":
            verification.created_at,

        "documents":
            documents,

        "required_documents":
            required_documents,

        "missing_documents":
            missing_documents,

        "ready_to_submit":
            len(missing_documents) == 0
    }


# =========================================================
# CREATE / UPDATE VERIFICATION SETUP
# =========================================================

@router.post("/setup")
def setup_verification(
    verification_data: VerificationSetup,

    current_user: dict = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )
):

    vendor = get_current_vendor(
        current_user,
        db
    )


    verification = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.vendor_id
            == vendor.id
        )
        .first()
    )


    # =====================================================
    # ALREADY APPROVED
    # =====================================================

    if (
        verification
        and verification.status == "approved"
    ):

        raise HTTPException(
            status_code=409,
            detail="Your vendor account is already verified."
        )


    # =====================================================
    # PENDING REQUEST CANNOT BE EDITED
    # =====================================================

    if (
        verification
        and verification.status == "pending"
    ):

        raise HTTPException(
            status_code=409,
            detail=(
                "Verification is under review. "
                "You cannot change details right now."
            )
        )


    gst_number = None


    # =====================================================
    # GST VALIDATION
    # =====================================================

    if verification_data.has_gst:

        if not verification_data.gst_number:

            raise HTTPException(
                status_code=400,
                detail="GST number is required."
            )


        gst_number = (
            verification_data
            .gst_number
            .strip()
            .upper()
        )


        if len(gst_number) != 15:

            raise HTTPException(
                status_code=400,
                detail=(
                    "GST number must contain "
                    "exactly 15 characters."
                )
            )


    # =====================================================
    # CREATE VERIFICATION
    # =====================================================

    if not verification:

        verification = VendorVerification(
            vendor_id=vendor.id,

            has_gst=
                verification_data.has_gst,

            gst_number=
                gst_number,

            status="not_submitted"
        )


        db.add(verification)

        db.commit()

        db.refresh(verification)


        return {
            "message":
                "Verification setup created successfully.",

            "verification":
                verification_response(
                    verification
                )
        }


    # =====================================================
    # UPDATE EXISTING VERIFICATION
    # =====================================================

    old_has_gst = verification.has_gst


    verification.has_gst = (
        verification_data.has_gst
    )

    verification.gst_number = (
        gst_number
    )

    verification.status = (
        "not_submitted"
    )

    verification.admin_note = None

    verification.reviewed_at = None

    verification.submitted_at = None


    # =====================================================
    # GST OPTION CHANGED
    #
    # GST -> NO GST:
    # old GST certificate is not required
    #
    # NO GST -> GST:
    # old electricity bill is not required
    # =====================================================

    if old_has_gst != verification.has_gst:

        document_to_remove_type = (
            "electricity_bill"
            if verification.has_gst
            else "gst_certificate"
        )


        old_document = (
            db.query(
                VendorVerificationDocument
            )
            .filter(
                VendorVerificationDocument
                .verification_id
                == verification.id,

                VendorVerificationDocument
                .document_type
                == document_to_remove_type
            )
            .first()
        )


        if old_document:

            delete_uploaded_file(
                old_document.file_url
            )

            db.delete(
                old_document
            )


    db.commit()

    db.refresh(
        verification
    )


    return {
        "message":
            "Verification setup updated successfully.",

        "verification":
            verification_response(
                verification
            )
    }


# =========================================================
# DELETE FILE FROM SERVER HELPER
# =========================================================

def delete_uploaded_file(
    file_url
):

    if not file_url:

        return


    expected_prefix = (
        "/uploads/vendor_verification/"
    )


    if not file_url.startswith(
        expected_prefix
    ):

        return


    filename = os.path.basename(
        file_url
    )


    file_path = os.path.join(
        VERIFICATION_UPLOAD_DIR,
        filename
    )


    if os.path.exists(
        file_path
    ):

        try:

            os.remove(
                file_path
            )

        except OSError:

            pass


# =========================================================
# UPLOAD / REPLACE DOCUMENT
# =========================================================

@router.post(
    "/document/{document_type}"
)
async def upload_verification_document(
    document_type: str,

    file: UploadFile = File(...),

    current_user: dict = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )
):

    vendor = get_current_vendor(
        current_user,
        db
    )


    # =====================================================
    # DOCUMENT TYPE VALIDATION
    # =====================================================

    document_type = (
        document_type
        .strip()
        .lower()
    )


    if document_type not in DOCUMENT_TYPES:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid document type. "
                "Allowed types are: "
                "identity_proof, "
                "self_photo, "
                "gst_certificate, "
                "electricity_bill."
            )
        )


    # =====================================================
    # FIND VERIFICATION
    # =====================================================

    verification = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.vendor_id
            == vendor.id
        )
        .first()
    )


    if not verification:

        raise HTTPException(
            status_code=404,
            detail=(
                "Please complete verification setup first."
            )
        )


    # =====================================================
    # APPROVED / PENDING LOCK
    # =====================================================

    if verification.status == "approved":

        raise HTTPException(
            status_code=409,
            detail="Vendor is already verified."
        )


    if verification.status == "pending":

        raise HTTPException(
            status_code=409,
            detail=(
                "Verification is currently under review."
            )
        )


    # =====================================================
    # GST DOCUMENT RULE
    # =====================================================

    if (
        document_type == "gst_certificate"
        and not verification.has_gst
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "GST certificate is not required "
                "because GST is marked as unavailable."
            )
        )


    if (
        document_type == "electricity_bill"
        and verification.has_gst
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Electricity bill is not required "
                "because GST is available."
            )
        )


    # =====================================================
    # FILE NAME
    # =====================================================

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="Invalid file."
        )


    extension = (
        os.path.splitext(
            file.filename
        )[1]
        .lower()
    )


    # =====================================================
    # SELF PHOTO ONLY IMAGE
    # =====================================================

    if document_type == "self_photo":

        allowed_extensions = (
            SELF_PHOTO_EXTENSIONS
        )

    else:

        allowed_extensions = (
            GENERAL_ALLOWED_EXTENSIONS
        )


    if extension not in allowed_extensions:

        if document_type == "self_photo":

            raise HTTPException(
                status_code=400,
                detail=(
                    "Self photo must be "
                    "JPG, JPEG or PNG."
                )
            )

        raise HTTPException(
            status_code=400,
            detail=(
                "Document must be "
                "JPG, JPEG, PNG or PDF."
            )
        )


    # =====================================================
    # FILE SIZE
    # =====================================================

    file.file.seek(
        0,
        os.SEEK_END
    )


    file_size = (
        file.file.tell()
    )


    file.file.seek(0)


    if file_size <= 0:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )


    if file_size > MAX_FILE_SIZE:

        raise HTTPException(
            status_code=400,
            detail="File size cannot exceed 5 MB."
        )


    # =====================================================
    # UNIQUE FILE NAME
    # =====================================================

    unique_filename = (
        f"vendor_{vendor.id}_"
        f"{document_type}_"
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )


    file_path = os.path.join(
        VERIFICATION_UPLOAD_DIR,
        unique_filename
    )


    # =====================================================
    # SAVE FILE
    # =====================================================

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
            detail="Unable to save document."
        )


    finally:

        await file.close()


    file_url = (
        "/uploads/vendor_verification/"
        + unique_filename
    )


    # =====================================================
    # CHECK EXISTING DOCUMENT
    # =====================================================

    existing_document = (
        db.query(
            VendorVerificationDocument
        )
        .filter(
            VendorVerificationDocument
            .verification_id
            == verification.id,

            VendorVerificationDocument
            .document_type
            == document_type
        )
        .first()
    )


    # =====================================================
    # REPLACE EXISTING DOCUMENT
    # =====================================================

    if existing_document:

        old_file_url = (
            existing_document.file_url
        )


        existing_document.file_url = (
            file_url
        )

        existing_document.original_filename = (
            file.filename
        )


        db.commit()

        db.refresh(
            existing_document
        )


        delete_uploaded_file(
            old_file_url
        )


        return {
            "message":
                f"{document_type} replaced successfully.",

            "document":
                document_response(
                    existing_document
                ),

            "verification":
                verification_response(
                    verification
                )
        }


    # =====================================================
    # NEW DOCUMENT
    # =====================================================

    new_document = (
        VendorVerificationDocument(
            verification_id=
                verification.id,

            document_type=
                document_type,

            file_url=
                file_url,

            original_filename=
                file.filename
        )
    )


    db.add(
        new_document
    )

    db.commit()

    db.refresh(
        new_document
    )

    db.refresh(
        verification
    )


    return {
        "message":
            f"{document_type} uploaded successfully.",

        "document":
            document_response(
                new_document
            ),

        "verification":
            verification_response(
                verification
            )
    }


# =========================================================
# DELETE DOCUMENT
# =========================================================

@router.delete(
    "/document/{document_type}"
)
def delete_verification_document(
    document_type: str,

    current_user: dict = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )
):

    vendor = get_current_vendor(
        current_user,
        db
    )


    document_type = (
        document_type
        .strip()
        .lower()
    )


    verification = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.vendor_id
            == vendor.id
        )
        .first()
    )


    if not verification:

        raise HTTPException(
            status_code=404,
            detail="Verification setup not found."
        )


    if verification.status in {
        "pending",
        "approved"
    }:

        raise HTTPException(
            status_code=409,
            detail=(
                "Documents cannot be deleted "
                "while verification is under review "
                "or already approved."
            )
        )


    document = (
        db.query(
            VendorVerificationDocument
        )
        .filter(
            VendorVerificationDocument
            .verification_id
            == verification.id,

            VendorVerificationDocument
            .document_type
            == document_type
        )
        .first()
    )


    if not document:

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )


    file_url = (
        document.file_url
    )


    db.delete(
        document
    )

    db.commit()


    delete_uploaded_file(
        file_url
    )


    return {
        "message":
            "Document deleted successfully."
    }


# =========================================================
# SUBMIT VERIFICATION FOR ADMIN REVIEW
# =========================================================

@router.post("/submit")
def submit_verification(
    current_user: dict = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )
):

    vendor = get_current_vendor(
        current_user,
        db
    )


    verification = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.vendor_id
            == vendor.id
        )
        .first()
    )


    if not verification:

        raise HTTPException(
            status_code=404,
            detail=(
                "Please complete verification setup first."
            )
        )


    if verification.status == "approved":

        raise HTTPException(
            status_code=409,
            detail="Vendor is already verified."
        )


    if verification.status == "pending":

        raise HTTPException(
            status_code=409,
            detail=(
                "Verification request "
                "is already pending."
            )
        )


    # =====================================================
    # GST NUMBER VALIDATION
    # =====================================================

    if (
        verification.has_gst
        and not verification.gst_number
    ):

        raise HTTPException(
            status_code=400,
            detail="GST number is required."
        )


    uploaded_types = {
        document.document_type
        for document in verification.documents
    }


    required_documents = {
        "identity_proof",
        "self_photo"
    }


    if verification.has_gst:

        required_documents.add(
            "gst_certificate"
        )

    else:

        required_documents.add(
            "electricity_bill"
        )


    missing_documents = (
        required_documents
        - uploaded_types
    )


    if missing_documents:

        missing_names = ", ".join(
            sorted(
                missing_documents
            )
        )


        raise HTTPException(
            status_code=400,
            detail=(
                "Please upload all required documents. "
                f"Missing: {missing_names}"
            )
        )


    # =====================================================
    # SEND TO ADMIN
    # =====================================================

    verification.status = "pending"

    verification.submitted_at = (
        datetime.now(
            timezone.utc
        )
    )

    verification.reviewed_at = None

    verification.admin_note = None

    # =====================================================
    # NOTIFY ALL ADMINS ABOUT NEW VERIFICATION REQUEST
    # =====================================================
    admins = (
        db.query(User)
        .filter(User.role == "admin")
        .all()
    )

    vendor_name = (
        vendor.business_name
        if getattr(vendor, "business_name", None)
        else "Vendor"
    )

    for admin in admins:
        db.add(
            Notification(
                customer_id=None,
                recipient_user_id=admin.id,
                vendor_id=vendor.id,
                verification_id=verification.id,
                title="New Verification Request",
                message=f"{vendor_name} submitted a new verification request.",
                notification_type="verification_submitted",
                is_read=False
            )
        )

    db.commit()

    db.refresh(
        verification
    )


    return {
        "message":
            "Verification submitted for review successfully.",

        "verification":
            verification_response(
                verification
            )
    }


# =========================================================
# GET MY VERIFICATION
# =========================================================

@router.get("/me")
def get_my_verification(
    current_user: dict = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )
):

    vendor = get_current_vendor(
        current_user,
        db
    )


    verification = (
        db.query(VendorVerification)
        .filter(
            VendorVerification.vendor_id
            == vendor.id
        )
        .first()
    )


    if not verification:

        return {
            "has_verification": False,

            "is_verified":
                vendor.is_verified,

            "verification":
                None
        }


    return {
        "has_verification": True,

        "is_verified":
            vendor.is_verified,

        "verification":
            verification_response(
                verification
            )
    }   