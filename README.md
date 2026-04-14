# LMS – Lab Management System

A full-stack Lab Management System for college computer labs. Django REST API backend with a React + TypeScript frontend. Manages labs, PCs, equipment, software, maintenance logs, tickets, muster registers, and notifications.

## Badges
- [Python 3.9+](https://www.python.org/)
- [Django 5.2](https://www.djangoproject.com/) + Django REST Framework
- [React 19](https://react.dev/) + TypeScript + Vite
- MIT license (adjust if needed)

---

## Overview
- Manage labs, PCs, and LabEquipment (with detailed subtables for equipment metadata)
- Full REST API powered by Django REST Framework with JWT authentication
- React frontend with role-based access (admin / student)
- Admin panel for quick data management (all models registered)
- Importer for bulk CSV/XLSX uploads
- Notification system with email, SMS (Twilio), and escalation cron job
- Muster register for lab attendance tracking
- Local development friendly with SQLite (MySQL supported via env vars)

---

## Project Layout

```
backend/LMS/
├── LMS/               # Django project config (settings, root urls, wsgi)
├── labs/              # Core app — owns User model + Lab, PC, CPU, OS, Peripheral,
│                      #   Software, LabEquipment (with subtables), MaintenanceLog
├── notifications/     # Notification model, escalation service, management command
├── tickets/           # Student support tickets
├── users/             # Auth endpoints (register, login) — re-exports labs.User
├── muster/            # Muster attendance (MusterSession, MusterEntry)
└── manage.py

frontend/
├── src/
│   ├── pages/         # Route-level components (Login, Dashboard, Labs, etc.)
│   ├── components/    # Reusable UI (AppLayout, Sidebar, HeaderBar, ProtectedRoute)
│   ├── contexts/      # AuthContext (JWT state), ThemeContext (dark/light)
│   ├── services/      # api.ts — axios wrapper with token interceptors
│   ├── types/         # Shared TypeScript interfaces
│   └── assets/
├── package.json
└── vite.config.js
```

---

## Prerequisites
- Python 3.9+
- pip
- Git
- Node.js 18+ (for the frontend)

Check versions:
```bash
python --version
pip --version
git --version
node --version
```

---

## Installation & Setup

### Backend

```bash
# From the repository root
cd backend/LMS

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and create admin user
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser

# Start the dev server
python manage.py runserver 8001
```

### Frontend

```bash
# From the repository root
cd frontend

npm install
npm run dev    # Vite dev server on http://localhost:5173
```

### Access Points
- **Admin panel**: http://127.0.0.1:8001/admin
- **API root**: http://127.0.0.1:8001/api/
- **Frontend**: http://localhost:5173

---

## User Roles

Only two roles exist: **admin** and **student**.

| Role | Access |
|------|--------|
| `admin` | Full access — manage labs, PCs, equipment, maintenance, tickets, muster, notifications, bulk import |
| `student` | Maintenance page only — can raise maintenance complaints and support tickets |

### Sidebar Visibility
- **Admin**: Dashboard, Labs, PCs, Equipment, Software, Maintenance, Inventory
- **Student**: Maintenance only

---

## Data Model Snapshot

### Core Models (labs app)
- **User**: Custom user model with role (`admin` / `student`)
- **Lab**: Physical lab metadata (name, location)
- **PC**: Computers with hardware specs (processor, RAM, storage, GPU, etc.)
- **CPU**: OneToOne with PC — detailed processor info
- **OS**: OneToOne with PC — operating system and license info
- **Peripheral**: Linked to PC — monitors, keyboards, mice, etc.
- **Software**: Installed software on PCs with license tracking

### Equipment System
- **LabEquipment**: Main registry for non-PC hardware (servers, switches, projectors, ACs, etc.)
- **NetworkEquipmentDetails**: Subtable for routers, switches, hubs, servers, e-boards
- **ServerDetails**: Subtable for server-specific specs
- **ProjectorDetails**: Subtable for projector specs
- **ElectricalApplianceDetails**: Subtable for ACs, fans, lights

### Supporting Models
- **MaintenanceLog**: Records maintenance issues against PC, LabEquipment, or Peripheral
- **Ticket**: Student support tickets linked to a PC
- **Notification**: Alert system linked to User and MaintenanceLog
- **MusterSession** / **MusterEntry**: Lab attendance tracking

For detailed schema, see `backend/LMS/labs/models.py`.

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register/` | Register a new user |
| POST | `/api/users/login/` | Login (returns JWT + role) |
| POST | `/api/login/` | Simple JWT login (no role in response) |
| POST | `/api/token/refresh/` | Refresh JWT token |

### Labs & Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/labs/` | List/create labs |
| GET/PUT/DELETE | `/api/labs/<id>/` | Lab detail |
| GET/POST | `/api/labs/<lab_id>/pcs/` | PCs in a specific lab |
| GET/POST | `/api/pcs/` | List/create PCs |
| GET/POST | `/api/lab-equipment/` | List/create equipment |
| GET/POST | `/api/software/` | List/create software |
| GET/POST | `/api/peripherals/` | List/create peripherals |
| GET/POST | `/api/cpu/` | List/create CPU records |
| GET/POST | `/api/os/` | List/create OS records |

### Maintenance & Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/maintenance/` | List/create maintenance logs |
| GET | `/api/inventory/` | Dynamic inventory calculation |

### Tickets & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/create/` | Create a support ticket |
| GET | `/api/tickets/my/` | List tickets (role-filtered) |
| GET | `/api/notifications/` | List notifications for current user |
| PATCH | `/api/notifications/<id>/read/` | Mark notification as read |
| PATCH | `/api/notifications/read-all/` | Mark all as read |
| POST | `/api/notifications/send-sms/` | Send SMS notification |

### Muster
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/muster/sessions/` | List/create muster sessions (DRF ViewSet) |
| GET | `/muster/pcs-for-lab/<lab_id>/` | PCs available in a lab |

### Bulk Import
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/import/` | Bulk import (JWT auth, admin only) |

---

## Importer (Bulk Import)
- Import labs, PCs, and LabEquipment from CSV/XLSX via `backend/LMS/labs/importers.py`.
- Requires admin role for the JWT-authenticated endpoint at `/api/import/`.
- Handles edge cases and common data issues; run tests or use Django shell to validate data.

### PC Import CSV Headers
```
pc_name, product_id, brand, status, network, basic_processor_info, ram_capacity,
graphics_card, storage_capacity, cpu_model, clock_speed, core_count,
integrated_graphics, keyboard_status, mouse_status, serial_number
```

### Muster Student Import CSV Headers
```csv
roll_no, student_name, attendance
```
*(Note: `student_name` and `attendance` are optional. Defaults to 'P' for attendance.)*

---

## Testing
```bash
cd backend/LMS
python manage.py test
```
Tests use Django's `TestCase` + DRF `APITestCase`. Test files exist as stubs in each app's `tests.py`.

---

## Frontend Development

### Tech Stack
- React 19 + TypeScript (strict mode)
- Vite build tool
- Tailwind CSS 4 + Material UI (`@mui/material`, `@mui/x-data-grid`)
- Lucide icons
- react-router-dom for routing
- React Context for state (no Redux)

### Key Patterns
- **API calls**: Grouped in `api.ts` — `labsAPI.getAll()`, `maintenanceAPI.create()`, etc.
- **Auth**: `AuthContext` manages JWT tokens in localStorage
- **Error handling**: Use `error.formattedMessage` for user-friendly messages
- **Pagination**: Backend uses `PAGE_SIZE=50`; frontend `extractResults()` handles paginated responses

### Environment Variables
Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8001/api
```

---

## Troubleshooting
- **Virtual environment issues**: Ensure the virtualenv is activated and dependencies are installed.
- **Pending migrations**: `python manage.py makemigrations && python manage.py migrate`
- **Port conflicts**: Use a different port: `python manage.py runserver 8002`
- **Django not found**: Check that your virtualenv is active.
- **Two login endpoints**: Use `/api/users/login/` (returns role); `/api/login/` is Simple JWT default without role.
- **Sidebar not updating**: Two sidebar files exist — `Sidebar.jsx` (permanent) and `Layout/Sidebar.tsx` (drawer). Update both.

---

## Contributing
PRs are welcome. Open an issue to discuss major changes before starting.

---

## Full Setup Guide
For a comprehensive, step-by-step setup, see the dedicated guide: [SETUP_GUIDE.md](SETUP_GUIDE.md)

## License
MIT (adjust as needed)
