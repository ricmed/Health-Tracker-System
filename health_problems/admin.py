from django.contrib import admin
from .models import (
    FieldType, HealthProblemType, FormQuestion,
    PatientHealthProblem, FormResponse, AuditLog
)


@admin.register(FieldType)
class FieldTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'has_options')
    search_fields = ('name', 'code')


class FormQuestionInline(admin.TabularInline):
    model = FormQuestion
    extra = 1
    ordering = ('order',)


@admin.register(HealthProblemType)
class HealthProblemTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active', 'schema_version', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'code')
    inlines = [FormQuestionInline]
    readonly_fields = ('schema_version', 'created_at', 'updated_at')


@admin.register(FormQuestion)
class FormQuestionAdmin(admin.ModelAdmin):
    list_display = ('label', 'health_problem_type', 'field_type', 'is_required', 'order')
    list_filter = ('field_type', 'is_required', 'health_problem_type')
    search_fields = ('label',)
    ordering = ('health_problem_type', 'order')


class FormResponseInline(admin.TabularInline):
    model = FormResponse
    extra = 0
    readonly_fields = ('submitted_by', 'submitted_at')


@admin.register(PatientHealthProblem)
class PatientHealthProblemAdmin(admin.ModelAdmin):
    list_display = ('patient', 'health_problem_type', 'status', 'severity', 'registered_by', 'created_at')
    list_filter = ('status', 'severity', 'health_problem_type')
    search_fields = ('patient__first_name', 'patient__last_name')
    inlines = [FormResponseInline]
    readonly_fields = ('created_at', 'updated_at')


@admin.register(FormResponse)
class FormResponseAdmin(admin.ModelAdmin):
    list_display = ('patient_health_problem', 'submitted_by', 'submitted_at')
    list_filter = ('submitted_at',)
    readonly_fields = ('submitted_at',)


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'model_name', 'object_repr', 'timestamp')
    list_filter = ('action', 'model_name', 'timestamp')
    search_fields = ('user__email', 'object_repr')
    readonly_fields = ('user', 'action', 'model_name', 'object_id', 'object_repr', 'changes', 'ip_address', 'user_agent', 'timestamp')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
