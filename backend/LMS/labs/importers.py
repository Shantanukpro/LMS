import pandas as pd
from django.db import transaction
from labs.models import Lab, PC, Equipment

ALLOWED_EQUIPMENT_TYPES = [c[0] for c in Equipment.EQUIPMENT_TYPES]
ALLOWED_STATUS = [c[0] for c in Equipment.STATUS_CHOICES]


def load_dataframe(file):
    name = file.name.lower()
    if name.endswith(".csv"):
        return pd.read_csv(file)
    elif name.endswith(".xlsx"):
        return pd.read_excel(file)
    else:
        raise ValueError("Only CSV and XLSX files are supported.")


# -----------------------
# LABS IMPORT
# -----------------------
@transaction.atomic
def import_labs(file):
    df = load_dataframe(file)
    created, skipped, errors = 0, 0, []

    for i, row in df.iterrows():
        try:
            lab_name = (
                row.get("name")
                or row.get("lab_name")
                or row.get("Lab Name")
                or row.get("LAB_NAME")
            )

            if not lab_name:
                raise ValueError("Missing lab name column (expected: name/lab_name/Lab Name)")

            lab_name = str(lab_name).strip()

            if Lab.objects.filter(name=lab_name).exists():
                skipped += 1
                continue

            location = (
                row.get("location")
                or row.get("lab_location")
                or row.get("Location")
            )

            Lab.objects.create(
                name=lab_name,
                location=location
            )
            created += 1

        except Exception as e:
            errors.append(f"Row {i+2}: {e}")

    return created, skipped, errors


# -----------------------
# PCS IMPORT
# -----------------------
import os
from django.db import transaction
from labs.models import Lab, PC

@transaction.atomic
def import_pcs(file, lab_id=None):
    df = load_dataframe(file)

    # Normalize headers
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("(", "")
        .str.replace(")", "")
    )

    # 🔹 Auto-create lab if none exist
    if Lab.objects.count() == 0:
        filename = os.path.splitext(file.name)[0]
        lab, _ = Lab.objects.get_or_create(name=filename)
    else:
        if not lab_id:
            raise ValueError("Lab is required when labs already exist.")
        lab = Lab.objects.get(id=lab_id)

    created, skipped, errors = 0, 0, []

    for i, row in df.iterrows():
        try:
            pc_name = row.get("pc_name_comp_id")
            if not pc_name:
                raise ValueError("Missing 'PC Name (COMP ID)' column")

            status = row.get("status") or "working"

            PC.objects.create(
                lab=lab,
                name=str(pc_name).strip(),
                status=str(status).lower(),
                brand=row.get("brand"),
                serial_number=None
            )
            created += 1

        except Exception as e:
            errors.append(f"Row {i+2}: {e}")

    return {
        "lab": lab.name,
        "created": created,
        "skipped": skipped,
        "errors": errors,
    }

# -----------------------
# EQUIPMENT IMPORT
# -----------------------
@transaction.atomic
def import_equipment(file):
    df = load_dataframe(file)
    created, skipped, errors = 0, 0, []

    for i, row in df.iterrows():
        try:
            lab_name = row.get("lab_name") or row.get("Lab Name") or row.get("name")
            if not lab_name:
                raise ValueError("Missing lab_name column")

            lab = Lab.objects.get(name=str(lab_name).strip())

            eq_type = row.get("equipment_type") or row.get("type") or row.get("Equipment Type")
            if not eq_type:
                raise ValueError("Missing equipment_type column")

            status = row.get("status") or "working"

            if eq_type not in ALLOWED_EQUIPMENT_TYPES:
                raise ValueError(f"Invalid equipment_type: {eq_type}")

            if status not in ALLOWED_STATUS:
                raise ValueError(f"Invalid status: {status}")

            serial = row.get("serial_number") or row.get("serial") or row.get("Serial Number")

            if serial and Equipment.objects.filter(serial_number=serial).exists():
                skipped += 1
                continue

            Equipment.objects.create(
                lab=lab,
                equipment_type=eq_type,
                brand=row.get("brand") or row.get("Brand"),
                model_name=row.get("model_name") or row.get("Model"),
                serial_number=serial,
                location_in_lab=row.get("location_in_lab") or row.get("Location"),
                price=row.get("price"),
                status=status,
            )
            created += 1

        except Lab.DoesNotExist:
            errors.append(f"Row {i+2}: Lab not found: {lab_name}")
        except Exception as e:
            errors.append(f"Row {i+2}: {e}")

    return created, skipped, errors