from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def api_root(request):
    return JsonResponse({
        'message': 'Health Problem Registration & Monitoring System API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/',
            'patients': '/api/patients/',
            'health_problems': '/api/health-problems/',
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/auth/', include('accounts.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/health-problems/', include('health_problems.urls')),
]
