from django.contrib import admin
from .models import MusterSession, MusterEntry


class MusterEntryInline(admin.TabularInline):
    model = MusterEntry
    extra = 0
    fields = ('sr_no', 'roll_no', 'pc')


@admin.register(MusterSession)
class MusterSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'lab', 'class_name', 'batch', 'date', 'time', 'created_at')
    list_filter = ('lab', 'date', 'class_name')
    search_fields = ('class_name', 'batch', 'lab__name')
    ordering = ('-date', '-time')
    inlines = [MusterEntryInline]


@admin.register(MusterEntry)
class MusterEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'sr_no', 'roll_no', 'pc')
    list_filter = ('session',)
    search_fields = ('roll_no', 'pc__device_name')
    ordering = ('session', 'sr_no')
