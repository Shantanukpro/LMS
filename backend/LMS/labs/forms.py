from django import forms
from .models import (
    Lab, PC, CPU, OS, Peripheral, Software,
    LabEquipment, NetworkEquipmentDetails, ServerDetails,
    ProjectorDetails, ElectricalApplianceDetails, MaintenanceLog
)


class LabForm(forms.ModelForm):
    class Meta:
        model = Lab
        fields = ['name', 'location']


class PCForm(forms.ModelForm):
    class Meta:
        model = PC
        fields = [
            'lab', 'device_name', 'product_id', 'processor', 'ram',
            'storage', 'status', 'connected', 'gpu', 'peripherals',
            'brand', 'serial_number',
        ]


class CPUForm(forms.ModelForm):
    class Meta:
        model = CPU
        fields = ['pc', 'model', 'clock_speed', 'core_count', 'integrated_graphics']


class OSForm(forms.ModelForm):
    class Meta:
        model = OS
        fields = [
            'pc', 'name', 'version', 'install_date',
            'expiration_date', 'architecture', 'product_key',
        ]


class PeripheralForm(forms.ModelForm):
    class Meta:
        model = Peripheral
        fields = [
            'pc', 'peripheral_type', 'brand', 'model_name',
            'serial_number', 'status',
        ]


class SoftwareForm(forms.ModelForm):
    class Meta:
        model = Software
        fields = ['pc', 'name', 'version', 'license_key', 'expiry_date']


class LabEquipmentForm(forms.ModelForm):
    class Meta:
        model = LabEquipment
        fields = [
            'lab', 'equipment_code', 'name', 'category', 'equipment_type',
            'brand', 'model_name', 'quantity', 'status', 'is_networked',
            'installation_date', 'location_in_lab', 'remarks',
        ]


class NetworkEquipmentDetailsForm(forms.ModelForm):
    class Meta:
        model = NetworkEquipmentDetails
        fields = [
            'equipment', 'ip_address', 'mac_address', 'firmware_version',
            'number_of_ports', 'rack_unit_size', 'managed_switch',
            'bandwidth_capacity', 'power_rating',
        ]


class ServerDetailsForm(forms.ModelForm):
    class Meta:
        model = ServerDetails
        fields = [
            'equipment', 'cpu_model', 'total_ram', 'total_storage',
            'raid_config', 'virtualization_enabled', 'operating_system',
        ]


class ProjectorDetailsForm(forms.ModelForm):
    class Meta:
        model = ProjectorDetails
        fields = [
            'equipment', 'resolution', 'brightness_lumens',
            'throw_type', 'hdmi_ports',
        ]


class ElectricalApplianceDetailsForm(forms.ModelForm):
    class Meta:
        model = ElectricalApplianceDetails
        fields = [
            'equipment', 'power_rating', 'voltage', 'inverter_type',
            'energy_rating', 'service_due_date',
        ]


class MaintenanceLogForm(forms.ModelForm):
    class Meta:
        model = MaintenanceLog
        fields = [
            'pc', 'lab_equipment', 'peripheral',
            'issue_description', 'status_before', 'status_after',
            'status', 'remarks',
        ]
