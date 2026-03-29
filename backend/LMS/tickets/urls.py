from django.urls import path
from .views import TicketCreateView, TicketListView, TicketUpdateView

urlpatterns = [
    path('create/', TicketCreateView.as_view(), name='ticket-create'),
    path('list/', TicketListView.as_view(), name='ticket-list'),
    path('<int:pk>/update/', TicketUpdateView.as_view(), name='ticket-update'),
]
