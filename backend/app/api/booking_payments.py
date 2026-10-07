from datetime import datetime, timezone
from pathlib import Path
import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.booking_flow import EnquiryPriceNegotiation
from app.models.booking_payment import BookingPaymentProof
from app.models.enquiry import Enquiry
from app.models.notifications import Notification
from app.models.vendor import Vendor
from app.schemas.booking_payment import PaymentProofReject


router = APIRouter(
    prefix="/booking-payments",
    tags=["Booking Payments"],
)


UPLOAD_ROOT = Path("uploads") / "payment_proofs"
MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

ALLOWED_PAYMENT_TYPES = {
    "booking_amount",
    "full_payment",
    "remaining_payment",
}


def proof_response(proof: BookingPaymentProof):
    return {
        "id": proof.id,
        "enquiry_id": proof.enquiry_id,
        "customer_id": proof.customer_id,
        "vendor_id": proof.vendor_id,
        "final_price": proof.final_price,
        "paid_amount": proof.paid_amount,
        "payment_type": proof.payment_type,
        "transaction_reference": proof.transaction_reference,
        "proof_url": proof.proof_url,
        "status": proof.status,
        "rejection_reason": proof.rejection_reason,
        "created_at": proof.created_at,
        "reviewed_at": proof.reviewed_at,
    }


def get_participant(
    enquiry_id: int,
    user_id: int,
    db: Session,
):
    enquiry = (
        db.query(Enquiry)
        .filter(Enquiry.id == enquiry_id)
        .first()
    )

    if not enquiry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enquiry not found.",
        )

    if str(enquiry.status).strip().lower() != "accepted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment is available only for an accepted enquiry.",
        )

    vendor = (
        db.query(Vendor)
        .filter(Vendor.id == enquiry.vendor_id)
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found.",
        )

    if enquiry.customer_id == user_id:
        role = "customer"
    elif vendor.user_id == user_id:
        role = "vendor"
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this booking payment.",
        )

    negotiation = (
        db.query(EnquiryPriceNegotiation)
        .filter(EnquiryPriceNegotiation.enquiry_id == enquiry.id)
        .first()
    )

    if (
        negotiation is None
        or negotiation.final_price is None
        or negotiation.status != "price_finalized"
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Both sides must confirm and lock the final price first.",
        )

    return enquiry, vendor, negotiation, role


def payment_summary(
    enquiry_id: int,
    final_price: int,
    db: Session,
):
    proofs = (
        db.query(BookingPaymentProof)
        .filter(BookingPaymentProof.enquiry_id == enquiry_id)
        .order_by(BookingPaymentProof.id.desc())
        .all()
    )

    amount_received = sum(
        proof.paid_amount
        for proof in proofs
        if proof.status == "received"
    )

    pending_amount = sum(
        proof.paid_amount
        for proof in proofs
        if proof.status == "pending"
    )

    return {
        "final_price": final_price,
        "amount_received": amount_received,
        "pending_verification_amount": pending_amount,
        "remaining_amount": max(final_price - amount_received, 0),
        "payment_complete": amount_received >= final_price,
        "proofs": [proof_response(proof) for proof in proofs],
    }


@router.get("/enquiries/{enquiry_id}")
def get_booking_payment(
    enquiry_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user.get("sub"))

    enquiry, vendor, negotiation, role = get_participant(
        enquiry_id=enquiry_id,
        user_id=user_id,
        db=db,
    )

    return {
        "participant_role": role,
        "enquiry_id": enquiry.id,
        "vendor_id": vendor.id,
        **payment_summary(
            enquiry_id=enquiry.id,
            final_price=negotiation.final_price,
            db=db,
        ),
    }


@router.post("/enquiries/{enquiry_id}/proof")
async def upload_payment_proof(
    enquiry_id: int,
    paid_amount: int = Form(..., gt=0),
    payment_type: str = Form("booking_amount"),
    transaction_reference: str | None = Form(None),
    proof: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user.get("sub"))

    enquiry, vendor, negotiation, role = get_participant(
        enquiry_id=enquiry_id,
        user_id=user_id,
        db=db,
    )

    if role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the customer can upload payment proof.",
        )

    clean_payment_type = payment_type.strip().lower()

    if clean_payment_type not in ALLOWED_PAYMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment type.",
        )

    clean_reference = (
        transaction_reference.strip()
        if transaction_reference
        else None
    )

    if clean_reference and len(clean_reference) > 120:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction reference is too long.",
        )

    existing_pending = (
        db.query(BookingPaymentProof)
        .filter(
            BookingPaymentProof.enquiry_id == enquiry.id,
            BookingPaymentProof.status == "pending",
        )
        .first()
    )

    if existing_pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A payment proof is already waiting for vendor review.",
        )

    summary = payment_summary(
        enquiry_id=enquiry.id,
        final_price=negotiation.final_price,
        db=db,
    )

    if summary["payment_complete"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="The full booking amount is already marked as received.",
        )

    if paid_amount > summary["remaining_amount"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Paid amount cannot be greater than the remaining "
                f"amount of ₹{summary['remaining_amount']:,}."
            ),
        )

    content_type = (proof.content_type or "").lower()

    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG or WEBP payment screenshots are allowed.",
        )

    content = await proof.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected payment screenshot is empty.",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payment screenshot must be 5 MB or smaller.",
        )

    extension = ALLOWED_IMAGE_TYPES[content_type]
    filename = f"{uuid.uuid4().hex}{extension}"
    folder = UPLOAD_ROOT / str(enquiry.id)
    folder.mkdir(parents=True, exist_ok=True)
    file_path = folder / filename

    try:
        with open(file_path, "wb") as output:
            output.write(content)
    except OSError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save payment screenshot.",
        )

    new_proof = BookingPaymentProof(
        enquiry_id=enquiry.id,
        customer_id=enquiry.customer_id,
        vendor_id=vendor.id,
        final_price=negotiation.final_price,
        paid_amount=paid_amount,
        payment_type=clean_payment_type,
        transaction_reference=clean_reference,
        proof_url=(
            f"/uploads/payment_proofs/{enquiry.id}/{filename}"
        ),
        status="pending",
    )

    db.add(new_proof)
    db.add(
        Notification(
            customer_id=None,
            recipient_user_id=vendor.user_id,
            enquiry_id=enquiry.id,
            vendor_id=vendor.id,
            title="Payment Proof Submitted",
            message=(
                f"{enquiry.customer_name} submitted a payment proof "
                f"for ₹{paid_amount:,}."
            ),
            notification_type="payment_proof_submitted",
            is_read=False,
        )
    )

    try:
        db.commit()
        db.refresh(new_proof)
    except Exception:
        db.rollback()
        file_path.unlink(missing_ok=True)
        raise

    return {
        "message": "Payment proof submitted for vendor review.",
        "payment_proof": proof_response(new_proof),
    }


def get_vendor_proof(
    proof_id: int,
    user_id: int,
    db: Session,
):
    payment_proof = (
        db.query(BookingPaymentProof)
        .filter(BookingPaymentProof.id == proof_id)
        .with_for_update()
        .first()
    )

    if not payment_proof:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment proof not found.",
        )

    enquiry, vendor, negotiation, role = get_participant(
        enquiry_id=payment_proof.enquiry_id,
        user_id=user_id,
        db=db,
    )

    if role != "vendor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the enquiry vendor can review payment proof.",
        )

    if payment_proof.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This payment proof has already been reviewed.",
        )

    return payment_proof, enquiry, vendor, negotiation


@router.put("/proofs/{proof_id}/received")
def mark_payment_received(
    proof_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user.get("sub"))

    payment_proof, enquiry, vendor, negotiation = get_vendor_proof(
        proof_id=proof_id,
        user_id=user_id,
        db=db,
    )

    payment_proof.status = "received"
    payment_proof.rejection_reason = None
    payment_proof.reviewed_at = datetime.now(timezone.utc)

    db.add(
        Notification(
            customer_id=enquiry.customer_id,
            recipient_user_id=None,
            enquiry_id=enquiry.id,
            vendor_id=vendor.id,
            title="Payment Confirmed",
            message=(
                f"{vendor.business_name} confirmed receiving "
                f"₹{payment_proof.paid_amount:,}."
            ),
            notification_type="payment_received",
            is_read=False,
        )
    )

    db.commit()
    db.refresh(payment_proof)

    return {
        "message": "Payment marked as received.",
        "payment_proof": proof_response(payment_proof),
        "summary": payment_summary(
            enquiry_id=enquiry.id,
            final_price=negotiation.final_price,
            db=db,
        ),
    }


@router.put("/proofs/{proof_id}/reject")
def reject_payment_proof(
    proof_id: int,
    rejection: PaymentProofReject,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user.get("sub"))

    payment_proof, enquiry, vendor, negotiation = get_vendor_proof(
        proof_id=proof_id,
        user_id=user_id,
        db=db,
    )

    payment_proof.status = "rejected"
    payment_proof.rejection_reason = rejection.reason
    payment_proof.reviewed_at = datetime.now(timezone.utc)

    db.add(
        Notification(
            customer_id=enquiry.customer_id,
            recipient_user_id=None,
            enquiry_id=enquiry.id,
            vendor_id=vendor.id,
            title="Payment Proof Rejected",
            message=(
                f"{vendor.business_name} rejected your payment proof. "
                f"Reason: {rejection.reason}"
            ),
            notification_type="payment_rejected",
            is_read=False,
        )
    )

    db.commit()
    db.refresh(payment_proof)

    return {
        "message": "Payment proof rejected.",
        "payment_proof": proof_response(payment_proof),
        "summary": payment_summary(
            enquiry_id=enquiry.id,
            final_price=negotiation.final_price,
            db=db,
        ),
    }
