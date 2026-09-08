from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, case

from app.db.database import get_db
from app.models.pincode import Pincode


router = APIRouter(
    prefix="/locations",
    tags=["Locations"]
)


# =========================================================
# GET ALL STATES
# =========================================================

@router.get("/states")
def get_states(
    db: Session = Depends(get_db)
):

    rows = (
        db.query(Pincode.state)
        .filter(Pincode.state.isnot(None))
        .distinct()
        .order_by(Pincode.state)
        .all()
    )

    states = [
        row[0]
        for row in rows
        if row[0]
    ]

    return {
        "count": len(states),
        "states": states
    }


# =========================================================
# GET DISTRICTS BY STATE
# =========================================================

@router.get("/districts")
def get_districts(
    state: str,
    db: Session = Depends(get_db)
):

    clean_state = state.strip()

    if not clean_state:
        raise HTTPException(
            status_code=400,
            detail="State is required"
        )

    rows = (
        db.query(Pincode.district)
        .filter(
            Pincode.state.ilike(
                clean_state
            )
        )
        .filter(
            Pincode.district.isnot(None)
        )
        .distinct()
        .order_by(Pincode.district)
        .all()
    )

    districts = [
        row[0]
        for row in rows
        if row[0]
    ]

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

    pincode = pincode.strip()

    if not pincode.isdigit():
        raise HTTPException(
            status_code=400,
            detail="Pincode must contain digits only"
        )

    if len(pincode) != 6:
        raise HTTPException(
            status_code=400,
            detail="Pincode must be exactly 6 digits"
        )

    locations = (
        db.query(Pincode)
        .filter(
            Pincode.pincode == pincode
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
            location.post_office
            for location in locations
            if location.post_office
        }
    )

    return {
        "pincode": pincode,
        "state": locations[0].state,
        "district": locations[0].district,
        "areas": areas
    }


# =========================================================
# SEARCH LOCATION
# FILTER BY STATE + DISTRICT
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
        clean_state = state.strip()

        query = query.filter(
            Pincode.state.ilike(
                clean_state
            )
        )


    # =====================================================
    # OPTIONAL DISTRICT FILTER
    # =====================================================

    if district:
        clean_district = district.strip()

        query = query.filter(
            Pincode.district.ilike(
                clean_district
            )
        )


    # =====================================================
    # EXACT 6 DIGIT PINCODE
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

        search_words = (
            clean_query.split()
        )

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


        exact_pattern = (
            clean_query
        )

        starts_pattern = (
            f"{clean_query}%"
        )

        contains_pattern = (
            f"%{clean_query}%"
        )


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
                "area":
                    item.post_office,

                "pincode":
                    item.pincode,

                "district":
                    item.district,

                "state":
                    item.state
            }


    locations = list(
        unique_locations.values()
    )[:20]


    return {
        "count": len(locations),
        "locations": locations
    }