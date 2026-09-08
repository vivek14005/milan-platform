from app.models.notifications import Notification
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.enquiry import Enquiry
from app.models.vendor import Vendor
from app.models.user import User
from app.schemas.enquiry import EnquiryCreate, EnquiryStatusUpdate
from app.core.security import get_current_user


router = APIRouter(prefix="/enquiries", tags=["Enquiries"])


@router.post("")
def create_enquiry(
    enquiry: EnquiryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    customer_id = int(current_user.get("sub"))
    customer = db.query(User).filter(User.id == customer_id).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if str(customer.role).strip().lower() != "customer":
        raise HTTPException(status_code=403, detail="Only customers can send enquiries")

    vendor = db.query(Vendor).filter(Vendor.id == enquiry.vendor_id).first()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    new_enquiry = Enquiry(
        customer_id=customer_id,
        vendor_id=enquiry.vendor_id,
        customer_name=enquiry.customer_name.strip(),
        phone=enquiry.phone.strip(),
        wedding_date=enquiry.wedding_date.strip() if enquiry.wedding_date else None,
        message=enquiry.message.strip() if enquiry.message else None,
        status="pending"
    )

    db.add(new_enquiry)
    db.flush()

    # NEW: vendor receives a notification immediately.
    vendor_notification = Notification(
        customer_id=None,
        recipient_user_id=vendor.user_id,
        enquiry_id=new_enquiry.id,
        vendor_id=vendor.id,
        title="New Enquiry Received 💌",
        message=(
            f"{new_enquiry.customer_name} sent a new wedding enquiry"
            + (f" for {new_enquiry.wedding_date}." if new_enquiry.wedding_date else ".")
        ),
        notification_type="new_enquiry",
        is_read=False
    )
    db.add(vendor_notification)

    db.commit()
    db.refresh(new_enquiry)

    return {
        "message": "Enquiry sent successfully",
        "enquiry": {
            "id": new_enquiry.id,
            "customer_id": new_enquiry.customer_id,
            "vendor_id": new_enquiry.vendor_id,
            "customer_name": new_enquiry.customer_name,
            "phone": new_enquiry.phone,
            "wedding_date": new_enquiry.wedding_date,
            "message": new_enquiry.message,
            "status": new_enquiry.status
        }
    }


@router.get("/customer/me")
def get_customer_enquiries(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    customer_id = int(current_user.get("sub"))
    customer = db.query(User).filter(User.id == customer_id).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    if str(customer.role).strip().lower() != "customer":
        raise HTTPException(status_code=403, detail="Only customers can view customer enquiries")

    enquiries = (
        db.query(Enquiry)
        .filter(Enquiry.customer_id == customer_id)
        .order_by(Enquiry.id.desc())
        .all()
    )

    enquiry_list = []
    for enquiry in enquiries:
        vendor = db.query(Vendor).filter(Vendor.id == enquiry.vendor_id).first()
        enquiry_list.append({
            "id": enquiry.id,
            "customer_id": enquiry.customer_id,
            "vendor_id": enquiry.vendor_id,
            "customer_name": enquiry.customer_name,
            "phone": enquiry.phone,
            "wedding_date": enquiry.wedding_date,
            "message": enquiry.message,
            "status": enquiry.status,
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
                "is_verified": vendor.is_verified
            } if vendor else None
        })

    return {
        "count": len(enquiry_list),
        "customer_id": customer_id,
        "enquiries": enquiry_list
    }


@router.get("/vendor")
def get_vendor_enquiries(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user.get("sub"))
    vendor = db.query(Vendor).filter(Vendor.user_id == user_id).first()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    enquiries = (
        db.query(Enquiry)
        .filter(Enquiry.vendor_id == vendor.id)
        .order_by(Enquiry.id.desc())
        .all()
    )

    return {
        "count": len(enquiries),
        "vendor_id": vendor.id,
        "enquiries": enquiries
    }


@router.put("/{enquiry_id}/status")
def update_enquiry_status(
    enquiry_id: int,
    status_data: EnquiryStatusUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = int(current_user.get("sub"))
    vendor = db.query(Vendor).filter(Vendor.user_id == user_id).first()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    enquiry = (
        db.query(Enquiry)
        .filter(Enquiry.id == enquiry_id, Enquiry.vendor_id == vendor.id)
        .first()
    )

    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    new_status = status_data.status.strip().lower()
    allowed_statuses = ["pending", "accepted", "rejected", "completed"]

    if new_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid enquiry status")

    old_status = enquiry.status.strip().lower() if enquiry.status else "pending"
    enquiry.status = new_status

    # Existing customer notification preserved.
    if old_status != new_status:
        status_titles = {
            "accepted": "Enquiry Accepted 🎉",
            "rejected": "Enquiry Rejected",
            "completed": "Enquiry Completed",
            "pending": "Enquiry Status Updated"
        }

        vendor_name = vendor.business_name if vendor.business_name else "Vendor"

        notification = Notification(
            customer_id=enquiry.customer_id,
            recipient_user_id=None,
            enquiry_id=enquiry.id,
            vendor_id=vendor.id,
            title=status_titles.get(new_status, "Enquiry Status Updated"),
            message=f"{vendor_name} changed your wedding enquiry status to {new_status}.",
            notification_type="enquiry_status",
            is_read=False
        )
        db.add(notification)

    db.commit()
    db.refresh(enquiry)

    return {
        "message": "Enquiry status updated successfully",
        "enquiry": {
            "id": enquiry.id,
            "customer_id": enquiry.customer_id,
            "vendor_id": enquiry.vendor_id,
            "customer_name": enquiry.customer_name,
            "phone": enquiry.phone,
            "wedding_date": enquiry.wedding_date,
            "message": enquiry.message,
            "status": enquiry.status
        }
    }
