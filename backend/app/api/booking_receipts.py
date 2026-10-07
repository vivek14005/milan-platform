from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.booking_payments import get_participant, payment_summary
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User


router = APIRouter(
    prefix="/booking-receipts",
    tags=["Booking Receipts"],
)


def payment_label(payment_type: str) -> str:
    labels = {
        "booking_amount": "Booking / Advance Amount",
        "remaining_payment": "Remaining Payment",
        "full_payment": "Full Payment",
    }

    return labels.get(
        str(payment_type or "").strip().lower(),
        "Payment",
    )


@router.get("/enquiries/{enquiry_id}")
def get_booking_receipt(
    enquiry_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user.get("sub"))

    enquiry, vendor, negotiation, participant_role = get_participant(
        enquiry_id=enquiry_id,
        user_id=user_id,
        db=db,
    )

    customer = (
        db.query(User)
        .filter(User.id == enquiry.customer_id)
        .first()
    )

    vendor_user = (
        db.query(User)
        .filter(User.id == vendor.user_id)
        .first()
    )

    summary = payment_summary(
        enquiry_id=enquiry.id,
        final_price=negotiation.final_price,
        db=db,
    )

    received_payments = [
        {
            "id": proof["id"],
            "amount": proof["paid_amount"],
            "payment_type": proof["payment_type"],
            "payment_label": payment_label(proof["payment_type"]),
            "transaction_reference": proof["transaction_reference"],
            "proof_url": proof["proof_url"],
            "status": proof["status"],
            "paid_at": proof["created_at"],
            "verified_at": proof["reviewed_at"],
        }
        for proof in summary["proofs"]
        if proof["status"] == "received"
    ]

    if summary["payment_complete"]:
        payment_status = "paid"
        payment_status_label = "Payment Complete"
    elif summary["amount_received"] > 0:
        payment_status = "partially_paid"
        payment_status_label = "Partially Paid"
    else:
        payment_status = "payment_pending"
        payment_status_label = "Payment Pending"

    return {
        "receipt_number": f"MILAN-{enquiry.id:06d}",
        "generated_at": datetime.now(timezone.utc),
        "participant_role": participant_role,
        "booking_status": enquiry.status,
        "payment_status": payment_status,
        "payment_status_label": payment_status_label,
        "enquiry": {
            "id": enquiry.id,
            "wedding_date": enquiry.wedding_date,
            "package_id": enquiry.package_id,
            "package_name": enquiry.package_name,
            "package_price": enquiry.package_price,
            "message": enquiry.message,
        },
        "customer": {
            "id": enquiry.customer_id,
            "full_name": (
                customer.full_name
                if customer and customer.full_name
                else enquiry.customer_name
            ),
            "email": customer.email if customer else None,
            "phone": enquiry.phone or (
                customer.phone if customer else None
            ),
        },
        "vendor": {
            "id": vendor.id,
            "business_name": vendor.business_name,
            "category": vendor.category,
            "phone": vendor.phone,
            "email": vendor_user.email if vendor_user else None,
            "address": vendor.address,
            "area": vendor.area,
            "district": vendor.district,
            "state": vendor.state,
            "pincode": vendor.pincode,
            "is_verified": vendor.is_verified,
        },
        "price": {
            "package_price": enquiry.package_price,
            "final_price": negotiation.final_price,
            "amount_received": summary["amount_received"],
            "pending_verification_amount": summary[
                "pending_verification_amount"
            ],
            "remaining_amount": summary["remaining_amount"],
            "payment_complete": summary["payment_complete"],
        },
        "payments": received_payments,
        "notice": (
            "This receipt records payment information confirmed by the "
            "vendor. Milan does not process or hold customer funds."
        ),
    }
