from rest_framework import generics
from rest_framework.exceptions import ValidationError
from .models import User, Lab, PC, Software, Equipment, MaintenanceLog, Inventory
from .serializers import UserSerializer, LabSerializer, PCSerializer, SoftwareSerializer, EquipmentSerializer, MaintenanceLogSerializer, InventorySerializer
from .permissions import IsAdminOrReadOnly, AllowAuthenticatedReadAndCreateElseAdmin

class UserList(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrReadOnly]

class UserDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminOrReadOnly]

from rest_framework.permissions import IsAuthenticated

class LabList(generics.ListCreateAPIView):
    queryset = Lab.objects.all()
    serializer_class = LabSerializer
    permission_classes = [IsAdminOrReadOnly]

class LabDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Lab.objects.all()
    serializer_class = LabSerializer
    permission_classes = [IsAdminOrReadOnly]

class PCList(generics.ListCreateAPIView):
    queryset = PC.objects.all()
    serializer_class = PCSerializer
    permission_classes = [IsAdminOrReadOnly]

class PCDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = PC.objects.all()
    serializer_class = PCSerializer
    permission_classes = [IsAdminOrReadOnly]

class LabPCList(generics.ListCreateAPIView):
    serializer_class = PCSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        lab_id = self.kwargs['lab_id']
        return PC.objects.filter(lab=lab_id)

    def perform_create(self, serializer):
        lab_id = self.kwargs['lab_id']
        # Get the lab instance
        try:
            lab = Lab.objects.get(id=lab_id)
            serializer.save(lab=lab)
        except Lab.DoesNotExist:
            raise ValidationError({'lab': 'Lab not found'})

class SoftwareList(generics.ListCreateAPIView):
    queryset = Software.objects.all()
    serializer_class = SoftwareSerializer
    permission_classes = [IsAdminOrReadOnly]

class SoftwareDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Software.objects.all()
    serializer_class = SoftwareSerializer
    permission_classes = [IsAdminOrReadOnly]

class EquipmentList(generics.ListCreateAPIView):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAdminOrReadOnly]

class EquipmentDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Equipment.objects.all()
    serializer_class = EquipmentSerializer
    permission_classes = [IsAdminOrReadOnly]

class MaintenanceLogList(generics.ListCreateAPIView):
    serializer_class = MaintenanceLogSerializer
    permission_classes = [AllowAuthenticatedReadAndCreateElseAdmin]

    def get_queryset(self):
        user = self.request.user
        # Students should see all maintenance logs so they can view updates made by admins
        if user.role == 'student':
            return MaintenanceLog.objects.all()
        # Admins can see all
        return MaintenanceLog.objects.all()

    def perform_create(self, serializer):
        equipment = serializer.validated_data.get('equipment')
        lab = equipment.lab if equipment else None
        serializer.save(
            reported_by=self.request.user,
            lab=lab,   # 👈 auto-assign lab here
            status='pending',
            status_after=None,
            fixed_by=None,
            fixed_on=None,
        )


class MaintenanceLogDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = MaintenanceLog.objects.all()
    serializer_class = MaintenanceLogSerializer
    permission_classes = [AllowAuthenticatedReadAndCreateElseAdmin]

from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def redirect_after_login(request):
    user = request.user
    if user.role == 'student':
        return Response({'redirect_to': '/api/maintenance/'})
    elif user.role == 'admin':
        return Response({'redirect_to': '/api/inventory/'})
    else:
        return Response({'redirect_to': '/api/'})


class InventoryList(generics.ListAPIView):
    serializer_class = InventorySerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        # This method won't be used, but required by ListAPIView
        return Inventory.objects.none()

    def list(self, request, *args, **kwargs):
        # Calculate inventory dynamically from Equipment table
        labs = Lab.objects.all()
        inventory_data = []

        for lab in labs:
            # Get all equipment types for this lab
            equipment_in_lab = Equipment.objects.filter(lab=lab)
            equipment_types = equipment_in_lab.values_list('equipment_type', flat=True).distinct()

            for eq_type in equipment_types:
                eq_of_type = equipment_in_lab.filter(equipment_type=eq_type)

                inventory_data.append({
                    'id': f"{lab.id}_{eq_type}",  # Composite key
                    'lab': lab.id,
                    'equipment_type': eq_type,
                    'total_quantity': eq_of_type.count(),
                    'working_quantity': eq_of_type.filter(status='working').count(),
                    'not_working_quantity': eq_of_type.filter(status='not_working').count(),
                    'under_repair_quantity': eq_of_type.filter(status='under_repair').count(),
                })

        # If no data, return empty list instead of old Inventory table data
        serializer = self.get_serializer(inventory_data, many=True)
        return Response(serializer.data)

class InventoryDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [IsAdminOrReadOnly]
