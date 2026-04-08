# Lab Management System (LMS) — Copilot Instructions

## Project Overview

A **Lab Management System** for college computer labs. Django REST API backend, React + TypeScript frontend. Manages labs, PCs, equipment, software, maintenance logs, tickets, muster registers, and notifications.

## Quick Commands

```bash
# Backend (from backend/LMS/)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8001
python manage.py test
python manage.py createsuperuser
python manage.py check_escalations       # daily cron: escalate stale maintenance logs

# Frontend (from frontend/)
npm install
npm run dev          # Vite dev server on :5173
npm run build
npm run lint
```

## Architecture

```
backend/LMS/
├── LMS/               # Django project config (settings, root urls, wsgi)
├── labs/              # Core app — owns User model + Lab, PC, CPU, OS, Peripheral,
│                      #   Software, LabEquipment (with subtables), MaintenanceLog
├── notifications/     # Notification model, escalation service, email/SMS, management command
├── tickets/           # Student support tickets
├── users/             # Auth endpoints (register, login) — re-exports labs.User, does NOT define its own
├── muster/            # Muster attendance (MusterSession, MusterEntry) — DRF ViewSet + HTML template views
└── manage.py

frontend/src/
├── pages/             # Route-level components (Login, Dashboard, Labs, Maintenance, etc.)
├── components/        # Reusable UI (AppLayout, Sidebar, HeaderBar, ProtectedRoute)
├── contexts/          # AuthContext (JWT state), ThemeContext (dark/light)
├── services/          # api.ts — axios wrapper with token interceptors
├── types/             # Shared TypeScript interfaces
└── assets/
```

### Critical: User Model Ownership

`AUTH_USER_MODEL = 'labs.User'` — the **labs** app owns the canonical User model. The **users** app re-exports it (`from labs.models import User`). **Never define a second User model** — it will break authentication across the entire project.

### User Roles

Only two roles exist: `admin` and `student`. There are no other roles (no `lab_assistant`, `technician`, etc.). Do not add role checks for non-existent roles.

## Backend Conventions

### Models
- CamelCase class names, snake_case fields
- `auto_now_add=True` for creation timestamps, `auto_now=True` for update timestamps
- Choice fields as tuple-of-tuples: `STATUS_CHOICES = (('pending', 'Pending'), ('fixed', 'Fixed'))`
- Always define `__str__()` and `related_name` on ForeignKeys
- Use `settings.AUTH_USER_MODEL` (not direct import) in ForeignKey declarations

### Forms (labs/forms.py)
- `ModelForm` for every model in `labs/models.py`: Lab, PC, CPU, OS, Peripheral, Software, LabEquipment, NetworkEquipmentDetails, ServerDetails, ProjectorDetails, ElectricalApplianceDetails, MaintenanceLog
- Always keep forms in sync with models — if you add/remove/rename a model field, update the corresponding form

### Views
- Use DRF class-based generics: `ListCreateAPIView`, `RetrieveUpdateDestroyAPIView`
- Use `@api_view` + `@permission_classes` decorators for one-off action endpoints
- Override `perform_create()` to auto-populate user/FK fields from request context
- Override `get_queryset()` for role-based filtering
- Use `rest_framework.exceptions.PermissionDenied` for permission errors (never Python's built-in `PermissionError`)

### Serializers
- `ModelSerializer` with explicit `Meta.fields` tuple or `'__all__'`
- Mark auto-populated fields as `read_only_fields`
- Use `serializers.Serializer` for non-model/dynamic data (e.g., InventorySerializer)
- Canonical `UserSerializer` and `RegisterSerializer` live in `users/serializers.py` — do not duplicate elsewhere

### Permissions (labs/permissions.py)
| Class | Behavior |
|---|---|
| `IsAdminOrReadOnly` | Authenticated read; admin-only write |
| `IsAdminUser` | Admin-only for all methods |
| `AllowAuthenticatedReadAndCreateElseAdmin` | Any auth user can read/create; admin-only update/delete |

### URL Patterns
- All API routes prefixed with `/api/` (except muster which uses `/muster/`)
- Apps mounted in `LMS/urls.py`: `path('api/', include('labs.urls'))`, `path('api/notifications/', include('notifications.urls'))`, etc.
- Hyphenated paths, trailing slashes: `/api/maintenance/`, `/api/read-all/`
- Nested resources: `/api/labs/<int:lab_id>/pcs/`

### Admin Registration
- Use `@admin.register(Model)` decorator with custom `ModelAdmin`
- Always set `list_display`, `list_filter`, `search_fields`
- All models across all apps are registered: User, Lab, PC, CPU, OS, Peripheral, Software, LabEquipment (with inline subtables), MaintenanceLog, Ticket, MusterSession (with inline entries), MusterEntry, Notification

### Authentication
- JWT via `djangorestframework-simplejwt` — access token 60 min, refresh 1 day, rotation enabled
- Registration at `POST /api/users/register/` (single canonical endpoint)
- Login returns `{access, refresh, role, username}` at `POST /api/users/login/`
- Frontend sends `Authorization: Bearer <token>` header

### Database
- SQLite by default; MySQL via env vars (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`)
- Config uses `python-decouple` — set env vars in `.env` file

### Notifications Module
- `Notification` model links to `User` and `MaintenanceLog`
- Service layer in `notifications/services.py` — use these functions, don't query the model directly from views
- Email notifications via `notifications/email_service.py` (uses `admin_email` field)
- SMS notifications via `notifications/sms_service.py` (uses `admin_phone` field, Twilio backend)
- `python manage.py check_escalations` — cron job that creates escalation notifications for pending maintenance logs older than 7 days; targets admin users; prevents duplicates by checking (user, maintenance_log, type='escalation')

### Muster Module
- DRF `ModelViewSet` at `/muster/sessions/` — full CRUD with authentication
- Django template views (`@login_required`) for HTML-based muster forms
- Time is auto-rounded to nearest 30 minutes via `_round_time_to_30min()` helper
- Frontend features a browser-based CSV import (`roll_no`, `student_name`, `attendance`) for rapid student enrollment handled directly via `FileReader` in `MusterRegister.tsx`.

### Bulk Import
- `BulkImportAPIView` in `LMS/views.py` — JWT-authenticated, admin-only
- `import_pcs()` returns a **dict** (`{'created': ..., 'skipped': ..., 'errors': ...}`), not a tuple
- `import_labs()` and `import_lab_equipment()` return 3-tuples `(created, skipped, errors)`

### Model Validation
- Use `clean()` + `save()` override pattern for complex validation
- Equipment subtables (ServerDetails, ProjectorDetails, etc.) validate parent equipment type in `clean()`
- MaintenanceLog enforces exactly one target (pc XOR lab_equipment XOR peripheral)
- Always call `self.full_clean()` before `super().save()` if validation logic in `clean()`

### Compound Unique Constraints
Use `unique_together` for multi-field uniqueness:
- `PC (lab, device_name)` — device names unique per lab, not globally
- `Software (pc, name, version)`
- `LabEquipment (lab, equipment_code)`

### Pricing Properties
Several models have computed `total_price` properties:
- `PC.total_price` = base_price + cpu.price + os.license_cost + sum(peripherals.price)
- `LabEquipment.total_price` = unit_price × quantity
- `MusterSession.total_price` = sum(entries.total_price)

### Database Indexes
Always add `Meta.indexes` for high-query fields (FK, status, codes). Example models have indexes on: lab, status, device_name, equipment_code, category.

## Frontend Conventions

### Stack
- React 19 + TypeScript (strict mode, `noUncheckedIndexedAccess`)
- Vite, Tailwind CSS 4, Material UI (`@mui/material`, `@mui/x-data-grid`), Lucide icons
- react-router-dom for routing, React Context for state (no Redux)
- MUI for semantic components (Table, Dialog, Card); Tailwind for layout/spacing

### Patterns
- Pages in `pages/`, reusable components in `components/` organized by feature (Layout/, Maintenance/, Labs/, etc.)
- `AuthContext` manages JWT tokens in localStorage + user state (also persists `user_info` JSON)
- `api.ts` organizes endpoints into grouped objects: `labsAPI.getAll()`, `maintenanceAPI.create()`, etc.
- Nested resource patterns: `.getByLab(labId)`, `.getByPC(pcId)`
- Axios interceptors handle token refresh on 401 automatically
- `ProtectedRoute` wraps authenticated pages; `AdminRoute` restricts admin-only views
- `VITE_API_BASE_URL` env var for API base (defaults to `http://127.0.0.1:8001/api`)

### Error Handling
- Axios response interceptor extracts errors from `data.detail`, `data.error`, `data.message`
- All errors get `.formattedMessage` property — always use `error.formattedMessage` for display

### Pagination
- Backend uses `PageNumberPagination` with `PAGE_SIZE = 50`
- Frontend `extractResults()` utility handles both flat arrays and `{results: [...]}` responses

### Component Conventions
- Define `interface ComponentNameProps` before component definition
- Use `React.FC<Props>` for functional components
- `cn()` utility (clsx + tailwind-merge) for conditional classnames

## Testing

- Test framework: Django `TestCase` + DRF `APITestCase`
- Test files exist but are empty stubs — tests not yet implemented
- Run: `python manage.py test`

## Known Pitfalls

1. **Two login endpoints exist**: `/api/users/login/` (returns role) and `/api/login/` (Simple JWT default, no role). Frontend uses the first one.
2. **PC vs LabEquipment overlap**: `PC` and `LabEquipment` are separate models. PCs can have Software, CPU, OS, Peripherals; LabEquipment covers non-PC hardware (servers, switches, projectors, ACs, etc.).
3. **Inventory is dynamic**: `inventory_list` view calculates inventory by aggregating LabEquipment — there is no `Inventory` DB table backing the list endpoint.
4. **MaintenanceLog.save()** auto-assigns `lab` from the target's lab (PC, LabEquipment, or Peripheral) — hidden side effect.
5. **No rate limiting** configured on any endpoint.
6. **Two sidebar files exist**: `Sidebar.jsx` (permanent sidebar) and `Layout/Sidebar.tsx` (MUI temporary drawer). Update both when changing nav items.
7. **Role-based sidebar visibility**: Use `adminOnly: true/false` flag on menu items and filter by `user?.role === 'admin'`.
