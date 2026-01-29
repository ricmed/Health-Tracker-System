from django.db.models import Count, Sum, Avg, Min, Max, Q
from django.db.models.functions import TruncMonth, TruncWeek, TruncDay
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from health_problems.models import PatientHealthProblem, FormResponse, HealthProblemType
from patients.models import Patient

from .models import (
    Dashboard, DashboardTextBlock, DashboardFilter,
    DashboardPanel, DashboardPermission
)
from .serializers import (
    DashboardListSerializer, DashboardDetailSerializer, DashboardCreateSerializer,
    DashboardPanelSerializer, DashboardFilterSerializer,
    DashboardTextBlockSerializer, DashboardPermissionSerializer
)


class IsPublicOrAuthenticated(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if obj.is_public:
            return True
        return request.user and request.user.is_authenticated


class DashboardViewSet(viewsets.ModelViewSet):
    queryset = Dashboard.objects.all()

    def get_permissions(self):
        if self.action in ['retrieve', 'public']:
            return [IsPublicOrAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'list':
            return DashboardListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return DashboardCreateSerializer
        return DashboardDetailSerializer

    def get_queryset(self):
        queryset = Dashboard.objects.select_related(
            'health_problem_type', 'created_by'
        ).prefetch_related('panels', 'filters', 'text_blocks', 'permissions')

        if self.action == 'list':
            user = self.request.user
            if user.is_authenticated:
                queryset = queryset.filter(
                    Q(is_public=True) |
                    Q(created_by=user) |
                    Q(permissions__user=user)
                ).distinct()
            else:
                queryset = queryset.filter(is_public=True)

        health_problem_type = self.request.query_params.get('health_problem_type')
        if health_problem_type:
            queryset = queryset.filter(health_problem_type_id=health_problem_type)

        is_public = self.request.query_params.get('is_public')
        if is_public is not None:
            queryset = queryset.filter(is_public=is_public.lower() == 'true')

        return queryset

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def public(self, request):
        queryset = Dashboard.objects.filter(
            is_public=True, is_active=True
        ).select_related('health_problem_type')
        
        grouped = {}
        for dashboard in queryset:
            hp_name = dashboard.health_problem_type.name
            hp_id = dashboard.health_problem_type.id
            hp_color = dashboard.health_problem_type.color
            if hp_id not in grouped:
                grouped[hp_id] = {
                    'health_problem_type_id': hp_id,
                    'health_problem_type_name': hp_name,
                    'health_problem_type_color': hp_color,
                    'dashboards': []
                }
            grouped[hp_id]['dashboards'].append(
                DashboardListSerializer(dashboard).data
            )
        
        return Response(list(grouped.values()))

    @action(detail=True, methods=['post'])
    def add_panel(self, request, pk=None):
        dashboard = self.get_object()
        serializer = DashboardPanelSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(dashboard=dashboard)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_filter(self, request, pk=None):
        dashboard = self.get_object()
        serializer = DashboardFilterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(dashboard=dashboard)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_text_block(self, request, pk=None):
        dashboard = self.get_object()
        serializer = DashboardTextBlockSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(dashboard=dashboard)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_permission(self, request, pk=None):
        dashboard = self.get_object()
        serializer = DashboardPermissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(dashboard=dashboard)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def toggle_public(self, request, pk=None):
        dashboard = self.get_object()
        dashboard.is_public = not dashboard.is_public
        dashboard.save()
        return Response(DashboardDetailSerializer(dashboard).data)


class DashboardPanelViewSet(viewsets.ModelViewSet):
    queryset = DashboardPanel.objects.all()
    serializer_class = DashboardPanelSerializer

    def get_queryset(self):
        dashboard_id = self.request.query_params.get('dashboard')
        if dashboard_id:
            return self.queryset.filter(dashboard_id=dashboard_id)
        return self.queryset


class DashboardFilterViewSet(viewsets.ModelViewSet):
    queryset = DashboardFilter.objects.all()
    serializer_class = DashboardFilterSerializer


class DashboardTextBlockViewSet(viewsets.ModelViewSet):
    queryset = DashboardTextBlock.objects.all()
    serializer_class = DashboardTextBlockSerializer


class DashboardDataView(APIView):
    permission_classes = [IsPublicOrAuthenticated]

    def post(self, request, dashboard_id):
        try:
            dashboard = Dashboard.objects.get(id=dashboard_id)
        except Dashboard.DoesNotExist:
            return Response({'error': 'Dashboard not found'}, status=404)

        if not dashboard.is_public and not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=403)

        filters = request.data.get('filters', {})
        panel_id = request.data.get('panel_id')

        if panel_id:
            panels = dashboard.panels.filter(id=panel_id, is_visible=True)
        else:
            panels = dashboard.panels.filter(is_visible=True)

        results = {}
        for panel in panels:
            results[panel.id] = self._get_panel_data(panel, dashboard, filters)

        return Response(results)

    def _get_panel_data(self, panel, dashboard, filters):
        health_problem_type = dashboard.health_problem_type
        
        queryset = PatientHealthProblem.objects.filter(
            health_problem_type=health_problem_type
        ).select_related('patient')

        queryset = self._apply_filters(queryset, filters)

        aggregation = panel.aggregation
        group_by = panel.group_by
        x_axis_field = panel.x_axis_field

        if panel.chart_type == 'metric':
            return self._get_metric_data(queryset, panel)
        elif panel.chart_type == 'choropleth':
            return self._get_choropleth_data(queryset, panel)
        elif panel.chart_type == 'table':
            return self._get_table_data(queryset, panel)
        elif panel.chart_type in ['line', 'area', 'timeline']:
            return self._get_time_series_data(queryset, panel)
        else:
            return self._get_grouped_data(queryset, panel)

    def _apply_filters(self, queryset, filters):
        for field_path, value in filters.items():
            if value is None or value == '':
                continue

            if field_path == 'status':
                queryset = queryset.filter(status=value)
            elif field_path == 'severity':
                queryset = queryset.filter(severity=value)
            elif field_path == 'patient.state':
                queryset = queryset.filter(patient__addresses__state=value)
            elif field_path == 'patient.city':
                queryset = queryset.filter(patient__addresses__city=value)
            elif field_path == 'onset_date_from':
                queryset = queryset.filter(onset_date__gte=value)
            elif field_path == 'onset_date_to':
                queryset = queryset.filter(onset_date__lte=value)
            elif field_path == 'diagnosis_date_from':
                queryset = queryset.filter(diagnosis_date__gte=value)
            elif field_path == 'diagnosis_date_to':
                queryset = queryset.filter(diagnosis_date__lte=value)

        return queryset

    def _get_metric_data(self, queryset, panel):
        agg = panel.aggregation
        if agg == 'count':
            value = queryset.count()
        elif agg == 'distinct':
            value = queryset.values('patient').distinct().count()
        else:
            value = queryset.count()

        return {
            'type': 'metric',
            'value': value,
            'title': panel.title
        }

    def _get_choropleth_data(self, queryset, panel):
        state_counts = queryset.filter(
            patient__addresses__is_primary=True
        ).values(
            'patient__addresses__state'
        ).annotate(count=Count('id')).order_by()

        data = {
            item['patient__addresses__state']: item['count']
            for item in state_counts if item['patient__addresses__state']
        }

        return {
            'type': 'choropleth',
            'data': data,
            'title': panel.title
        }

    def _get_table_data(self, queryset, panel):
        data = []
        for php in queryset[:100]:
            data.append({
                'patient_name': php.patient.get_full_name(),
                'status': php.status,
                'severity': php.severity,
                'onset_date': php.onset_date.isoformat() if php.onset_date else None,
                'diagnosis_date': php.diagnosis_date.isoformat() if php.diagnosis_date else None,
            })

        return {
            'type': 'table',
            'data': data,
            'title': panel.title
        }

    def _get_time_series_data(self, queryset, panel):
        group_by = panel.group_by or 'month'
        
        if group_by == 'day':
            trunc_func = TruncDay
        elif group_by == 'week':
            trunc_func = TruncWeek
        else:
            trunc_func = TruncMonth

        date_field = panel.x_axis_field or 'created_at'
        
        data = queryset.annotate(
            period=trunc_func(date_field)
        ).values('period').annotate(
            count=Count('id')
        ).order_by('period')

        labels = []
        values = []
        for item in data:
            if item['period']:
                labels.append(item['period'].isoformat())
                values.append(item['count'])

        return {
            'type': 'time_series',
            'labels': labels,
            'values': values,
            'title': panel.title
        }

    def _get_grouped_data(self, queryset, panel):
        group_by = panel.group_by or 'status'
        
        if group_by == 'status':
            data = queryset.values('status').annotate(count=Count('id')).order_by()
            labels = [item['status'] for item in data]
            values = [item['count'] for item in data]
        elif group_by == 'severity':
            data = queryset.values('severity').annotate(count=Count('id')).order_by()
            labels = [item['severity'] for item in data]
            values = [item['count'] for item in data]
        elif group_by == 'patient.state':
            data = queryset.filter(
                patient__addresses__is_primary=True
            ).values(
                'patient__addresses__state'
            ).annotate(count=Count('id')).order_by('-count')[:15]
            labels = [item['patient__addresses__state'] or 'Unknown' for item in data]
            values = [item['count'] for item in data]
        elif group_by == 'patient.gender':
            data = queryset.values('patient__gender').annotate(count=Count('id')).order_by()
            labels = [item['patient__gender'] or 'Unknown' for item in data]
            values = [item['count'] for item in data]
        else:
            data = queryset.values(group_by).annotate(count=Count('id')).order_by()
            labels = [str(item[group_by]) for item in data]
            values = [item['count'] for item in data]

        return {
            'type': 'grouped',
            'labels': labels,
            'values': values,
            'title': panel.title
        }


class FilterOptionsView(APIView):
    def get(self, request):
        field_path = request.query_params.get('field_path')
        health_problem_type_id = request.query_params.get('health_problem_type')

        if not field_path:
            return Response({'error': 'field_path is required'}, status=400)

        options = []

        if field_path == 'status':
            options = [
                {'value': 'active', 'label': 'Active'},
                {'value': 'monitoring', 'label': 'Under Monitoring'},
                {'value': 'resolved', 'label': 'Resolved'},
                {'value': 'chronic', 'label': 'Chronic'},
            ]
        elif field_path == 'severity':
            options = [
                {'value': 'low', 'label': 'Low'},
                {'value': 'medium', 'label': 'Medium'},
                {'value': 'high', 'label': 'High'},
                {'value': 'critical', 'label': 'Critical'},
            ]
        elif field_path == 'patient.state':
            from patients.models import PatientAddress
            states = PatientAddress.objects.values_list(
                'state', flat=True
            ).distinct().order_by('state')
            options = [{'value': s, 'label': s} for s in states if s]
        elif field_path == 'patient.city':
            from patients.models import PatientAddress
            state = request.query_params.get('state')
            cities_qs = PatientAddress.objects.all()
            if state:
                cities_qs = cities_qs.filter(state=state)
            cities = cities_qs.values_list('city', flat=True).distinct().order_by('city')
            options = [{'value': c, 'label': c} for c in cities if c]

        return Response(options)
