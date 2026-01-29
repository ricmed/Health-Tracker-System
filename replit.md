# Health Problem Registration and Monitoring System

## Overview
A comprehensive health problem registration and monitoring system built with Django (backend) and React (frontend). The system supports:
- Registration and monitoring of various health problem types with unique characteristics
- Dynamic form builder allowing admins to create custom forms for each health problem type
- Patient management with personal data and addresses
- Role-based access control where users can only register health problems they have permission for

## Architecture

### Backend (Django)
- **Django REST Framework** for API endpoints
- **PostgreSQL** database with hybrid relational + JSONB approach for dynamic forms
- **Session-based authentication** (not JWT)
- Runs on port 8000

### Frontend (React)
- **Vite** for development and building
- **TanStack Query** for data fetching
- **shadcn/ui** components with Tailwind CSS
- **wouter** for client-side routing
- Runs on port 5000 (proxies /api to Django)

## Project Structure

```
/
├── health_system/          # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── accounts/               # User management Django app
│   ├── models.py          # User, Role, Permission models
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── patients/               # Patient management Django app
│   ├── models.py          # Patient, PatientAddress models
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── health_problems/        # Health problems Django app
│   ├── models.py          # HealthProblemType, PatientHealthProblem, FormQuestion, FormResponse
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── dashboards/             # Dynamic Dashboard/Reports Django app
│   ├── models.py          # Dashboard, DashboardPanel, DashboardFilter, DashboardTextBlock
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── core/                   # Core utilities
│   └── management/commands/seed_data.py
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── dashboard/  # Chart rendering, filters, text blocks
│   │   ├── context/
│   │   ├── pages/
│   │   │   └── reports/    # Dashboard builder and viewer
│   │   ├── types/
│   │   └── lib/
│   └── index.html
├── server/                 # Express server (proxies to Django, serves Vite)
│   ├── index.ts
│   └── routes.ts
└── manage.py

```

## Database Models

### User Model (accounts.User)
- Custom user model with email as username
- Many-to-many with roles and health problem types (permissions)

### Patient Model (patients.Patient)
- Full patient demographics and contact info
- Related PatientAddress for addresses

### HealthProblemType Model (health_problems.HealthProblemType)
- Defines types of health problems (e.g., Diabetes, Hypertension)
- `question_schema` (JSONB) stores dynamic form questions

### PatientHealthProblem Model
- Links patients to health problem types
- Stores status, severity, dates

### FormResponse Model
- Stores JSONB answers to dynamic forms

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/profile/` - Get current user

### Users
- `GET /api/auth/users/` - List users
- `POST /api/auth/users/{id}/toggle_active/` - Toggle user status
- `POST /api/auth/users/{id}/assign_health_problems/` - Assign permissions

### Patients
- `GET /api/patients/patients/` - List patients
- `POST /api/patients/patients/` - Create patient
- `GET /api/patients/patients/{id}/` - Get patient
- `PUT /api/patients/patients/{id}/` - Update patient

### Health Problem Types
- `GET /api/health-problems/types/` - List types
- `POST /api/health-problems/types/` - Create type
- `GET /api/health-problems/types/permitted/` - Get user's permitted types
- `POST /api/health-problems/types/{id}/toggle_active/` - Toggle type status

### Patient Health Problems
- `GET /api/health-problems/patient-problems/` - List
- `POST /api/health-problems/patient-problems/` - Create
- `POST /api/health-problems/patient-problems/{id}/add_response/` - Add form response

### Dashboards & Reports
- `GET /api/dashboards/dashboards/` - List dashboards (filtered by permissions)
- `POST /api/dashboards/dashboards/` - Create dashboard
- `GET /api/dashboards/dashboards/{id}/` - Get dashboard with panels, filters, text blocks
- `PATCH /api/dashboards/dashboards/{id}/` - Update dashboard settings
- `DELETE /api/dashboards/dashboards/{id}/` - Delete dashboard
- `GET /api/dashboards/dashboards/public/` - Get public dashboards grouped by health problem
- `POST /api/dashboards/dashboards/{id}/toggle_public/` - Toggle public visibility
- `POST /api/dashboards/dashboards/{id}/add_panel/` - Add chart panel
- `POST /api/dashboards/dashboards/{id}/add_filter/` - Add dynamic filter
- `POST /api/dashboards/dashboards/{id}/add_text_block/` - Add text content
- `POST /api/dashboards/dashboards/{id}/data/` - Fetch aggregated panel data with filters
- `GET /api/dashboards/filter-options/` - Get filter option values

### Dashboard Panels
- `GET /api/dashboards/panels/` - List panels
- `PATCH /api/dashboards/panels/{id}/` - Update panel configuration
- `DELETE /api/dashboards/panels/{id}/` - Delete panel
- `GET /api/dashboards/available-fields/?health_problem_type={id}` - Get available fields for panel configuration (patient fields, health problem fields, form fields, time groupings)

## Credentials

- **Admin user**: admin@health.com / admin123

## Running the Application

The application starts both Django and Node.js servers automatically:
1. Django runs on port 8000 (API server)
2. Vite/Express runs on port 5000 (frontend + proxy)

The workflow runs `npm run dev` which spawns Django as a child process.

## User Preferences

- Enterprise-grade healthcare UI design
- Inter font family
- Clean, clinical aesthetics
- Dark mode support

## Recent Changes

- Added dynamic field selection for dashboard panels (January 2026)
  - X-Axis field selector shows categorized field groups: Patient Fields, Health Problem Fields, Form Fields, Time Groupings
  - Patient fields include: Gender, Age, State, City, Birth Date, Document Type
  - Health problem fields include: Status, Severity, Onset Date, Diagnosis Date
  - Form fields dynamically populated from health problem type's question_schema
  - Time groupings for temporal analysis: Day, Week, Month, Year
  - Panel cards display human-readable field labels instead of raw field values
- Added dynamic Dashboard/Report creation module (January 2026)
  - Create custom dashboards linked to health problem types
  - Configure chart panels: bar (vertical/horizontal), line, area, pie, donut, scatter, choropleth (Brazil), tables, metrics
  - Add dynamic filters (select, date range, text search) that update visualizations in real-time
  - Add text blocks for headers, descriptions, methodology, data sources
  - Upload custom logos for branding
  - Toggle public/private access
  - Export data as CSV, export charts as PNG via Plotly toolbar
  - Interactive charts with hover tooltips, click selection, highlighting
  - Public dashboards accessible on home page grouped by health problem type
- Initial implementation of complete health monitoring system (December 2025)
