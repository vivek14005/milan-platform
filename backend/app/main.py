from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.vendor_verification import router as vendor_verification_router
from app.models.vendor_verification_document import VendorVerificationDocument

from app.db.database import engine, Base
from app.api.admin import router as admin_router


# =========================================================
# MODELS
# =========================================================

from app.models.user import User
from app.models.vendor import Vendor
from app.models.vendor_media import VendorMedia
from app.models.enquiry import Enquiry
from app.models.saved_vendor import SavedVendor
from app.models.notifications import Notification
from app.models.review import Review
from app.models.vendor_verification import VendorVerification


# =========================================================
# ROUTERS
# =========================================================

from app.api.auth import router as auth_router
from app.api.vendors import router as vendor_router
from app.api.enquiries import router as enquiry_router
from app.api.saved_vendors import router as saved_vendors_router
from app.api.notifications import router as notifications_router
from app.api.reviews import router as reviews_router
from app.api import locations

import os


# =========================================================
# CREATE UPLOAD FOLDER
# =========================================================

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


# =========================================================
# CREATE DATABASE TABLES
# =========================================================

Base.metadata.create_all(
    bind=engine
)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="Milan API",
    version="1.0.0",
    description="Backend API for Milan - Wedding Marketplace"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# STATIC UPLOAD FILES
# =========================================================

app.mount(
    "/uploads",
    StaticFiles(
        directory=UPLOAD_DIR
    ),
    name="uploads"
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(auth_router)

app.include_router(vendor_router)

app.include_router(enquiry_router)

app.include_router(locations.router)

app.include_router(saved_vendors_router)

app.include_router(notifications_router)

app.include_router(reviews_router)
app.include_router(vendor_verification_router)
app.include_router(admin_router)


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "message": "Welcome to Milan API",
        "status": "Running Successfully"
    }