from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Ticket
from .serializers import TicketSerializer
from users.models import User
from notifications.models import Notification

class TicketCreateView(generics.CreateAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            raise PermissionDenied("Only students can raise tickets.")
        ticket = serializer.save(student=self.request.user)
        
        # Notify admins
        from django.db.models import Q
        admins = User.objects.filter(Q(role__iexact='admin') | Q(is_superuser=True)).distinct()
        print(f"[DEBUG] Found {admins.count()} admins to notify for ticket #{ticket.id}")
        
        lab_name = ticket.pc.lab.name if (ticket.pc and ticket.pc.lab) else "Unknown Lab"
        pc_name = ticket.pc.device_name if ticket.pc else "Unknown PC"
        student_name = ticket.student.get_full_name() or ticket.student.username
        
        message = (
            f"🚨 New Technical Report\n"
            f"Reporter: {student_name}\n"
            f"Location: {lab_name}\n"
            f"Device: {pc_name}\n"
            f"Issue: {ticket.issue_description}"
        )
        
        for admin in admins:
            Notification.objects.create(
                user=admin,
                ticket=ticket,
                type='info',
                message=message
            )
            print(f"[DEBUG] Created notification for admin: {admin.username}")

class TicketListView(generics.ListAPIView):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request.user, 'role') and self.request.user.role == 'admin':
            return Ticket.objects.all().order_by('-created_at')
        return Ticket.objects.filter(student=self.request.user).order_by('-created_at')

class TicketUpdateView(generics.UpdateAPIView):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        if hasattr(self.request.user, 'role') and self.request.user.role != 'admin':
            raise PermissionDenied("Only admins can update ticket status.")
        serializer.save()
