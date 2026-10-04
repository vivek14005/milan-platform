from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, case, func

from app.db.database import get_db
from app.models.pincode import Pincode


router = APIRouter(
    prefix="/locations",
    tags=["Locations"]
)


# =========================================================
# ALL INDIAN STATES AND UNION TERRITORIES
# =========================================================

INDIA_STATES = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
]


# =========================================================
# DATABASE STATE NAME ALIASES
# Handles old/different names present in postal datasets
# =========================================================

STATE_ALIASES = {
    "Andaman and Nicobar Islands": [
        "Andaman and Nicobar Islands",
        "Andaman & Nicobar Islands",
        "Andaman Nicobar",
    ],

    "Chhattisgarh": [
        "Chhattisgarh",
        "Chattisgarh",
    ],

    "Dadra and Nagar Haveli and Daman and Diu": [
        "Dadra and Nagar Haveli and Daman and Diu",
        "Dadra & Nagar Haveli",
        "Dadra and Nagar Haveli",
        "Daman & Diu",
        "Daman and Diu",
    ],

    "Delhi": [
        "Delhi",
        "New Delhi",
        "NCT of Delhi",
    ],

    "Jammu and Kashmir": [
        "Jammu and Kashmir",
        "Jammu & Kashmir",
        "Jammu Kashmir",
    ],

    "Odisha": [
        "Odisha",
        "Orissa",
    ],

    "Puducherry": [
        "Puducherry",
        "Pondicherry",
    ],

    "Uttarakhand": [
        "Uttarakhand",
        "Uttaranchal",
    ],
}


# =========================================================
# GET ALL STATES
# Always returns all 36 Indian States and UTs
# =========================================================

@router.get("/states")
def get_states():

    return {
        "count": len(INDIA_STATES),
        "states": INDIA_STATES
    }


# =========================================================
# GET ALL DISTRICTS BY SELECTED STATE
# =========================================================

@router.get("/districts")
def get_districts(
    state: str,
    db: Session = Depends(get_db)
):

    clean_state = " ".join(
        state.strip().split()
    )

    if not clean_state:
        raise HTTPException(
            status_code=400,
            detail="State is required"
        )

    if clean_state not in INDIA_STATES:
        raise HTTPException(
            status_code=400,
            detail="Please select a valid Indian state"
        )

    state_names = STATE_ALIASES.get(
        clean_state,
        [clean_state]
    )

    state_conditions = [
        func.lower(
            func.trim(Pincode.state)
        ) == state_name.lower()
        for state_name in state_names
    ]

    district_column = func.trim(
        Pincode.district
    )

    rows = (
        db.query(
            district_column.label("district")
        )
        .filter(
            Pincode.district.isnot(None)
        )
        .filter(
            func.trim(Pincode.district) != ""
        )
        .filter(
            or_(*state_conditions)
        )
        .distinct()
        .order_by(
            district_column
        )
        .all()
    )

    districts = sorted(
        {
            row[0]
            for row in rows
            if row[0]
            and row[0].strip()
            and row[0].strip().upper() != "NA"
        },
        key=str.lower
    )

    return {
        "state": clean_state,
        "count": len(districts),
        "districts": districts
    }


# =========================================================
# GET LOCATION USING PINCODE
# =========================================================

@router.get("/pincode/{pincode}")
def get_location_by_pincode(
    pincode: str,
    db: Session = Depends(get_db)
):

    clean_pincode = pincode.strip()

    if not clean_pincode.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Pincode must contain digits only"
        )

    if len(clean_pincode) != 6:
        raise HTTPException(
            status_code=400,
            detail="Pincode must be exactly 6 digits"
        )

    locations = (
        db.query(Pincode)
        .filter(
            Pincode.pincode == clean_pincode
        )
        .all()
    )

    if not locations:
        raise HTTPException(
            status_code=404,
            detail="Pincode not found"
        )

    areas = sorted(
        {
            location.post_office.strip()
            for location in locations
            if location.post_office
            and location.post_office.strip()
        },
        key=str.lower
    )

    return {
        "pincode": clean_pincode,
        "state": locations[0].state,
        "district": locations[0].district,
        "areas": areas
    }


# =========================================================
# SEARCH LOCATION
# OPTIONAL FILTER: STATE + DISTRICT
# =========================================================

@router.get("/search")
def search_locations(
    q: str,
    state: str | None = None,
    district: str | None = None,
    db: Session = Depends(get_db)
):

    clean_query = " ".join(
        q.strip().split()
    )

    if len(clean_query) < 2:
        raise HTTPException(
            status_code=400,
            detail="Please enter at least 2 characters"
        )

    query = db.query(Pincode)


    # =====================================================
    # OPTIONAL STATE FILTER
    # =====================================================

    if state:

        clean_state = " ".join(
            state.strip().split()
        )

        state_names = STATE_ALIASES.get(
            clean_state,
            [clean_state]
        )

        state_conditions = [
            func.lower(
                func.trim(Pincode.state)
            ) == state_name.lower()
            for state_name in state_names
        ]

        query = query.filter(
            or_(*state_conditions)
        )


    # =====================================================
    # OPTIONAL DISTRICT FILTER
    # =====================================================

    if district:

        clean_district = " ".join(
            district.strip().split()
        )

        query = query.filter(
            func.lower(
                func.trim(Pincode.district)
            ) == clean_district.lower()
        )


    # =====================================================
    # EXACT SIX-DIGIT PINCODE SEARCH
    # =====================================================

    if (
        clean_query.isdigit()
        and len(clean_query) == 6
    ):

        results = (
            query
            .filter(
                Pincode.pincode == clean_query
            )
            .limit(50)
            .all()
        )


    # =====================================================
    # AREA / DISTRICT / STATE SEARCH
    # =====================================================

    else:

        search_words = clean_query.split()

        word_conditions = []

        for word in search_words:

            pattern = f"%{word}%"

            word_conditions.append(
                or_(
                    Pincode.post_office.ilike(
                        pattern
                    ),

                    Pincode.district.ilike(
                        pattern
                    ),

                    Pincode.state.ilike(
                        pattern
                    ),

                    Pincode.pincode.ilike(
                        pattern
                    )
                )
            )

        filters = and_(
            *word_conditions
        )

        exact_pattern = clean_query
        starts_pattern = f"{clean_query}%"
        contains_pattern = f"%{clean_query}%"

        results = (
            query
            .filter(filters)
            .order_by(
                case(
                    (
                        Pincode.post_office.ilike(
                            exact_pattern
                        ),
                        0
                    ),

                    (
                        Pincode.post_office.ilike(
                            starts_pattern
                        ),
                        1
                    ),

                    (
                        Pincode.district.ilike(
                            exact_pattern
                        ),
                        2
                    ),

                    (
                        Pincode.post_office.ilike(
                            contains_pattern
                        ),
                        3
                    ),

                    else_=4
                ),

                Pincode.state,
                Pincode.district,
                Pincode.post_office
            )
            .limit(50)
            .all()
        )


    # =====================================================
    # NO RESULTS
    # =====================================================

    if not results:

        return {
            "count": 0,
            "locations": []
        }


    # =====================================================
    # REMOVE DUPLICATES
    # =====================================================

    unique_locations = {}

    for item in results:

        key = (
            item.post_office,
            item.pincode,
            item.district,
            item.state
        )

        if key not in unique_locations:

            unique_locations[key] = {
                "area": item.post_office,
                "pincode": item.pincode,
                "district": item.district,
                "state": item.state
            }

    locations = list(
        unique_locations.values()
    )[:20]

    return {
        "count": len(locations),
        "locations": locations
    }