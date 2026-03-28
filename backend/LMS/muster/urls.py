from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MusterSessionViewSet, PCsForLab
from django.views.generic import RedirectView

router = DefaultRouter()
router.register(r'sessions', MusterSessionViewSet, basename='muster-session')

urlpatterns = [
    path('', RedirectView.as_view(url='/muster/sessions/', permanent=False)),
    path('', include(router.urls)),  # DRF endpoints: /muster/sessions/
    path('pcs-for-lab/<int:lab_id>/', PCsForLab.as_view(), name='pcs-for-lab'),
]
