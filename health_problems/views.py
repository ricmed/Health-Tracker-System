from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import (
    FieldType, HealthProblemType, FormQuestion,
    PatientHealthProblem, FormResponse, AuditLog
)
from .serializers import (
    FieldTypeSerializer, HealthProblemTypeSerializer,
    HealthProblemTypeListSerializer, FormQuestionSerializer,
    PatientHealthProblemSerializer, PatientHealthProblemCreateSerializer,
    FormResponseSerializer, AuditLogSerializer
)


class FieldTypeViewSet(viewsets.ModelViewSet):
    queryset = FieldType.objects.all()
    serializer_class = FieldTypeSerializer


class HealthProblemTypeViewSet(viewsets.ModelViewSet):
    queryset = HealthProblemType.objects.all()
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return HealthProblemTypeListSerializer
        return HealthProblemTypeSerializer

    def get_queryset(self):
        queryset = HealthProblemType.objects.all()
        is_active = self.request.query_params.get('is_active')
        search = self.request.query_params.get('search')

        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(code__icontains=search) |
                Q(description__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        health_problem = self.get_object()
        health_problem.is_active = not health_problem.is_active
        health_problem.save()
        return Response(HealthProblemTypeSerializer(health_problem).data)

    @action(detail=True, methods=['post'])
    def add_question(self, request, pk=None):
        health_problem = self.get_object()
        serializer = FormQuestionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(health_problem_type=health_problem)
            return Response(HealthProblemTypeSerializer(health_problem).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def questions(self, request, pk=None):
        health_problem = self.get_object()
        questions = health_problem.form_questions.filter(is_active=True)
        serializer = FormQuestionSerializer(questions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def permitted(self, request):
        user = request.user
        if user.is_superuser:
            queryset = HealthProblemType.objects.filter(is_active=True)
        else:
            queryset = user.health_problem_permissions.filter(is_active=True)
        serializer = HealthProblemTypeSerializer(queryset, many=True)
        return Response(serializer.data)


class FormQuestionViewSet(viewsets.ModelViewSet):
    queryset = FormQuestion.objects.all()
    serializer_class = FormQuestionSerializer

    def get_queryset(self):
        queryset = FormQuestion.objects.all()
        health_problem_type = self.request.query_params.get('health_problem_type')
        if health_problem_type:
            queryset = queryset.filter(health_problem_type_id=health_problem_type)
        return queryset

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        question = self.get_object()
        question.is_active = not question.is_active
        question.save()
        return Response(FormQuestionSerializer(question).data)

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        orders = request.data.get('orders', [])
        for item in orders:
            FormQuestion.objects.filter(id=item['id']).update(order=item['order'])
        return Response({'message': 'Questions reordered successfully'})


class PatientHealthProblemViewSet(viewsets.ModelViewSet):
    queryset = PatientHealthProblem.objects.all()
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'status', 'severity']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PatientHealthProblemCreateSerializer
        return PatientHealthProblemSerializer

    def get_queryset(self):
        queryset = PatientHealthProblem.objects.all()
        patient = self.request.query_params.get('patient')
        health_problem_type = self.request.query_params.get('health_problem_type')
        status_filter = self.request.query_params.get('status')
        severity = self.request.query_params.get('severity')

        if patient:
            queryset = queryset.filter(patient_id=patient)
        if health_problem_type:
            queryset = queryset.filter(health_problem_type_id=health_problem_type)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if severity:
            queryset = queryset.filter(severity=severity)

        return queryset

    def perform_create(self, serializer):
        health_problem_type = serializer.validated_data['health_problem_type']
        user = self.request.user
        if not user.is_superuser and not user.health_problem_permissions.filter(
            id=health_problem_type.id
        ).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You do not have permission to register this health problem type')
        serializer.save(registered_by=user)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        instance = self.get_object()
        new_status = request.data.get('status')
        if new_status in dict(PatientHealthProblem.STATUS_CHOICES):
            instance.status = new_status
            if new_status == 'resolved':
                from datetime import date
                instance.resolution_date = date.today()
            instance.save()
            return Response(PatientHealthProblemSerializer(instance).data)
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_response(self, request, pk=None):
        instance = self.get_object()
        answers = request.data.get('answers', {})
        response = FormResponse.objects.create(
            patient_health_problem=instance,
            answers=answers,
            schema_version=instance.health_problem_type.schema_version,
            submitted_by=request.user
        )
        return Response(FormResponseSerializer(response).data, status=status.HTTP_201_CREATED)


class FormResponseViewSet(viewsets.ModelViewSet):
    queryset = FormResponse.objects.all()
    serializer_class = FormResponseSerializer

    def get_queryset(self):
        queryset = FormResponse.objects.all()
        patient_health_problem = self.request.query_params.get('patient_health_problem')
        if patient_health_problem:
            queryset = queryset.filter(patient_health_problem_id=patient_health_problem)
        return queryset

    def perform_create(self, serializer):
        patient_health_problem = serializer.validated_data['patient_health_problem']
        serializer.save(
            submitted_by=self.request.user,
            schema_version=patient_health_problem.health_problem_type.schema_version
        )

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['patch'])
    def update_answers(self, request, pk=None):
        response = self.get_object()
        answers = request.data.get('answers', {})
        response.answers = answers
        response.save()
        return Response(FormResponseSerializer(response).data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        queryset = AuditLog.objects.all()
        model_name = self.request.query_params.get('model_name')
        action = self.request.query_params.get('action')
        user = self.request.query_params.get('user')

        if model_name:
            queryset = queryset.filter(model_name=model_name)
        if action:
            queryset = queryset.filter(action=action)
        if user:
            queryset = queryset.filter(user_id=user)

        return queryset
