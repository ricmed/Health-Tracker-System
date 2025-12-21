from django.db.models import Q
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Patient, PatientAddress
from .serializers import (
    PatientSerializer, PatientCreateSerializer,
    PatientListSerializer, PatientAddressSerializer
)


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'first_name', 'last_name', 'date_of_birth']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return PatientListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return PatientCreateSerializer
        return PatientSerializer

    def get_queryset(self):
        queryset = Patient.objects.all()
        search = self.request.query_params.get('search')
        is_active = self.request.query_params.get('is_active')
        gender = self.request.query_params.get('gender')

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(document_number__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if gender:
            queryset = queryset.filter(gender=gender)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        patient = self.get_object()
        patient.is_active = not patient.is_active
        patient.save()
        return Response(PatientSerializer(patient).data)

    @action(detail=True, methods=['get'])
    def health_problems(self, request, pk=None):
        from health_problems.models import PatientHealthProblem
        from health_problems.serializers import PatientHealthProblemSerializer
        patient = self.get_object()
        problems = PatientHealthProblem.objects.filter(patient=patient)
        serializer = PatientHealthProblemSerializer(problems, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if len(query) < 2:
            return Response([])
        patients = Patient.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(document_number__icontains=query)
        )[:10]
        serializer = PatientListSerializer(patients, many=True)
        return Response(serializer.data)


class PatientAddressViewSet(viewsets.ModelViewSet):
    queryset = PatientAddress.objects.all()
    serializer_class = PatientAddressSerializer

    def get_queryset(self):
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            return PatientAddress.objects.filter(patient_id=patient_id)
        return PatientAddress.objects.all()

    @action(detail=True, methods=['post'])
    def set_primary(self, request, pk=None):
        address = self.get_object()
        PatientAddress.objects.filter(patient=address.patient).update(is_primary=False)
        address.is_primary = True
        address.save()
        return Response(PatientAddressSerializer(address).data)
