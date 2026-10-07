from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.database import get_db
from app.models.vendor import Vendor
from app.models.vendor_package import VendorPackage
from app.schemas.vendor_package import (
    VendorPackageCreate,
    VendorPackageUpdate,
)


router = APIRouter(
    prefix="/vendor-packages",
    tags=["Vendor Packages"]
)


def package_response(package: VendorPackage):
    return {
        "id": package.id,
        "vendor_id": package.vendor_id,
        "name": package.name,
        "price": package.price,
        "description": package.description,
        "features": package.features or [],
        "is_active": package.is_active,
    }


def get_logged_in_vendor(
    db: Session,
    current_user: dict
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

    return vendor


# =========================================================
# CREATE PACKAGE
# POST /vendor-packages
# =========================================================

@router.post("")
def create_vendor_package(
    package_data: VendorPackageCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    vendor = get_logged_in_vendor(
        db,
        current_user
    )

    package_count = (
        db.query(VendorPackage)
        .filter(
            VendorPackage.vendor_id == vendor.id
        )
        .count()
    )

    if package_count >= 4:
        raise HTTPException(
            status_code=400,
            detail="You can create up to 4 packages."
        )

    existing_package = (
        db.query(VendorPackage)
        .filter(
            VendorPackage.vendor_id == vendor.id,
            VendorPackage.name.ilike(
                package_data.name.strip()
            )
        )
        .first()
    )

    if existing_package:
        raise HTTPException(
            status_code=400,
            detail="A package with this name already exists."
        )

    new_package = VendorPackage(
        vendor_id=vendor.id,
        name=package_data.name.strip(),
        price=package_data.price,
        description=package_data.description,
        features=package_data.features,
        is_active=package_data.is_active,
    )

    db.add(new_package)
    db.commit()
    db.refresh(new_package)

    return {
        "message": "Vendor package created successfully",
        "package": package_response(new_package)
    }


# =========================================================
# GET LOGGED-IN VENDOR PACKAGES
# GET /vendor-packages/me
# =========================================================

@router.get("/me")
def get_my_vendor_packages(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    vendor = get_logged_in_vendor(
        db,
        current_user
    )

    packages = (
        db.query(VendorPackage)
        .filter(
            VendorPackage.vendor_id == vendor.id
        )
        .order_by(
            VendorPackage.price.asc()
        )
        .all()
    )

    return {
        "count": len(packages),
        "vendor_id": vendor.id,
        "packages": [
            package_response(package)
            for package in packages
        ]
    }


# =========================================================
# GET PUBLIC VENDOR PACKAGES
# GET /vendor-packages/vendor/{vendor_id}
# =========================================================

@router.get("/vendor/{vendor_id}")
def get_public_vendor_packages(
    vendor_id: int,
    db: Session = Depends(get_db)
):
    vendor = (
        db.query(Vendor)
        .filter(Vendor.id == vendor_id)
        .first()
    )

    if not vendor:
        raise HTTPException(
            status_code=404,
            detail="Vendor not found"
        )

    packages = (
        db.query(VendorPackage)
        .filter(
            VendorPackage.vendor_id == vendor_id,
            VendorPackage.is_active.is_(True)
        )
        .order_by(
            VendorPackage.price.asc()
        )
        .all()
    )

    return {
        "count": len(packages),
        "vendor_id": vendor_id,
        "packages": [
            package_response(package)
            for package in packages
        ]
    }


# =========================================================
# UPDATE PACKAGE
# PUT /vendor-packages/{package_id}
# =========================================================

@router.put("/{package_id}")
def update_vendor_package(
    package_id: int,
    package_data: VendorPackageUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    vendor = get_logged_in_vendor(
        db,
        current_user
    )

    package = (
        db.query(VendorPackage)
        .filter(
            VendorPackage.id == package_id,
            VendorPackage.vendor_id == vendor.id
        )
        .first()
    )

    if not package:
        raise HTTPException(
            status_code=404,
            detail="Package not found"
        )

    update_data = package_data.model_dump(
        exclude_unset=True
    )

    if "name" in update_data:
        duplicate_package = (
            db.query(VendorPackage)
            .filter(
                VendorPackage.vendor_id == vendor.id,
                VendorPackage.id != package.id,
                VendorPackage.name.ilike(
                    update_data["name"]
                )
            )
            .first()
        )

        if duplicate_package:
            raise HTTPException(
                status_code=400,
                detail="A package with this name already exists."
            )

    for field, value in update_data.items():
        setattr(
            package,
            field,
            value
        )

    db.commit()
    db.refresh(package)

    return {
        "message": "Vendor package updated successfully",
        "package": package_response(package)
    }


# =========================================================
# DELETE PACKAGE
# DELETE /vendor-packages/{package_id}
# =========================================================

@router.delete("/{package_id}")
def delete_vendor_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    vendor = get_logged_in_vendor(
        db,
        current_user
    )

    package = (
        db.query(VendorPackage)
        .filter(
            VendorPackage.id == package_id,
            VendorPackage.vendor_id == vendor.id
        )
        .first()
    )

    if not package:
        raise HTTPException(
            status_code=404,
            detail="Package not found"
        )

    db.delete(package)
    db.commit()

    return {
        "message": "Vendor package deleted successfully",
        "package_id": package_id
    }