from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DashboardViewSet, DashboardPanelViewSet, DashboardFilterViewSet,
    DashboardTextBlockViewSet, DashboardDataView, FilterOptionsView
)

router = DefaultRouter()
router.register('dashboards', DashboardViewSet)
router.register('panels', DashboardPanelViewSet)
router.register('filters', DashboardFilterViewSet)
router.register('text-blocks', DashboardTextBlockViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboards/<int:dashboard_id>/data/', DashboardDataView.as_view(), name='dashboard-data'),
    path('filter-options/', FilterOptionsView.as_view(), name='filter-options'),
]
