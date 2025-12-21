from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, password, **extra_fields)


class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Permission(models.Model):
    PERMISSION_TYPES = [
        ('view', 'View'),
        ('create', 'Create'),
        ('edit', 'Edit'),
        ('delete', 'Delete'),
        ('manage', 'Manage'),
    ]

    name = models.CharField(max_length=100)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    permission_type = models.CharField(max_length=20, choices=PERMISSION_TYPES, default='view')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    roles = models.ManyToManyField(Role, blank=True, related_name='users')
    permissions = models.ManyToManyField(Permission, blank=True, related_name='users')
    health_problem_permissions = models.ManyToManyField(
        'health_problems.HealthProblemType',
        blank=True,
        related_name='permitted_users',
        help_text='Health problem types this user can register'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def has_health_problem_permission(self, health_problem_type):
        if self.is_superuser:
            return True
        return self.health_problem_permissions.filter(id=health_problem_type.id).exists()
