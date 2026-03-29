from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import MusterSession, MusterEntry
from .serializers import MusterSessionSerializer, MusterEntrySerializer
from labs.models import Lab, PC


# -------------------- DRF API ENDPOINTS --------------------

from rest_framework.decorators import action

class MusterSessionViewSet(viewsets.ModelViewSet):
    queryset = MusterSession.objects.all().order_by('-date', '-time')
    serializer_class = MusterSessionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def entries(self, request, pk=None):
        session = self.get_object()
        entries_data = request.data.get('entries', [])
        
        # Clear existing entries if re-saving
        session.entries.all().delete()
        
        created_entries = []
        for entry in entries_data:
            new_entry = MusterEntry.objects.create(
                session=session,
                sr_no=entry.get('sr_no'),
                roll_no=entry.get('roll_no'),
                pc_id=entry.get('pc')
            )
            created_entries.append(new_entry)
            
        return Response({'status': 'Entries synchronized', 'count': len(created_entries)})


class PCsForLab(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, lab_id):
        pcs = PC.objects.filter(lab_id=lab_id).values('id', 'device_name')
        return Response(list(pcs))


# -------------------- HTML Template Views --------------------

@login_required
def muster_register(request):
    if request.method == 'POST':
        date = request.POST.get('date')
        time_str = request.POST.get('time')
        lab_id = request.POST.get('lab')
        class_name = request.POST.get('class_name')
        batch = request.POST.get('batch')

        rounded_time = _round_time_to_30min(time_str)

        session = MusterSession.objects.create(
            date=date,
            time=rounded_time,
            lab_id=lab_id,
            class_name=class_name,
            batch=batch
        )
        from django.shortcuts import redirect
        return redirect('muster_edit', session_id=session.id)

    labs = Lab.objects.all()
    return render(request, 'muster/muster_register.html', {'labs': labs})


@login_required
def muster_edit(request, session_id):
    session = get_object_or_404(MusterSession, id=session_id)
    entries = session.entries.all()
    pcs = PC.objects.filter(lab=session.lab)
    return render(request, 'muster/muster_edit.html', {
        'session': session,
        'entries': entries,
        'pcs': pcs
    })


@login_required
def muster_list(request):
    sessions = MusterSession.objects.all().order_by('-date', '-time')
    return render(request, 'muster/muster_list.html', {'sessions': sessions})


@login_required
def get_pcs_for_lab(request, lab_id):
    """AJAX endpoint to get PCs for a given lab."""
    from django.http import JsonResponse
    pcs = PC.objects.filter(lab_id=lab_id).values('id', 'device_name')
    return JsonResponse(list(pcs), safe=False)


# -------------------- Helpers --------------------

def _round_time_to_30min(time_str):
    """Round a time string (HH:MM) to the nearest 30-minute mark."""
    from datetime import datetime
    time_obj = datetime.strptime(time_str, '%H:%M').time()
    minute = time_obj.minute
    hour = time_obj.hour
    if minute < 15:
        rounded_minute = 0
    elif minute < 45:
        rounded_minute = 30
    else:
        rounded_minute = 0
        hour = (hour + 1) % 24
    return f"{hour:02d}:{rounded_minute:02d}:00"
