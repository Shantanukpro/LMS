from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'user', 'maintenance_log', 'ticket', 'type', 'message', 'is_read', 'created_at')
        read_only_fields = ('id', 'user', 'maintenance_log', 'ticket', 'type', 'message', 'created_at')
