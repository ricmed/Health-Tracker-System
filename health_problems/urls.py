from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'field-types', views.FieldTypeViewSet)
router.register(r'types', views.HealthProblemTypeViewSet)
router.register(r'questions', views.FormQuestionViewSet)
router.register(r'patient-problems', views.PatientHealthProblemViewSet)
router.register(r'form-responses', views.FormResponseViewSet)
router.register(r'audit-logs', views.AuditLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
