from django.urls import path
from django.urls import include  # not used here; keep only if needed
from . import views

urlpatterns = [
    path('users/', views.UserList.as_view(), name='user-list'),
    path('users/<int:pk>/', views.UserDetail.as_view(), name='user-detail'),
    path('labs/', views.LabList.as_view(), name='lab-list'),
    path('labs/<int:pk>/', views.LabDetail.as_view(), name='lab-detail'),
    path('labs/<int:lab_id>/pcs/', views.LabPCList.as_view(), name='lab-pc-list'),
    path('pcs/', views.PCList.as_view(), name='pc-list'),
    path('pcs/<int:pk>/', views.PCDetail.as_view(), name='pc-detail'),
    path('software/', views.SoftwareList.as_view(), name='software-list'),
    path('software/<int:pk>/', views.SoftwareDetail.as_view(), name='software-detail'),
    path('equipment/', views.EquipmentList.as_view(), name='equipment-list'),
    path('equipment/<int:pk>/', views.EquipmentDetail.as_view(), name='equipment-detail'),
    path('maintenance/', views.MaintenanceLogList.as_view(), name='maintenance-log-list'),
    path('maintenance/<int:pk>/', views.MaintenanceLogDetail.as_view(), name='maintenance-log-detail'),
    path('inventory/', views.InventoryList.as_view(), name='inventory-list'),
    path('inventory/<int:pk>/', views.InventoryDetail.as_view(), name='inventory-detail'),
    path('redirect-after-login/', views.redirect_after_login, name='redirect-after-login'),
    path('labs/import/', views.import_data_api, name='labs-import'),
]
