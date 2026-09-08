from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from typing import Optional

from app.db.database import get_db
from app.models.review import Review
from app.models.vendor import Vendor
from app.models.user import User
from app.core.security import get_current_user


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)


# =========================================================
# SCHEMAS
# =========================================================

class ReviewCreate(BaseModel):
    rating: int = Field(
        ...,
        ge=1,
        le=5
    )

    review_text: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(
        None,
        ge=1,
        le=5
    )

    review_text: Optional[str] = None


# =========================================================
# CREATE REVIEW
# =========================================================

@router.post("/{vendor_id}")
def create_review(
    vendor_id: int,
    review: ReviewCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # -----------------------------------------------------
    # ONLY CUSTOMER CAN REVIEW
    # -----------------------------------------------------

    role = (
        current_user
        .get("role", "")
        .strip()
        .lower()
    )

    if role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can submit reviews."
        )


    # -----------------------------------------------------
    # GET CUSTOMER ID
    # -----------------------------------------------------

    customer_id = current_user.get("sub")

    if not customer_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )

    customer_id = int(customer_id)


    # -----------------------------------------------------
    # CHECK VENDOR
    # -----------------------------------------------------

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
            detail="Vendor not found."
        )


    # -----------------------------------------------------
    # CHECK DUPLICATE REVIEW
    # -----------------------------------------------------

    existing_review = (
        db.query(Review)
        .filter(
            Review.customer_id == customer_id,
            Review.vendor_id == vendor_id
        )
        .first()
    )

    if existing_review:
        raise HTTPException(
            status_code=409,
            detail="You have already reviewed this vendor."
        )


    # -----------------------------------------------------
    # CLEAN REVIEW TEXT
    # -----------------------------------------------------

    clean_review_text = None

    if review.review_text is not None:

        clean_review_text = (
            review.review_text.strip()
            or None
        )


    # -----------------------------------------------------
    # CREATE REVIEW
    # -----------------------------------------------------

    new_review = Review(
        customer_id=customer_id,
        vendor_id=vendor_id,
        rating=review.rating,
        review_text=clean_review_text
    )

    db.add(new_review)

    db.commit()

    db.refresh(new_review)


    return {
        "message":
            "Review submitted successfully.",

        "review": {
            "id":
                new_review.id,

            "customer_id":
                new_review.customer_id,

            "vendor_id":
                new_review.vendor_id,

            "rating":
                new_review.rating,

            "review_text":
                new_review.review_text,

            "created_at":
                new_review.created_at
        }
    }


# =========================================================
# GET VENDOR REVIEWS
# =========================================================

@router.get("/vendor/{vendor_id}")
def get_vendor_reviews(
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
            detail="Vendor not found."
        )


    reviews = (
        db.query(
            Review,
            User.full_name
        )
        .join(
            User,
            User.id == Review.customer_id
        )
        .filter(
            Review.vendor_id == vendor_id
        )
        .order_by(
            Review.created_at.desc()
        )
        .all()
    )


    result = []

    for review, customer_name in reviews:

        result.append({
            "id":
                review.id,

            "customer_id":
                review.customer_id,

            "customer_name":
                customer_name,

            "vendor_id":
                review.vendor_id,

            "rating":
                review.rating,

            "review_text":
                review.review_text,

            "created_at":
                review.created_at
        })


    return {
        "count":
            len(result),

        "reviews":
            result
    }


# =========================================================
# REVIEW SUMMARY
# =========================================================

@router.get("/vendor/{vendor_id}/summary")
def get_review_summary(
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
            detail="Vendor not found."
        )


    summary = (
        db.query(
            func.count(Review.id),
            func.avg(Review.rating)
        )
        .filter(
            Review.vendor_id == vendor_id
        )
        .first()
    )


    total_reviews = (
        summary[0]
        if summary
        else 0
    )

    average_rating = (
        float(summary[1])
        if summary and summary[1] is not None
        else 0
    )


    return {
        "vendor_id":
            vendor_id,

        "average_rating":
            round(
                average_rating,
                1
            ),

        "total_reviews":
            total_reviews
    }


# =========================================================
# UPDATE REVIEW
# =========================================================

@router.put("/{review_id}")
def update_review(
    review_id: int,
    review_data: ReviewUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    role = (
        current_user
        .get("role", "")
        .strip()
        .lower()
    )

    if role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can update reviews."
        )


    customer_id = current_user.get("sub")

    if not customer_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )

    customer_id = int(customer_id)


    review = (
        db.query(Review)
        .filter(
            Review.id == review_id
        )
        .first()
    )

    if not review:
        raise HTTPException(
            status_code=404,
            detail="Review not found."
        )


    if review.customer_id != customer_id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own review."
        )


    if review_data.rating is not None:
        review.rating = review_data.rating


    if review_data.review_text is not None:

        review.review_text = (
            review_data.review_text.strip()
            or None
        )


    db.commit()

    db.refresh(review)


    return {
        "message":
            "Review updated successfully.",

        "review": {
            "id":
                review.id,

            "vendor_id":
                review.vendor_id,

            "rating":
                review.rating,

            "review_text":
                review.review_text,

            "created_at":
                review.created_at
        }
    }


# =========================================================
# DELETE REVIEW
# =========================================================

@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    role = (
        current_user
        .get("role", "")
        .strip()
        .lower()
    )

    if role != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can delete reviews."
        )


    customer_id = current_user.get("sub")

    if not customer_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )

    customer_id = int(customer_id)


    review = (
        db.query(Review)
        .filter(
            Review.id == review_id
        )
        .first()
    )

    if not review:
        raise HTTPException(
            status_code=404,
            detail="Review not found."
        )


    if review.customer_id != customer_id:
        raise HTTPException(
            status_code=403,
            detail="You can only delete your own review."
        )


    db.delete(review)

    db.commit()


    return {
        "message":
            "Review deleted successfully."
    }