from rest_framework import serializers
from .models import (
    FieldType, HealthProblemType, FormQuestion,
    PatientHealthProblem, FormResponse, AuditLog
)


class FieldTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FieldType
        fields = ['id', 'name', 'code', 'description', 'has_options', 'icon']


class FormQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormQuestion
        fields = [
            'id', 'label', 'field_type', 'placeholder', 'help_text',
            'is_required', 'options', 'validation_rules', 'order',
            'section', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class HealthProblemTypeSerializer(serializers.ModelSerializer):
    form_questions = FormQuestionSerializer(many=True, read_only=True)
    questions_count = serializers.SerializerMethodField()
    patients_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = HealthProblemType
        fields = [
            'id', 'name', 'code', 'description', 'color', 'icon',
            'is_active', 'question_schema', 'schema_version',
            'form_questions', 'questions_count', 'patients_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['schema_version', 'created_at', 'updated_at', 'created_by']

    def get_questions_count(self, obj):
        return obj.form_questions.filter(is_active=True).count()

    def get_patients_count(self, obj):
        return obj.patient_instances.count()

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name()
        return None


class HealthProblemTypeListSerializer(serializers.ModelSerializer):
    questions_count = serializers.SerializerMethodField()
    patients_count = serializers.SerializerMethodField()

    class Meta:
        model = HealthProblemType
        fields = [
            'id', 'name', 'code', 'description', 'color', 'icon',
            'is_active', 'questions_count', 'patients_count', 'created_at'
        ]

    def get_questions_count(self, obj):
        return obj.form_questions.filter(is_active=True).count()

    def get_patients_count(self, obj):
        return obj.patient_instances.count()


class FormResponseSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = FormResponse
        fields = [
            'id', 'answers', 'schema_version', 'submitted_by',
            'submitted_by_name', 'submitted_at', 'updated_at'
        ]
        read_only_fields = ['schema_version', 'submitted_by', 'submitted_at', 'updated_at']

    def get_submitted_by_name(self, obj):
        if obj.submitted_by:
            return obj.submitted_by.get_full_name()
        return None


class PatientHealthProblemSerializer(serializers.ModelSerializer):
    form_responses = FormResponseSerializer(many=True, read_only=True)
    health_problem_type_name = serializers.SerializerMethodField()
    health_problem_type_color = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()
    registered_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()

    class Meta:
        model = PatientHealthProblem
        fields = [
            'id', 'patient', 'patient_name', 'health_problem_type',
            'health_problem_type_name', 'health_problem_type_color',
            'status', 'severity', 'onset_date', 'diagnosis_date',
            'resolution_date', 'notes', 'registered_by', 'registered_by_name',
            'assigned_to', 'assigned_to_name', 'schema_version_used',
            'form_responses', 'created_at', 'updated_at'
        ]
        read_only_fields = ['registered_by', 'schema_version_used', 'created_at', 'updated_at']

    def get_health_problem_type_name(self, obj):
        return obj.health_problem_type.name

    def get_health_problem_type_color(self, obj):
        return obj.health_problem_type.color

    def get_patient_name(self, obj):
        return obj.patient.get_full_name()

    def get_registered_by_name(self, obj):
        if obj.registered_by:
            return obj.registered_by.get_full_name()
        return None

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name()
        return None


class PatientHealthProblemCreateSerializer(serializers.ModelSerializer):
    answers = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = PatientHealthProblem
        fields = [
            'patient', 'health_problem_type', 'status', 'severity',
            'onset_date', 'diagnosis_date', 'notes', 'assigned_to', 'answers'
        ]

    def create(self, validated_data):
        answers = validated_data.pop('answers', {})
        health_problem_type = validated_data['health_problem_type']
        validated_data['schema_version_used'] = health_problem_type.schema_version
        instance = PatientHealthProblem.objects.create(**validated_data)
        if answers:
            FormResponse.objects.create(
                patient_health_problem=instance,
                answers=answers,
                schema_version=health_problem_type.schema_version,
                submitted_by=validated_data.get('registered_by')
            )
        return instance


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'action', 'model_name',
            'object_id', 'object_repr', 'changes', 'ip_address',
            'user_agent', 'timestamp'
        ]

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name()
        return None
