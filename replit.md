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
├── core/                   # Core utilities
│   └── management/commands/seed_data.py
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
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

- Initial implementation of complete health monitoring system (December 2025)
