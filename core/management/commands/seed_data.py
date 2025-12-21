from django.core.management.base import BaseCommand
from accounts.models import User, Role, Permission
from health_problems.models import FieldType, HealthProblemType


class Command(BaseCommand):
    help = 'Seed initial data for the health system'

    def handle(self, *args, **options):
        self.stdout.write('Seeding initial data...')

        field_types = [
            {'name': 'Text Input', 'code': 'text', 'description': 'Single line text input', 'has_options': False, 'icon': 'type'},
            {'name': 'Text Area', 'code': 'textarea', 'description': 'Multi-line text input', 'has_options': False, 'icon': 'align-left'},
            {'name': 'Email', 'code': 'email', 'description': 'Email address input', 'has_options': False, 'icon': 'mail'},
            {'name': 'Number', 'code': 'number', 'description': 'Numeric input', 'has_options': False, 'icon': 'hash'},
            {'name': 'Date', 'code': 'date', 'description': 'Date picker', 'has_options': False, 'icon': 'calendar'},
            {'name': 'Single Select', 'code': 'select', 'description': 'Dropdown with single selection', 'has_options': True, 'icon': 'chevron-down'},
            {'name': 'Multi Select', 'code': 'multiselect', 'description': 'Multiple selection dropdown', 'has_options': True, 'icon': 'check-square'},
            {'name': 'Radio Buttons', 'code': 'radio', 'description': 'Single selection radio buttons', 'has_options': True, 'icon': 'circle'},
            {'name': 'Checkbox', 'code': 'checkbox', 'description': 'Yes/No checkbox', 'has_options': False, 'icon': 'check-square'},
            {'name': 'Autocomplete', 'code': 'autocomplete', 'description': 'Text input with suggestions', 'has_options': True, 'icon': 'search'},
            {'name': 'File Upload', 'code': 'file', 'description': 'File attachment', 'has_options': False, 'icon': 'paperclip'},
        ]

        for ft_data in field_types:
            FieldType.objects.get_or_create(code=ft_data['code'], defaults=ft_data)
        self.stdout.write(self.style.SUCCESS(f'Created {len(field_types)} field types'))

        roles = [
            {'name': 'Administrator', 'description': 'Full system access'},
            {'name': 'Health Professional', 'description': 'Can register and manage patient health problems'},
            {'name': 'Receptionist', 'description': 'Can register and manage patients'},
            {'name': 'Viewer', 'description': 'Read-only access to patient data'},
        ]

        for role_data in roles:
            Role.objects.get_or_create(name=role_data['name'], defaults=role_data)
        self.stdout.write(self.style.SUCCESS(f'Created {len(roles)} roles'))

        permissions = [
            {'name': 'View Patients', 'code': 'patients.view', 'permission_type': 'view'},
            {'name': 'Create Patients', 'code': 'patients.create', 'permission_type': 'create'},
            {'name': 'Edit Patients', 'code': 'patients.edit', 'permission_type': 'edit'},
            {'name': 'Delete Patients', 'code': 'patients.delete', 'permission_type': 'delete'},
            {'name': 'View Health Problems', 'code': 'health_problems.view', 'permission_type': 'view'},
            {'name': 'Create Health Problems', 'code': 'health_problems.create', 'permission_type': 'create'},
            {'name': 'Edit Health Problems', 'code': 'health_problems.edit', 'permission_type': 'edit'},
            {'name': 'Delete Health Problems', 'code': 'health_problems.delete', 'permission_type': 'delete'},
            {'name': 'Manage Users', 'code': 'users.manage', 'permission_type': 'manage'},
            {'name': 'Manage System', 'code': 'system.manage', 'permission_type': 'manage'},
        ]

        for perm_data in permissions:
            Permission.objects.get_or_create(code=perm_data['code'], defaults=perm_data)
        self.stdout.write(self.style.SUCCESS(f'Created {len(permissions)} permissions'))

        sample_health_problems = [
            {
                'name': 'Diabetes Type 2',
                'code': 'diabetes_t2',
                'description': 'Type 2 Diabetes Mellitus registration and monitoring',
                'color': '#EF4444',
                'icon': 'activity',
                'question_schema': {
                    'questions': [
                        {'id': 'q1', 'label': 'Fasting Blood Glucose (mg/dL)', 'type': 'number', 'required': True, 'order': 1},
                        {'id': 'q2', 'label': 'HbA1c Level (%)', 'type': 'number', 'required': True, 'order': 2},
                        {'id': 'q3', 'label': 'Family History of Diabetes', 'type': 'select', 'required': True, 'options': [{'value': 'yes', 'label': 'Yes'}, {'value': 'no', 'label': 'No'}], 'order': 3},
                        {'id': 'q4', 'label': 'Current Medications', 'type': 'textarea', 'required': False, 'order': 4},
                    ]
                }
            },
            {
                'name': 'Hypertension',
                'code': 'hypertension',
                'description': 'High blood pressure monitoring',
                'color': '#8B5CF6',
                'icon': 'heart',
                'question_schema': {
                    'questions': [
                        {'id': 'q1', 'label': 'Systolic Pressure (mmHg)', 'type': 'number', 'required': True, 'order': 1},
                        {'id': 'q2', 'label': 'Diastolic Pressure (mmHg)', 'type': 'number', 'required': True, 'order': 2},
                        {'id': 'q3', 'label': 'Heart Rate (bpm)', 'type': 'number', 'required': False, 'order': 3},
                        {'id': 'q4', 'label': 'Smoking Status', 'type': 'select', 'required': True, 'options': [{'value': 'never', 'label': 'Never'}, {'value': 'former', 'label': 'Former'}, {'value': 'current', 'label': 'Current'}], 'order': 4},
                    ]
                }
            },
            {
                'name': 'COVID-19',
                'code': 'covid19',
                'description': 'COVID-19 case registration and tracking',
                'color': '#F59E0B',
                'icon': 'shield',
                'question_schema': {
                    'questions': [
                        {'id': 'q1', 'label': 'Test Type', 'type': 'select', 'required': True, 'options': [{'value': 'pcr', 'label': 'PCR'}, {'value': 'antigen', 'label': 'Rapid Antigen'}, {'value': 'antibody', 'label': 'Antibody'}], 'order': 1},
                        {'id': 'q2', 'label': 'Test Result', 'type': 'select', 'required': True, 'options': [{'value': 'positive', 'label': 'Positive'}, {'value': 'negative', 'label': 'Negative'}, {'value': 'inconclusive', 'label': 'Inconclusive'}], 'order': 2},
                        {'id': 'q3', 'label': 'Symptoms', 'type': 'multiselect', 'required': False, 'options': [{'value': 'fever', 'label': 'Fever'}, {'value': 'cough', 'label': 'Cough'}, {'value': 'fatigue', 'label': 'Fatigue'}, {'value': 'loss_taste', 'label': 'Loss of Taste/Smell'}], 'order': 3},
                        {'id': 'q4', 'label': 'Vaccination Status', 'type': 'select', 'required': True, 'options': [{'value': 'unvaccinated', 'label': 'Unvaccinated'}, {'value': 'partial', 'label': 'Partially Vaccinated'}, {'value': 'full', 'label': 'Fully Vaccinated'}, {'value': 'boosted', 'label': 'Boosted'}], 'order': 4},
                    ]
                }
            },
        ]

        for hp_data in sample_health_problems:
            HealthProblemType.objects.get_or_create(code=hp_data['code'], defaults=hp_data)
        self.stdout.write(self.style.SUCCESS(f'Created {len(sample_health_problems)} sample health problem types'))

        if not User.objects.filter(email='admin@health.com').exists():
            admin = User.objects.create_superuser(
                email='admin@health.com',
                password='admin123',
                first_name='System',
                last_name='Administrator'
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin.email}'))

        self.stdout.write(self.style.SUCCESS('Data seeding completed!'))
