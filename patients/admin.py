from django.contrib import admin
from .models import Patient, PatientAddress


class PatientAddressInline(admin.TabularInline):
    model = PatientAddress
    extra = 1


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'document_number', 'phone', 'email', 'is_active', 'created_at')
    list_filter = ('is_active', 'gender', 'created_at')
    search_fields = ('first_name', 'last_name', 'document_number', 'email', 'phone')
    inlines = [PatientAddressInline]
    readonly_fields = ('created_at', 'updated_at', 'created_by')

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(PatientAddress)
class PatientAddressAdmin(admin.ModelAdmin):
    list_display = ('patient', 'address_type', 'city', 'state', 'is_primary')
    list_filter = ('address_type', 'is_primary', 'state')
    search_fields = ('patient__first_name', 'patient__last_name', 'city')
