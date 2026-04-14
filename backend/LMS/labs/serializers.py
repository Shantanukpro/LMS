from rest_framework import serializers
from labs.models import (
    User, Lab, PC, CPU, OS, Peripheral, Software,
    LabEquipment, NetworkEquipmentDetails, ServerDetails, 
    ProjectorDetails, ElectricalApplianceDetails, MaintenanceLog
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role')


class LabSerializer(serializers.ModelSerializer):
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = Lab
        fields = '__all__'


class CPUSerializer(serializers.ModelSerializer):
    class Meta:
        model = CPU
        fields = '__all__'
        read_only_fields = ('pc',)


class OSSerializer(serializers.ModelSerializer):
    class Meta:
        model = OS
        fields = '__all__'
        read_only_fields = ('pc',)


class PeripheralSerializer(serializers.ModelSerializer):
    class Meta:
        model = Peripheral
        fields = '__all__'
        read_only_fields = ('pc',)


class SoftwareSerializer(serializers.ModelSerializer):
    class Meta:
        model = Software
        fields = '__all__'
        read_only_fields = ('pc',)


class PCSerializer(serializers.ModelSerializer):
    cpu = CPUSerializer(required=False)
    os = OSSerializer(required=False)
    peripheral_devices = PeripheralSerializer(many=True, required=False)
    installed_software = SoftwareSerializer(many=True, read_only=True)
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = PC
        fields = '__all__'

    def create(self, validated_data):
        cpu_data = validated_data.pop('cpu', None)
        os_data = validated_data.pop('os', None)
        peripherals_data = validated_data.pop('peripheral_devices', [])
        
        pc = PC.objects.create(**validated_data)
        
        if cpu_data:
            CPU.objects.create(pc=pc, **cpu_data)
        if os_data:
            OS.objects.create(pc=pc, **os_data)
            
        for p_data in peripherals_data:
            Peripheral.objects.create(pc=pc, **p_data)
            
        return pc

    def update(self, instance, validated_data):
        cpu_data = validated_data.pop('cpu', None)
        os_data = validated_data.pop('os', None)
        peripherals_data = validated_data.pop('peripheral_devices', [])
        
        # Update PC basic fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update CPU
        if cpu_data:
            cpu_obj, created = CPU.objects.get_or_create(pc=instance)
            for attr, value in cpu_data.items():
                setattr(cpu_obj, attr, value)
            cpu_obj.save()
            
        # Update OS
        if os_data:
            os_obj, created = OS.objects.get_or_create(pc=instance)
            for attr, value in os_data.items():
                setattr(os_obj, attr, value)
            os_obj.save()
            
        # Update Peripherals (Upsert based on type for common ones like keyboard/mouse)
        for p_data in peripherals_data:
            p_type = p_data.get('peripheral_type')
            if p_type:
                p_obj, created = Peripheral.objects.get_or_create(
                    pc=instance, 
                    peripheral_type=p_type
                )
                for attr, value in p_data.items():
                    setattr(p_obj, attr, value)
                p_obj.save()
                
        return instance


# ===============================
# Lab Equipment Serializers
# ===============================

class NetworkEquipmentDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NetworkEquipmentDetails
        fields = '__all__'


class ServerDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServerDetails
        fields = '__all__'


class ProjectorDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectorDetails
        fields = '__all__'


class ElectricalApplianceDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElectricalApplianceDetails
        fields = '__all__'


class LabEquipmentSerializer(serializers.ModelSerializer):
    network_details = NetworkEquipmentDetailsSerializer(read_only=True)
    server_details = ServerDetailsSerializer(read_only=True)
    projector_details = ProjectorDetailsSerializer(read_only=True)
    electrical_details = ElectricalApplianceDetailsSerializer(read_only=True)
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = LabEquipment
        fields = '__all__'


class LabEquipmentListSerializer(serializers.ModelSerializer):
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = LabEquipment
        fields = '__all__'


class MaintenanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceLog
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['reported_by'] = UserSerializer(instance.reported_by).data if instance.reported_by else None
        representation['fixed_by'] = UserSerializer(instance.fixed_by).data if instance.fixed_by else None
        return representation

    def validate(self, data):
        # Validate that exactly one target is set
        pc = data.get('pc')
        lab_equipment = data.get('lab_equipment')
        peripheral = data.get('peripheral')
        
        targets = [pc, lab_equipment, peripheral]
        filled = [t for t in targets if t is not None]
        
        if len(filled) != 1:
            raise serializers.ValidationError(
                "Exactly one of pc, lab_equipment, or peripheral must be set."
            )
        
        return data
