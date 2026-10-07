from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.enquiry import Enquiry
from app.models.notifications import Notification
from app.models.user import User
from app.models.vendor import Vendor
from app.models.vendor_package import VendorPackage
from app.schemas.enquiry import (
    EnquiryCreate,
    EnquiryStatusUpdate,
)


router = APIRouter(
    prefix="/enquiries",
    tags=["Enquiries"]
)


# =========================================================
# PACKAGE RESPONSE
# Keeps package name and price available even if the
# original vendor package is changed or deleted later.
# =========================================================

def enquiry_package_response(enquiry: Enquiry):
    if not enquiry.package_name:
        return None

    return {
        "id": enquiry.package_id,
        "name": enquiry.package_name,
        "price": enquiry.package_price,
    }


# =========================================================
# ENQUIRY RESPONSE
# =========================================================

def enquiry_response(enquiry: Enquiry):
    return {
        "id": enquiry.id,
        "customer_id": enquiry.customer_id,
        "vendor_id": enquiry.vendor_id,
        "package_id": enquiry.package_id,
        "package_name": enquiry.package_name,
        "package_price": enquiry.package_price,
        "package": enquiry_package_response(enquiry),
        "customer_name": enquiry.customer_name,
        "phone": enquiry.phone,
        "wedding_date": enquiry.wedding_date,
        "message": enquiry.message,
        "status": enquiry.status,
    }


# =========================================================
# CREATE CUSTOMER ENQUIRY
# POST /enquiries
# =========================================================

@router.post("")
def create_enquiry(
    enquiry: EnquiryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    customer_id = int(current_user.get("sub"))

    customer = (
        db.query(User)
        .filter(User.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if str(customer.role).strip().lower() != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can send enquiries"
        )

    vendor = (
        db.query(Vendor)
        .filter(Vendor.id == enquiry.vendor_id)
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found"
        )

    selected_package = None

    if enquiry.package_id is not None:
        selected_package = (
            db.query(VendorPackage)
            .filter(
                VendorPackage.id == enquiry.package_id,
                VendorPackage.vendor_id == vendor.id,
                VendorPackage.is_active.is_(True)
            )
            .first()
        )

        if not selected_package:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Selected package is unavailable "
                    "for this vendor."
                )
            )

    new_enquiry = Enquiry(
        customer_id=customer_id,
        vendor_id=vendor.id,

        package_id=(
            selected_package.id
            if selected_package
            else None
        ),

        package_name=(
            selected_package.name
            if selected_package
            else None
        ),

        package_price=(
            selected_package.price
            if selected_package
            else None
        ),

        customer_name=enquiry.customer_name.strip(),
        phone=enquiry.phone.strip(),

        wedding_date=(
            enquiry.wedding_date.strip()
            if enquiry.wedding_date
            else None
        ),

        message=(
            enquiry.message.strip()
            if enquiry.message
            else None
        ),

        status="pending"
    )

    db.add(new_enquiry)
    db.flush()

    notification_message = (
        f"{new_enquiry.customer_name} sent a new wedding enquiry"
    )

    if new_enquiry.package_name:
        notification_message += (
            f" for the {new_enquiry.package_name} package"
        )

    if new_enquiry.wedding_date:
        notification_message += (
            f" for {new_enquiry.wedding_date}."
        )
    else:
        notification_message += "."

    vendor_notification = Notification(
        customer_id=None,
        recipient_user_id=vendor.user_id,
        enquiry_id=new_enquiry.id,
        vendor_id=vendor.id,
        title="New Enquiry Received 💌",
        message=notification_message,
        notification_type="new_enquiry",
        is_read=False
    )

    db.add(vendor_notification)

    db.commit()
    db.refresh(new_enquiry)

    return {
        "message": "Enquiry sent successfully",
        "enquiry": enquiry_response(new_enquiry)
    }


# =========================================================
# GET LOGGED-IN CUSTOMER ENQUIRIES
# GET /enquiries/customer/me
# =========================================================

@router.get("/customer/me")
def get_customer_enquiries(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    customer_id = int(current_user.get("sub"))

    customer = (
        db.query(User)
        .filter(User.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    if str(customer.role).strip().lower() != "customer":
        raise HTTPException(
            status_code=403,
            detail=(
                "Only customers can view "
                "customer enquiries"
            )
        )

    enquiries = (
        db.query(Enquiry)
        .filter(
            Enquiry.customer_id == customer_id
        )
        .order_by(
            Enquiry.id.desc()
        )
        .all()
    )

    enquiry_list = []

    for enquiry in enquiries:
        vendor = (
            db.query(Vendor)
            .filter(
                Vendor.id == enquiry.vendor_id
            )
            .first()
        )

        enquiry_item = enquiry_response(enquiry)

        enquiry_item["vendor"] = (
            {
                "id": vendor.id,
                "business_name": vendor.business_name,
                "category": vendor.category,
                "phone": vendor.phone,
                "state": vendor.state,
                "district": vendor.district,
                "area": vendor.area,
                "pincode": vendor.pincode,
                "address": vendor.address,
                "is_verified": vendor.is_verified,
            }
            if vendor
            else None
        )

        enquiry_list.append(enquiry_item)

    return {
        "count": len(enquiry_list),
        "customer_id": customer_id,
        "enquiries": enquiry_list
    }


# =========================================================
# GET LOGGED-IN VENDOR ENQUIRIES
# GET /enquiries/vendor
# =========================================================

@router.get("/vendor")
def get_vendor_enquiries(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user.get("sub"))

    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.user_id == user_id
        )
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor profile not found"
        )

    enquiries = (
        db.query(Enquiry)
        .filter(
            Enquiry.vendor_id == vendor.id
        )
        .order_by(
            Enquiry.id.desc()
        )
        .all()
    )

    return {
        "count": len(enquiries),
        "vendor_id": vendor.id,
        "enquiries": [
            enquiry_response(enquiry)
            for enquiry in enquiries
        ]
    }


# =========================================================
# UPDATE ENQUIRY STATUS
# PUT /enquiries/{enquiry_id}/status
# =========================================================

@router.put("/{enquiry_id}/status")
def update_enquiry_status(
    enquiry_id: int,
    status_data: EnquiryStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user.get("sub"))

    vendor = (
        db.query(Vendor)
        .filter(
            Vendor.user_id == user_id
        )
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor profile not found"
        )

    enquiry = (
        db.query(Enquiry)
        .filter(
            Enquiry.id == enquiry_id,
            Enquiry.vendor_id == vendor.id
        )
        .first()
    )

    if not enquiry:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found"
        )

    new_status = (
        status_data.status
        .strip()
        .lower()
    )

    allowed_statuses = [
        "pending",
        "accepted",
        "rejected",
        "completed",
    ]

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid enquiry status"
        )

    old_status = (
        enquiry.status.strip().lower()
        if enquiry.status
        else "pending"
    )

    enquiry.status = new_status

    if old_status != new_status:
        status_titles = {
            "accepted": "Enquiry Accepted 🎉",
            "rejected": "Enquiry Rejected",
            "completed": "Enquiry Completed",
            "pending": "Enquiry Status Updated",
        }

        vendor_name = (
            vendor.business_name
            if vendor.business_name
            else "Vendor"
        )

        notification = Notification(
            customer_id=enquiry.customer_id,
            recipient_user_id=None,
            enquiry_id=enquiry.id,
            vendor_id=vendor.id,

            title=status_titles.get(
                new_status,
                "Enquiry Status Updated"
            ),

            message=(
                f"{vendor_name} changed your wedding "
                f"enquiry status to {new_status}."
            ),

            notification_type="enquiry_status",
            is_read=False
        )

        db.add(notification)

    db.commit()
    db.refresh(enquiry)

    return {
        "message": "Enquiry status updated successfully",
        "enquiry": enquiry_response(enquiry)
    }