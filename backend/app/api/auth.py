from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserProfileUpdate
)
from app.services.auth_service import (
    hash_password,
    verify_password
)
from app.core.security import (
    create_access_token,
    get_current_user
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):

    clean_email = user.email.strip().lower()
    clean_phone = user.phone.strip()
    clean_name = user.full_name.strip()

    # =====================================================
    # CHECK DUPLICATE EMAIL
    # =====================================================

    existing_email = (
        db.query(User)
        .filter(
            func.lower(
                func.trim(User.email)
            ) == clean_email
        )
        .first()
    )

    if existing_email:
        return {
            "message":
                "This email is already registered. Please login instead."
        }

    # =====================================================
    # CHECK DUPLICATE PHONE
    # =====================================================

    existing_phone = (
        db.query(User)
        .filter(
            func.trim(User.phone) == clean_phone
        )
        .first()
    )

    if existing_phone:
        return {
            "message":
                "This phone number is already registered."
        }

    # =====================================================
    # CREATE NEW USER
    # =====================================================

    new_user = User(
        full_name=clean_name,
        email=clean_email,
        phone=clean_phone,
        password=hash_password(
            user.password
        ),
        role=user.role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message":
            "User Registered Successfully"
    }


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):

    clean_email = (
        user.email
        .strip()
        .lower()
    )

    existing_user = (
        db.query(User)
        .filter(
            func.lower(
                func.trim(User.email)
            ) == clean_email
        )
        .first()
    )

    if not existing_user:
        return {
            "message":
                "Invalid email or password"
        }

    if not verify_password(
        user.password,
        existing_user.password
    ):
        return {
            "message":
                "Invalid email or password"
        }

    # =====================================================
    # CREATE JWT TOKEN
    # =====================================================

    access_token = create_access_token(
        data={
            "sub":
                str(existing_user.id),

            "email":
                existing_user.email,

            "role":
                existing_user.role
        }
    )

    return {
        "message":
            "Login Successful",

        "access_token":
            access_token,

        "token_type":
            "bearer",

        "user_id":
            existing_user.id,

        "full_name":
            existing_user.full_name,

        "email":
            existing_user.email,

        "role":
            existing_user.role
    }


# =========================================================
# CURRENT USER
# =========================================================

@router.get("/me")
def get_me(
    current_user: dict =
        Depends(get_current_user)
):

    return {
        "user_id":
            current_user.get("sub"),

        "email":
            current_user.get("email"),

        "role":
            current_user.get("role")
    }


# =========================================================
# GET COMPLETE PROFILE
# =========================================================

@router.get("/profile")
def get_profile(
    current_user: dict =
        Depends(get_current_user),

    db: Session =
        Depends(get_db)
):

    # User ID JWT token se milega
    user_id = current_user.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )

    # Database se actual user fetch
    user = (
        db.query(User)
        .filter(
            User.id == int(user_id)
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    return {
        "user_id":
            user.id,

        "full_name":
            user.full_name,

        "email":
            user.email,

        "phone":
            user.phone,

        "role":
            user.role,

        "address":
            user.address,

        "state":
            user.state,

        "district":
            user.district,

        "area":
            user.area,

        "pincode":
            user.pincode
    }


# =========================================================
# UPDATE PROFILE
# =========================================================

@router.put("/profile")
def update_profile(
    profile: UserProfileUpdate,

    current_user: dict =
        Depends(get_current_user),

    db: Session =
        Depends(get_db)
):

    # =====================================================
    # GET CURRENT USER ID FROM JWT
    # =====================================================

    user_id = current_user.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token."
        )

    # =====================================================
    # FIND USER
    # =====================================================

    user = (
        db.query(User)
        .filter(
            User.id == int(user_id)
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    # =====================================================
    # UPDATE FULL NAME
    # =====================================================

    if profile.full_name is not None:

        clean_name = (
            profile.full_name.strip()
        )

        if not clean_name:
            raise HTTPException(
                status_code=400,
                detail="Full name cannot be empty."
            )

        user.full_name = clean_name


    # =====================================================
    # UPDATE PHONE
    # =====================================================

    if profile.phone is not None:

        clean_phone = (
            profile.phone.strip()
        )

        if not clean_phone:
            raise HTTPException(
                status_code=400,
                detail="Phone number cannot be empty."
            )

        # Check phone belongs to another user
        existing_phone = (
            db.query(User)
            .filter(
                func.trim(User.phone)
                == clean_phone,

                User.id != user.id
            )
            .first()
        )

        if existing_phone:
            raise HTTPException(
                status_code=409,
                detail=
                    "This phone number is already registered."
            )

        user.phone = clean_phone


    # =====================================================
    # UPDATE ADDRESS
    # =====================================================

    if profile.address is not None:
        user.address = (
            profile.address.strip()
            or None
        )


    # =====================================================
    # UPDATE STATE
    # =====================================================

    if profile.state is not None:
        user.state = (
            profile.state.strip()
            or None
        )


    # =====================================================
    # UPDATE DISTRICT
    # =====================================================

    if profile.district is not None:
        user.district = (
            profile.district.strip()
            or None
        )


    # =====================================================
    # UPDATE AREA
    # =====================================================

    if profile.area is not None:
        user.area = (
            profile.area.strip()
            or None
        )


    # =====================================================
    # UPDATE PINCODE
    # =====================================================

    if profile.pincode is not None:

        clean_pincode = (
            profile.pincode.strip()
        )

        if (
            clean_pincode
            and
            (
                not clean_pincode.isdigit()
                or len(clean_pincode) != 6
            )
        ):
            raise HTTPException(
                status_code=400,
                detail=
                    "PIN code must be a valid 6-digit number."
            )

        user.pincode = (
            clean_pincode
            or None
        )


    # =====================================================
    # SAVE TO POSTGRESQL
    # =====================================================

    db.commit()

    db.refresh(user)


    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "message":
            "Profile updated successfully.",

        "user": {
            "user_id":
                user.id,

            "full_name":
                user.full_name,

            "email":
                user.email,

            "phone":
                user.phone,

            "role":
                user.role,

            "address":
                user.address,

            "state":
                user.state,

            "district":
                user.district,

            "area":
                user.area,

            "pincode":
                user.pincode
        }
    }