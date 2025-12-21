from rest_framework import serializers
from .models import Patient, PatientAddress


class PatientAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientAddress
        fields = [
            'id', 'address_type', 'street', 'number', 'complement',
            'neighborhood', 'city', 'state', 'postal_code', 'country',
            'is_primary', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class PatientSerializer(serializers.ModelSerializer):
    addresses = PatientAddressSerializer(many=True, read_only=True)
    age = serializers.ReadOnlyField()
    full_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'date_of_birth',
            'age', 'gender', 'email', 'phone', 'secondary_phone',
            'document_type', 'document_number', 'marital_status',
            'occupation', 'emergency_contact_name', 'emergency_contact_phone',
            'notes', 'is_active', 'addresses', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None


class PatientCreateSerializer(serializers.ModelSerializer):
    addresses = PatientAddressSerializer(many=True, required=False)

    class Meta:
        model = Patient
        fields = [
            'first_name', 'last_name', 'date_of_birth', 'gender',
            'email', 'phone', 'secondary_phone', 'document_type',
            'document_number', 'marital_status', 'occupation',
            'emergency_contact_name', 'emergency_contact_phone',
            'notes', 'addresses'
        ]

    def create(self, validated_data):
        addresses_data = validated_data.pop('addresses', [])
        patient = Patient.objects.create(**validated_data)
        for address_data in addresses_data:
            PatientAddress.objects.create(patient=patient, **address_data)
        return patient

    def update(self, instance, validated_data):
        addresses_data = validated_data.pop('addresses', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if addresses_data is not None:
            instance.addresses.all().delete()
            for address_data in addresses_data:
                PatientAddress.objects.create(patient=instance, **address_data)
        return instance


class PatientListSerializer(serializers.ModelSerializer):
    age = serializers.ReadOnlyField()
    full_name = serializers.SerializerMethodField()
    primary_address = serializers.SerializerMethodField()
    health_problems_count = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'date_of_birth',
            'age', 'gender', 'phone', 'document_number', 'is_active',
            'primary_address', 'health_problems_count', 'created_at'
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_primary_address(self, obj):
        address = obj.addresses.filter(is_primary=True).first()
        if address:
            return f"{address.city}, {address.state}"
        return None

    def get_health_problems_count(self, obj):
        return obj.health_problems.count()
