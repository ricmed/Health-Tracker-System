from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role, Permission


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_staff', 'is_active', 'created_at')
    list_filter = ('is_staff', 'is_active', 'roles')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-created_at',)
    filter_horizontal = ('roles', 'permissions', 'health_problem_permissions')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'roles', 'permissions', 'health_problem_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name',)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'permission_type')
    list_filter = ('permission_type',)
    search_fields = ('name', 'code')
