import pandas as pd
import os
from datetime import datetime
from django.db import transaction
from labs.models import Lab, PC, LabEquipment, NetworkEquipmentDetails, ServerDetails, ProjectorDetails, ElectricalApplianceDetails


ALLOWED_EQUIPMENT_TYPES = [c[0] for c in LabEquipment.EQUIPMENT_TYPES]
ALLOWED_CATEGORIES = [c[0] for c in LabEquipment.CATEGORY_CHOICES]
ALLOWED_STATUS = [c[0] for c in LabEquipment.STATUS_CHOICES]
NETWORK_TYPES = ('ROUTER', 'SWITCH', 'HUB', 'SERVER', 'E_BOARD')


def load_dataframe(file):
    """Load CSV or Excel file into pandas DataFrame."""
    name = file.name.lower()
    if name.endswith(".csv"):
        return pd.read_csv(file)
    elif name.endswith(".xlsx") or name.endswith(".xls"):
        return pd.read_excel(file)
    else:
        raise ValueError("Only CSV and XLSX files are supported.")


def normalize_columns(df):
    """Normalize column names to lowercase, replace spaces with underscores."""
    df.columns = (
        df.columns
        .str.strip()
        .str.lower()
        .str.replace(" ", "_")
        .str.replace("(", "")
        .str.replace(")", "")
    )
    return df


def get_or_create_lab(file_name=None, lab_name=None, lab_id=None):
    """Helper to get or create a Lab for import."""
    if lab_id:
        try:
            return Lab.objects.get(id=lab_id), None
        except Lab.DoesNotExist:
            return None, f"Lab with id {lab_id} not found"
    
    if lab_name:
        lab, created = Lab.objects.get_or_create(name=lab_name)
        return lab, None
    
    # Auto-create lab from filename
    if file_name:
        base_name = os.path.splitext(os.path.basename(file_name))[0]
        lab_name = f"Imported_{base_name}_{datetime.now().strftime('%Y%m%d')}"
    else:
        lab_name = f"Imported_Lab_{datetime.now().strftime('%Y%m%d')}"
    
    lab, created = Lab.objects.get_or_create(name=lab_name)
    return lab, None


# -----------------------
# LABS IMPORT
# -----------------------
@transaction.atomic
def import_labs(file):
    """
    Import Labs from file.
    Expected columns: name, location
    Returns: (created_count, skipped_count, error_list)
    """
    df = load_dataframe(file)
    df = normalize_columns(df)
    
    created, skipped = 0, 0
    errors = []

    for i, row in df.iterrows():
        try:
            # Try multiple column names for lab name
            lab_name = (
                row.get("name") or 
                row.get("lab_name") or 
                row.get("labname") or
                None
            )
            
            if not lab_name or str(lab_name).strip() == '':
                errors.append(f"Row {i+2}: Lab name is required")
                continue
            
            lab_name = str(lab_name).strip()
            
            # Check for duplicates
            if Lab.objects.filter(name=lab_name).exists():
                skipped += 1
                continue

            # Location - optional
            location = row.get("location") or row.get("lab_location") or None
            if location:
                location = str(location).strip()

            Lab.objects.create(name=lab_name, location=location)
            created += 1

        except Exception as e:
            errors.append(f"Row {i+2}: {str(e)}")

    return created, skipped, errors


# -----------------------
# PCS IMPORT
# -----------------------
@transaction.atomic
def import_pcs(file, lab_id=None):
    """
    Import PCs from file.
    Expected columns: device_name (or name, pc_name), status, brand, etc.
    Returns: dict with lab, created, skipped, errors
    """
    df = load_dataframe(file)
    df = normalize_columns(df)
    
    # Get or create lab
    file_name = getattr(file, 'name', None)
    lab, error = get_or_create_lab(file_name=file_name, lab_id=lab_id)
    if error:
        return {"lab": None, "created": 0, "skipped": 0, "errors": [error]}
    
    created, skipped = 0, 0
    errors = []

    for i, row in df.iterrows():
        try:
            # Try multiple column names for PC name
            device_name = (
                row.get("device_name") or 
                row.get("name") or 
                row.get("pc_name") or 
                row.get("pc_name_comp_id") or
                None
            )
            
            if not device_name or str(device_name).strip() == '':
                errors.append(f"Row {i+2}: PC device name is required")
                continue
            
            device_name = str(device_name).strip()
            
            # Check for duplicates in same lab
            if PC.objects.filter(lab=lab, device_name=device_name).exists():
                skipped += 1
                continue
            
            # Status - default to working
            status = row.get("status") or "working"
            if status not in ALLOWED_STATUS:
                status = "working"
            
            # Boolean fields - handle various representations
            def parse_bool(val):
                if val is None or pd.isna(val):
                    return False
                val_str = str(val).lower().strip()
                return val_str in ('yes', 'true', '1', 'y', 't')
            
            connected = parse_bool(row.get("connected"))
            gpu = parse_bool(row.get("gpu"))
            peripherals = parse_bool(row.get("peripherals"))

            PC.objects.create(
                lab=lab,
                device_name=device_name,
                product_id=row.get("product_id") or None,
                processor=row.get("processor") or None,
                ram=row.get("ram") or None,
                storage=row.get("storage") or None,
                status=status,
                connected=connected,
                gpu=gpu,
                peripherals=peripherals,
                brand=row.get("brand") or None,
                serial_number=row.get("serial_number") or row.get("serial") or None
            )
            created += 1

        except Exception as e:
            errors.append(f"Row {i+2}: {str(e)}")

    return {
        "lab": lab.name,
        "created": created,
        "skipped": skipped,
        "errors": errors
    }


# -----------------------
# LAB EQUIPMENT IMPORT
# -----------------------
@transaction.atomic
def import_lab_equipment(file, lab_id=None):
    """
    Import LabEquipment from file.
    Expected columns: equipment_code, name, equipment_type, category, quantity, status, etc.
    Optional subtable columns: ip_address, mac_address, cpu_model, etc.
    Returns: (created_count, skipped_count, error_list)
    """
    df = load_dataframe(file)
    df = normalize_columns(df)
    
    # Get or create lab
    file_name = getattr(file, 'name', None)
    lab, error = get_or_create_lab(file_name=file_name, lab_id=lab_id)
    if error:
        return {"lab": None, "created": 0, "skipped": 0, "errors": [error]}
    
    created, skipped = 0, 0
    errors = []

    for i, row in df.iterrows():
        try:
            # Equipment code - try multiple column names
            equipment_code = (
                row.get("equipment_code") or 
                row.get("code") or 
                row.get("eq_code") or
                None
            )
            
            # Generate code if missing
            if not equipment_code or str(equipment_code).strip() == '':
                equipment_code = f"EQ-{lab.id}-{i+1:04d}"
            else:
                equipment_code = str(equipment_code).strip()
            
            # Name - fallback to code
            name = (
                row.get("name") or 
                row.get("equipment_name") or 
                row.get("eq_name") or
                equipment_code
            )
            name = str(name).strip()
            
            # Category - default to INFRASTRUCTURE
            category = (
                row.get("category") or 
                row.get("cat") or 
                "INFRASTRUCTURE"
            )
            if category not in ALLOWED_CATEGORIES:
                category = "INFRASTRUCTURE"
            
            # Equipment type - default to OTHER
            eq_type = (
                row.get("equipment_type") or 
                row.get("type") or 
                row.get("eq_type") or 
                "OTHER"
            )
            if eq_type not in ALLOWED_EQUIPMENT_TYPES:
                errors.append(f"Row {i+2}: Invalid equipment_type '{eq_type}', defaulting to OTHER")
                eq_type = "OTHER"
            
            # Status - default to working
            status = row.get("status") or "working"
            if status not in ALLOWED_STATUS:
                status = "working"
            
            # Quantity
            try:
                quantity = int(row.get("quantity") or 1)
                if quantity < 1:
                    quantity = 1
            except (ValueError, TypeError):
                quantity = 1
            
            # Boolean: is_networked
            def parse_bool(val):
                if val is None or pd.isna(val):
                    return False
                val_str = str(val).lower().strip()
                return val_str in ('yes', 'true', '1', 'y', 't')
            
            is_networked = parse_bool(row.get("is_networked"))
            
            # Check for duplicate in same lab
            if LabEquipment.objects.filter(lab=lab, equipment_code=equipment_code).exists():
                skipped += 1
                continue
            
            # Create LabEquipment
            lab_equipment = LabEquipment.objects.create(
                lab=lab,
                equipment_code=equipment_code,
                name=name,
                category=category,
                equipment_type=eq_type,
                brand=row.get("brand") or None,
                model_name=row.get("model_name") or row.get("model") or None,
                quantity=quantity,
                status=status,
                is_networked=is_networked,
                installation_date=row.get("installation_date") or None,
                location_in_lab=row.get("location_in_lab") or row.get("location") or None,
                remarks=row.get("remarks") or row.get("notes") or None,
            )
            created += 1
            
            # ----- SUBTABLES CREATION -----
            
            # NetworkEquipmentDetails (for ROUTER, SWITCH, HUB, SERVER, E_BOARD)
            if eq_type in NETWORK_TYPES:
                ip_address = row.get("ip_address") or row.get("ip") or None
                mac_address = row.get("mac_address") or row.get("mac") or None
                
                if ip_address or mac_address:
                    try:
                        NetworkEquipmentDetails.objects.create(
                            equipment=lab_equipment,
                            ip_address=ip_address,
                            mac_address=mac_address,
                            firmware_version=row.get("firmware_version") or row.get("firmware") or None,
                            number_of_ports=row.get("number_of_ports") or row.get("ports"),
                            rack_unit_size=row.get("rack_unit_size") or row.get("rack_size"),
                            managed_switch=parse_bool(row.get("managed_switch")),
                            bandwidth_capacity=row.get("bandwidth_capacity") or row.get("bandwidth") or None,
                            power_rating=row.get("power_rating") or row.get("power") or None
                        )
                    except Exception as e:
                        errors.append(f"Row {i+2} (NetworkDetails): {str(e)}")
            
            # ServerDetails (for SERVER only)
            if eq_type == "SERVER":
                cpu_model = row.get("cpu_model") or row.get("cpu") or None
                total_ram = row.get("total_ram") or row.get("ram") or None
                total_storage = row.get("total_storage") or row.get("storage") or None
                
                if cpu_model or total_ram or total_storage:
                    try:
                        ServerDetails.objects.create(
                            equipment=lab_equipment,
                            cpu_model=cpu_model,
                            total_ram=total_ram,
                            total_storage=total_storage,
                            raid_config=row.get("raid_config") or row.get("raid") or None,
                            virtualization_enabled=parse_bool(row.get("virtualization_enabled")),
                            operating_system=row.get("operating_system") or row.get("os") or None
                        )
                    except Exception as e:
                        errors.append(f"Row {i+2} (ServerDetails): {str(e)}")
            
            # ProjectorDetails (for PROJECTOR)
            if eq_type == "PROJECTOR":
                resolution = row.get("resolution") or None
                
                if resolution or row.get("brightness_lumens"):
                    try:
                        ProjectorDetails.objects.create(
                            equipment=lab_equipment,
                            resolution=resolution,
                            brightness_lumens=row.get("brightness_lumens") or row.get("brightness"),
                            throw_type=row.get("throw_type") or row.get("throw") or None,
                            hdmi_ports=row.get("hdmi_ports") or row.get("hdmi")
                        )
                    except Exception as e:
                        errors.append(f"Row {i+2} (ProjectorDetails): {str(e)}")
            
            # ElectricalApplianceDetails (for AC, FAN, LIGHT)
            if eq_type in ('AC', 'FAN', 'LIGHT'):
                power_rating = row.get("power_rating") or row.get("power") or None
                
                if power_rating or row.get("voltage"):
                    try:
                        ElectricalApplianceDetails.objects.create(
                            equipment=lab_equipment,
                            power_rating=power_rating,
                            voltage=row.get("voltage") or None,
                            inverter_type=parse_bool(row.get("inverter_type")),
                            energy_rating=row.get("energy_rating") or row.get("energy_star") or None,
                            service_due_date=row.get("service_due_date") or row.get("service_date") or None
                        )
                    except Exception as e:
                        errors.append(f"Row {i+2} (ElectricalDetails): {str(e)}")

        except Exception as e:
            errors.append(f"Row {i+2}: {str(e)}")

    return {
        "lab": lab.name,
        "created": created,
        "skipped": skipped,
        "errors": errors
    }
