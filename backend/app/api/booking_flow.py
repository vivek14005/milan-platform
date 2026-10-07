from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.booking_flow import (
    EnquiryConversationMessage,
    EnquiryNegotiationAction,
    EnquiryPriceNegotiation,
)
from app.models.enquiry import Enquiry
from app.models.notifications import Notification
from app.models.user import User
from app.models.vendor import Vendor
from app.schemas.booking_flow import (
    ConversationMessageCreate,
    PriceProposalCreate,
    PriceRejectionCreate,
)


router = APIRouter(
    prefix="/booking-flow",
    tags=["Booking Flow"],
)


# =========================================================
# RESPONSE HELPERS
# =========================================================

def message_response(message: EnquiryConversationMessage):
    return {
        "id": message.id,
        "enquiry_id": message.enquiry_id,
        "sender_user_id": message.sender_user_id,
        "sender_role": message.sender_role,
        "message": message.message,
        "created_at": message.created_at,
    }


def negotiation_response(negotiation: EnquiryPriceNegotiation | None):
    if negotiation is None:
        return None

    return {
        "id": negotiation.id,
        "enquiry_id": negotiation.enquiry_id,
        "current_price": negotiation.current_price,
        "final_price": negotiation.final_price,
        "last_proposed_by_user_id": (
            negotiation.last_proposed_by_user_id
        ),
        "last_proposed_by_role": (
            negotiation.last_proposed_by_role
        ),
        "customer_confirmed": negotiation.customer_confirmed,
        "vendor_confirmed": negotiation.vendor_confirmed,
        "status": negotiation.status,
        "rejected_by_user_id": negotiation.rejected_by_user_id,
        "rejection_reason": negotiation.rejection_reason,
        "created_at": negotiation.created_at,
        "updated_at": negotiation.updated_at,
        "finalized_at": negotiation.finalized_at,
        "price_locked": negotiation.final_price is not None,
    }


def action_response(action: EnquiryNegotiationAction):
    return {
        "id": action.id,
        "negotiation_id": action.negotiation_id,
        "enquiry_id": action.enquiry_id,
        "actor_user_id": action.actor_user_id,
        "actor_role": action.actor_role,
        "action_type": action.action_type,
        "amount": action.amount,
        "note": action.note,
        "created_at": action.created_at,
    }


# =========================================================
# ACCESS HELPERS
# Only the customer and vendor of an accepted enquiry can
# access its conversation and price negotiation.
# =========================================================

def get_enquiry_participant(
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

    enquiry_status = (
        str(enquiry.status).strip().lower()
        if enquiry.status
        else "pending"
    )

    if enquiry_status != "accepted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Conversation and price negotiation are available "
                "only after the vendor accepts the enquiry."
            ),
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
        participant_role = "customer"
    elif vendor.user_id == user_id:
        participant_role = "vendor"
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this enquiry.",
        )

    return enquiry, vendor, participant_role


def create_other_party_notification(
    db: Session,
    enquiry: Enquiry,
    vendor: Vendor,
    actor_role: str,
    title: str,
    message: str,
    notification_type: str,
):
    if actor_role == "customer":
        notification = Notification(
            customer_id=None,
            recipient_user_id=vendor.user_id,
            enquiry_id=enquiry.id,
            vendor_id=vendor.id,
            title=title,
            message=message,
            notification_type=notification_type,
            is_read=False,
        )
    else:
        notification = Notification(
            customer_id=enquiry.customer_id,
            recipient_user_id=None,
            enquiry_id=enquiry.id,
            vendor_id=vendor.id,
            title=title,
            message=message,
            notification_type=notification_type,
            is_read=False,
        )

    db.add(notification)


def get_locked_negotiation(
    enquiry_id: int,
    db: Session,
):
    return (
        db.query(EnquiryPriceNegotiation)
        .filter(
            EnquiryPriceNegotiation.enquiry_id == enquiry_id
        )
        .with_for_update()
        .first()
    )


def ensure_price_is_not_locked(
    negotiation: EnquiryPriceNegotiation,
):
    if (
        negotiation.final_price is not None
        or negotiation.status == "price_finalized"
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Final price is locked and cannot be changed.",
        )


# =========================================================
# GET COMPLETE ACCEPTED-ENQUIRY BOOKING FLOW
# GET /booking-flow/enquiries/{enquiry_id}
# =========================================================

@router.get("/enquiries/{enquiry_id}")
def get_booking_flow(
    enquiry_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user.get("sub"))

    enquiry, vendor, participant_role = get_enquiry_participant(
        enquiry_id=enquiry_id,
        user_id=user_id,
        db=db,
    )

    customer = (
        db.query(User)
        .filter(User.id == enquiry.customer_id)
        .first()
    )

    messages = (
        db.query(EnquiryConversationMessage)
        .filter(
            EnquiryConversationMessage.enquiry_id == enquiry.id
        )
        .order_by(
            EnquiryConversationMessage.id.asc()
        )
        .all()
    )

    negotiation = (
        db.query(EnquiryPriceNegotiation)
        .filter(
            EnquiryPriceNegotiation.enquiry_id == enquiry.id
        )
        .first()
    )

    actions = []

    if negotiation:
        actions = (
            db.query(EnquiryNegotiationAction)
            .filter(
                EnquiryNegotiationAction.negotiation_id
                == negotiation.id
            )
            .order_by(
                EnquiryNegotiationAction.id.asc()
            )
            .all()
        )

    return {
        "participant_role": participant_role,
        "enquiry": {
            "id": enquiry.id,
            "status": enquiry.status,
            "customer_id": enquiry.customer_id,
            "vendor_id": enquiry.vendor_id,
            "package_id": enquiry.package_id,
            "package_name": enquiry.package_name,
            "package_price": enquiry.package_price,
            "customer_name": enquiry.customer_name,
            "phone": enquiry.phone,
            "wedding_date": enquiry.wedding_date,
            "message": enquiry.message,
        },
        "customer": {
            "id": customer.id,
            "full_name": customer.full_name,
            "phone": customer.phone,
        } if customer else None,
        "vendor": {
            "id": vendor.id,
            "user_id": vendor.user_id,
            "business_name": vendor.business_name,
            "category": vendor.category,
            "phone": vendor.phone,
            "is_verified": vendor.is_verified,
        },
        "messages": [
            message_response(message)
            for message in messages
        ],
        "negotiation": negotiation_response(negotiation),
        "price_history": [
            action_response(action)
            for action in actions
        ],
    }


# =========================================================
# SEND CONVERSATION MESSAGE
# POST /booking-flow/enquiries/{enquiry_id}/messages
# =========================================================

@router.post("/enquiries/{enquiry_id}/messages")
def send_conversation_message(
    enquiry_id: int,
    message_data: ConversationMessageCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user.get("sub"))

    enquiry, vendor, participant_role = get_enquiry_participant(
        enquiry_id=enquiry_id,
        user_id=user_id,
        db=db,
    )

    new_message = EnquiryConversationMessage(
        enquiry_id=enquiry.id,
        sender_user_id=user_id,
        sender_role=participant_role,
        message=message_data.message,
    )

    db.add(new_message)

    sender_name = (
        enquiry.customer_name
        if participant_role == "customer"
        else vendor.business_name
    )

    create_other_party_notification(
        db=db,
        enquiry=enquiry,
        vendor=vendor,
        actor_role=participant_role,
        title="New Booking Message",
        message=f"{sender_name} sent you a new message.",
        notification_type="booking_message",
    )

    db.commit()
    db.refresh(new_message)

    return {
        "message": "Message sent successfully.",
        "conversation_message": message_response(new_message),
    }


# =========================================================
# PROPOSE OR EDIT PRICE
# Either participant can propose a new amount.
# A new proposal resets both previous confirmations.
# POST /booking-flow/enquiries/{enquiry_id}/price
# =========================================================

@router.post("/enquiries/{enquiry_id}/price")
def propose_or_edit_price(
    enquiry_id: int,
    price_data: PriceProposalCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user.get("sub"))

    enquiry, vendor, participant_role = get_enquiry_participant(
        enquiry_id=enquiry_id,
        user_id=user_id,
        db=db,
    )

    negotiation = get_locked_negotiation(
        enquiry_id=enquiry.id,
        db=db,
    )

    if negotiation is None:
        negotiation = EnquiryPriceNegotiation(
            enquiry_id=enquiry.id,
            status="negotiating",
        )
        db.add(negotiation)
        db.flush()
    else:
        ensure_price_is_not_locked(negotiation)

    negotiation.current_price = price_data.amount
    negotiation.last_proposed_by_user_id = user_id
    negotiation.last_proposed_by_role = participant_role
    negotiation.customer_confirmed = False
    negotiation.vendor_confirmed = False
    negotiation.status = "price_proposed"
    negotiation.rejected_by_user_id = None
    negotiation.rejection_reason = None

    action = EnquiryNegotiationAction(
        negotiation_id=negotiation.id,
        enquiry_id=enquiry.id,
        actor_user_id=user_id,
        actor_role=participant_role,
        action_type="price_proposed",
        amount=price_data.amount,
        note=price_data.note,
    )

    db.add(action)

    sender_name = (
        enquiry.customer_name
        if participant_role == "customer"
        else vendor.business_name
    )

    create_other_party_notification(
        db=db,
        enquiry=enquiry,
        vendor=vendor,
        actor_role=participant_role,
        title="New Price Proposed",
        message=(
            f"{sender_name} proposed a booking price of "
            f"₹{price_data.amount:,}."
        ),
        notification_type="price_proposed",
    )

    db.commit()
    db.refresh(negotiation)
    db.refresh(action)

    return {
        "message": "Price proposed successfully.",
        "negotiation": negotiation_response(negotiation),
        "history_item": action_response(action),
    }


# =========================================================
# CONFIRM CURRENT PRICE AS FINAL
# Both customer and vendor must confirm the same price.
# POST /booking-flow/enquiries/{enquiry_id}/price/final
# =========================================================

@router.post("/enquiries/{enquiry_id}/price/final")
def confirm_final_price(
    enquiry_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user.get("sub"))

    enquiry, vendor, participant_role = get_enquiry_participant(
        enquiry_id=enquiry_id,
        user_id=user_id,
        db=db,
    )

    negotiation = get_locked_negotiation(
        enquiry_id=enquiry.id,
        db=db,
    )

    if negotiation is None or negotiation.current_price is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No price has been proposed yet.",
        )

    ensure_price_is_not_locked(negotiation)

    if negotiation.status == "price_rejected":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This price was rejected. Propose a new price "
                "before confirming."
            ),
        )

    already_confirmed = (
        negotiation.customer_confirmed
        if participant_role == "customer"
        else negotiation.vendor_confirmed
    )

    if not already_confirmed:
        if participant_role == "customer":
            negotiation.customer_confirmed = True
        else:
            negotiation.vendor_confirmed = True

        confirmation_action = EnquiryNegotiationAction(
            negotiation_id=negotiation.id,
            enquiry_id=enquiry.id,
            actor_user_id=user_id,
            actor_role=participant_role,
            action_type="price_confirmed",
            amount=negotiation.current_price,
            note=None,
        )

        db.add(confirmation_action)

    both_confirmed = (
        negotiation.customer_confirmed
        and negotiation.vendor_confirmed
    )

    if both_confirmed:
        negotiation.final_price = negotiation.current_price
        negotiation.status = "price_finalized"
        negotiation.finalized_at = datetime.now(timezone.utc)

        final_action = EnquiryNegotiationAction(
            negotiation_id=negotiation.id,
            enquiry_id=enquiry.id,
            actor_user_id=user_id,
            actor_role=participant_role,
            action_type="price_finalized",
            amount=negotiation.final_price,
            note="Price confirmed by both customer and vendor.",
        )

        db.add(final_action)

        notification_title = "Final Price Confirmed"
        notification_message = (
            f"The booking price of ₹{negotiation.final_price:,} "
            "has been confirmed and locked."
        )
    else:
        negotiation.status = "awaiting_other_confirmation"

        confirmer_name = (
            enquiry.customer_name
            if participant_role == "customer"
            else vendor.business_name
        )

        notification_title = "Price Confirmation Required"
        notification_message = (
            f"{confirmer_name} confirmed ₹"
            f"{negotiation.current_price:,}. "
            "Please review and confirm the same price."
        )

    if not already_confirmed:
        create_other_party_notification(
            db=db,
            enquiry=enquiry,
            vendor=vendor,
            actor_role=participant_role,
            title=notification_title,
            message=notification_message,
            notification_type=(
                "price_finalized"
                if both_confirmed
                else "price_confirmation"
            ),
        )

    db.commit()
    db.refresh(negotiation)

    return {
        "message": (
            "Final price confirmed and locked."
            if both_confirmed
            else "Your confirmation has been saved."
        ),
        "waiting_for": (
            None
            if both_confirmed
            else (
                "vendor"
                if participant_role == "customer"
                else "customer"
            )
        ),
        "negotiation": negotiation_response(negotiation),
    }


# =========================================================
# REJECT CURRENT PRICE
# The enquiry remains accepted and a new price can be sent.
# POST /booking-flow/enquiries/{enquiry_id}/price/reject
# =========================================================

@router.post("/enquiries/{enquiry_id}/price/reject")
def reject_current_price(
    enquiry_id: int,
    rejection_data: PriceRejectionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user.get("sub"))

    enquiry, vendor, participant_role = get_enquiry_participant(
        enquiry_id=enquiry_id,
        user_id=user_id,
        db=db,
    )

    negotiation = get_locked_negotiation(
        enquiry_id=enquiry.id,
        db=db,
    )

    if negotiation is None or negotiation.current_price is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No price has been proposed yet.",
        )

    ensure_price_is_not_locked(negotiation)

    negotiation.status = "price_rejected"
    negotiation.customer_confirmed = False
    negotiation.vendor_confirmed = False
    negotiation.rejected_by_user_id = user_id
    negotiation.rejection_reason = rejection_data.reason

    action = EnquiryNegotiationAction(
        negotiation_id=negotiation.id,
        enquiry_id=enquiry.id,
        actor_user_id=user_id,
        actor_role=participant_role,
        action_type="price_rejected",
        amount=negotiation.current_price,
        note=rejection_data.reason,
    )

    db.add(action)

    rejector_name = (
        enquiry.customer_name
        if participant_role == "customer"
        else vendor.business_name
    )

    create_other_party_notification(
        db=db,
        enquiry=enquiry,
        vendor=vendor,
        actor_role=participant_role,
        title="Booking Price Rejected",
        message=(
            f"{rejector_name} rejected the proposed price of "
            f"₹{negotiation.current_price:,}. You can send a "
            "new price proposal."
        ),
        notification_type="price_rejected",
    )

    db.commit()
    db.refresh(negotiation)
    db.refresh(action)

    return {
        "message": (
            "Price rejected. A new price can still be proposed."
        ),
        "negotiation": negotiation_response(negotiation),
        "history_item": action_response(action),
    }
