from django.db import models
from django.conf import settings


class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('U', 'Prefer not to say'),
    ]

    MARITAL_STATUS_CHOICES = [
        ('single', 'Single'),
        ('married', 'Married'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
        ('other', 'Other'),
    ]

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20)
    secondary_phone = models.CharField(max_length=20, blank=True)
    document_type = models.CharField(max_length=50, default='ID')
    document_number = models.CharField(max_length=50, unique=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True)
    occupation = models.CharField(max_length=100, blank=True)
    emergency_contact_name = models.CharField(max_length=200, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_patients'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.document_number})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


class PatientAddress(models.Model):
    ADDRESS_TYPES = [
        ('home', 'Home'),
        ('work', 'Work'),
        ('other', 'Other'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='addresses')
    address_type = models.CharField(max_length=20, choices=ADDRESS_TYPES, default='home')
    street = models.CharField(max_length=255)
    number = models.CharField(max_length=20)
    complement = models.CharField(max_length=100, blank=True)
    neighborhood = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='Brazil')
    is_primary = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_primary', '-created_at']
        verbose_name_plural = 'Patient Addresses'

    def __str__(self):
        return f"{self.street}, {self.number} - {self.city}/{self.state}"

    def save(self, *args, **kwargs):
        if self.is_primary:
            PatientAddress.objects.filter(patient=self.patient, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)
