from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
import json
from .models import MusterSession, MusterEntry
from labs.models import Lab, PC
from .serializers import MusterSessionSerializer, MusterEntrySerializer
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status

# HTML views (for non-AJAX usage, if needed)
@login_required
def muster_register(request):
    if request.method == 'POST':
        date = request.POST.get('date')
        time_str = request.POST.get('time')
        lab_id = request.POST.get('lab')
        class_name = request.POST.get('class_name')
        batch = request.POST.get('batch')

        # Round time to nearest 30 minutes
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
        rounded_time = f"{hour:02d}:{rounded_minute:02d}:00"

        session = MusterSession.objects.create(
            date=date,
            time=rounded_time,
            lab_id=lab_id,
            class_name=class_name,
            batch=batch
        )
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

# -------------------- DRF API ENDPOINTS (REST API for Muster) -----------------
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class MusterSessionViewSet(viewsets.ModelViewSet):
    queryset = MusterSession.objects.all()
    serializer_class = MusterSessionSerializer
    permission_classes = [IsAuthenticated]

class PCsForLab(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, lab_id):
        pcs = PC.objects.filter(lab_id=lab_id).values('id', 'device_name')
        return Response(list(pcs))

# API views for React frontend
@csrf_exempt
@require_http_methods(["POST"])
def create_muster_session(request):
    try:
        data = json.loads(request.body)
        date = data.get('date')
        time_str = data.get('time')
        lab_id = data.get('lab')
        class_name = data.get('class_name')
        batch = data.get('batch')

        # Round time to nearest 30 minutes
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
        rounded_time = f"{hour:02d}:{rounded_minute:02d}:00"

        session = MusterSession.objects.create(
            date=date,
            time=rounded_time,
            lab_id=lab_id,
            class_name=class_name,
            batch=batch
        )
        return JsonResponse({
            'id': session.id,
            'date': str(session.date),
            'time': str(session.time),
            'lab': session.lab.id,
            'lab_name': session.lab.name,
            'class_name': session.class_name,
            'batch': session.batch,
            'created_at': session.created_at.isoformat(),
            'entries': []
        }, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET"])
def list_muster_sessions(request):
    sessions = MusterSession.objects.all().order_by('-date', '-time')
    data = []
    for session in sessions:
        data.append({
            'id': session.id,
            'date': str(session.date),
            'time': str(session.time),
            'lab': session.lab.id,
            'lab_name': session.lab.name,
            'class_name': session.class_name,
            'batch': session.batch,
            'created_at': session.created_at.isoformat(),
            'entry_count': session.entries.count()
        })
    return JsonResponse(data, safe=False)

@csrf_exempt
@require_http_methods(["GET"])
def get_muster_session(request, session_id):
    session = get_object_or_404(MusterSession, id=session_id)
    entries = session.entries.all().order_by('sr_no')
    entries_data = []
    for entry in entries:
        entries_data.append({
            'id': entry.id,
            'sr_no': entry.sr_no,
            'roll_no': entry.roll_no,
            'pc': entry.pc.id,
            'pc_name': entry.pc.device_name
        })
    data = {
        'id': session.id,
        'date': str(session.date),
        'time': str(session.time),
        'lab': session.lab.id,
        'lab_name': session.lab.name,
        'class_name': session.class_name,
        'batch': session.batch,
        'created_at': session.created_at.isoformat(),
        'entries': entries_data
    }
    return JsonResponse(data)

@csrf_exempt
@require_http_methods(["PUT"])
def update_muster_session(request, session_id):
    session = get_object_or_404(MusterSession, id=session_id)
    try:
        data = json.loads(request.body)
        # Update session fields
        session.date = data.get('date', session.date)
        time_str = data.get('time')
        if time_str:
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
            session.time = f"{hour:02d}:{rounded_minute:02d}:00"
        session.lab_id = data.get('lab', session.lab_id)
        session.class_name = data.get('class_name', session.class_name)
        session.batch = data.get('batch', session.batch)
        session.save()

        # Update entries: delete all and recreate
        session.entries.all().delete()
        entries_data = data.get('entries', [])
        for entry_data in entries_data:
            sr_no = entry_data.get('sr_no')
            roll_no = entry_data.get('roll_no')
            pc_id = entry_data.get('pc_id')
            if sr_no is not None and roll_no and pc_id:
                MusterEntry.objects.create(
                    session=session,
                    sr_no=sr_no,
                    roll_no=roll_no,
                    pc_id=pc_id
                )
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["DELETE"])
def delete_muster_session(request, session_id):
    session = get_object_or_404(MusterSession, id=session_id)
    session.delete()
    return JsonResponse({'status': 'success'})

@login_required
@csrf_exempt
@require_http_methods(["POST"])
def save_muster_entries(request, session_id):
    """
    AJAX endpoint to save muster entries for a session.
    Expects JSON: {'entries': [{'sr_no': 1, 'roll_no': '123', 'pc_id': 5}, ...]}
    """
    session = get_object_or_404(MusterSession, id=session_id)
    try:
        data = json.loads(request.body)
        entries_data = data.get('entries', [])
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    # Clear existing entries for this session
    session.entries.all().delete()

    # Create new entries
    for entry_data in entries_data:
        sr_no = entry_data.get('sr_no')
        roll_no = entry_data.get('roll_no')
        pc_id = entry_data.get('pc_id')
        if sr_no is not None and roll_no and pc_id:
            MusterEntry.objects.create(
                session=session,
                sr_no=sr_no,
                roll_no=roll_no,
                pc_id=pc_id
            )
    return JsonResponse({'status': 'success'})

@login_required
def get_pcs_for_lab(request, lab_id):
    """
    AJAX endpoint to get PCs for a given lab.
    Returns JSON: [{'id': 1, 'device_name': 'PC001'}, ...]
    """
    pcs = PC.objects.filter(lab_id=lab_id).values('id', 'device_name')
    return JsonResponse(list(pcs), safe=False)
