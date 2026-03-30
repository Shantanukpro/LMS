from django.contrib import admin
from .models import MusterSession, MusterEntry


class MusterEntryInline(admin.TabularInline):
    model = MusterEntry
    extra = 0
    fields = ('sr_no', 'roll_no', 'pc', 'usage_price')


@admin.register(MusterSession)
class MusterSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'lab', 'class_name', 'batch', 'date', 'time', 'total_price_display', 'created_at')
    list_filter = ('lab', 'date', 'class_name')
    search_fields = ('class_name', 'batch', 'lab__name')
    ordering = ('-date', '-time')
    inlines = [MusterEntryInline]

    def total_price_display(self, obj):
        return f"₹{obj.total_price:.2f}"
    total_price_display.short_description = 'Session Total'


@admin.register(MusterEntry)
class MusterEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'sr_no', 'roll_no', 'pc', 'usage_price', 'total_price_display')
    list_filter = ('session',)
    search_fields = ('roll_no', 'pc__device_name')
    ordering = ('session', 'sr_no')

    def total_price_display(self, obj):
        return f"₹{obj.total_price:.2f}"
    total_price_display.short_description = 'Entry Total'
