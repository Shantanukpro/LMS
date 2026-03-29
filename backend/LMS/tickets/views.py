from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Ticket
from .serializers import TicketSerializer

class TicketCreateView(generics.CreateAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            raise PermissionDenied("Only students can raise tickets.")
        serializer.save(student=self.request.user)

class TicketListView(generics.ListAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Ticket.objects.all()
        return Ticket.objects.filter(student=self.request.user)
