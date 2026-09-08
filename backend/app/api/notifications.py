from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.database import get_db
from app.models.notifications import Notification
from app.models.user import User
from app.core.security import get_current_user


router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_logged_in_user(current_user: dict, db: Session):
    user_id = int(current_user.get("sub"))

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


def notification_owner_filter(user: User):
    role = str(user.role).strip().lower()

    # Existing customer rows use customer_id.
    # New rows may also use recipient_user_id.
    if role == "customer":
        return or_(
            Notification.customer_id == user.id,
            Notification.recipient_user_id == user.id
        )

    # Vendor and admin use generic recipient_user_id.
    return Notification.recipient_user_id == user.id


@router.get("")
def get_notifications(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user = get_logged_in_user(current_user, db)

    notifications = (
        db.query(Notification)
        .filter(notification_owner_filter(user))
        .order_by(Notification.id.desc())
        .all()
    )

    unread_count = sum(1 for item in notifications if not item.is_read)

    return {
        "count": len(notifications),
        "unread_count": unread_count,
        "notifications": notifications
    }


@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user = get_logged_in_user(current_user, db)

    notifications = (
        db.query(Notification)
        .filter(
            notification_owner_filter(user),
            Notification.is_read == False
        )
        .all()
    )

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated_count": len(notifications)
    }


@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user = get_logged_in_user(current_user, db)

    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            notification_owner_filter(user)
        )
        .first()
    )

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return {
        "message": "Notification marked as read",
        "notification_id": notification.id,
        "is_read": notification.is_read
    }
