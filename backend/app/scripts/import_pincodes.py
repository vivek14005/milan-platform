import csv
from pathlib import Path

from app.db.database import SessionLocal, engine, Base
from app.models.pincode import Pincode


# =========================================================
# CREATE TABLE IF NOT EXISTS
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# CSV PATH
# backend/data/india_pincodes.csv
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[2]

CSV_FILE = (
    BASE_DIR
    / "data"
    / "india_pincodes.csv"
)


# =========================================================
# IMPORT PINCODES
# =========================================================

def import_pincodes():

    if not CSV_FILE.exists():
        print(
            f"CSV file not found: {CSV_FILE}"
        )
        return

    db = SessionLocal()

    try:

        print("Starting pincode import...")
        print(f"Reading: {CSV_FILE}")

        # -------------------------------------------------
        # OPTIONAL:
        # Clear old data before import
        # -------------------------------------------------

        existing_count = (
            db.query(Pincode)
            .count()
        )

        if existing_count > 0:

            print(
                f"Deleting {existing_count} existing records..."
            )

            db.query(Pincode).delete()
            db.commit()


        # -------------------------------------------------
        # READ CSV
        # -------------------------------------------------

        records = []

        with open(
            CSV_FILE,
            mode="r",
            encoding="utf-8-sig",
            newline=""
        ) as file:

            reader = csv.DictReader(file)

            for row in reader:

                pincode = str(
                    row.get(
                        "pincode",
                        ""
                    )
                ).strip()

                post_office = (
                    row.get(
                        "officename",
                        ""
                    )
                    or ""
                ).strip()

                district = (
                    row.get(
                        "district",
                        ""
                    )
                    or ""
                ).strip()

                state = (
                    row.get(
                        "statename",
                        ""
                    )
                    or ""
                ).strip()


                # -----------------------------------------
                # SKIP BAD ROWS
                # -----------------------------------------

                if not pincode:
                    continue

                if not pincode.isdigit():
                    continue

                if len(pincode) != 6:
                    continue

                if not post_office:
                    continue

                if not district:
                    continue

                if not state:
                    continue


                # -----------------------------------------
                # CREATE DATABASE OBJECT
                # -----------------------------------------

                records.append(
                    Pincode(
                        pincode=pincode,
                        post_office=post_office,
                        district=district,
                        state=state
                    )
                )


                # -----------------------------------------
                # BATCH INSERT
                # -----------------------------------------

                if len(records) >= 5000:

                    db.bulk_save_objects(
                        records
                    )

                    db.commit()

                    print(
                        "Imported another 5000 records..."
                    )

                    records = []


        # -------------------------------------------------
        # INSERT REMAINING RECORDS
        # -------------------------------------------------

        if records:

            db.bulk_save_objects(
                records
            )

            db.commit()


        # -------------------------------------------------
        # FINAL COUNT
        # -------------------------------------------------

        total = (
            db.query(Pincode)
            .count()
        )

        print("")
        print("==============================")
        print("Pincode import completed!")
        print(f"Total records: {total}")
        print("==============================")


    except Exception as error:

        db.rollback()

        print("")
        print("Import failed:")
        print(error)


    finally:

        db.close()


# =========================================================
# RUN SCRIPT
# =========================================================

if __name__ == "__main__":
    import_pincodes()