from django.contrib import admin
from .models import Ticket


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'pc', 'status', 'created_at', 'updated_at')
    list_filter = ('status', 'created_at')
    search_fields = ('student__username', 'pc__device_name', 'issue_description')
    ordering = ('-created_at',)
