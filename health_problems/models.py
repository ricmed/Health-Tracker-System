from django.db import models
from django.conf import settings


class FieldType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    code = models.CharField(max_length=30, unique=True)
    description = models.TextField(blank=True)
    has_options = models.BooleanField(default=False)
    icon = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class HealthProblemType(models.Model):
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default='#3B82F6')
    icon = models.CharField(max_length=50, default='clipboard-list')
    is_active = models.BooleanField(default=True)
    question_schema = models.JSONField(
        default=dict,
        help_text='JSON schema defining the form questions for this health problem type'
    )
    schema_version = models.PositiveIntegerField(default=1)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_health_problem_types'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_questions(self):
        return self.question_schema.get('questions', [])

    def add_question(self, question_data):
        questions = self.get_questions()
        question_data['id'] = f"q_{len(questions) + 1}"
        question_data['order'] = len(questions) + 1
        questions.append(question_data)
        self.question_schema['questions'] = questions
        self.schema_version += 1
        self.save()
        return question_data

    def update_question(self, question_id, question_data):
        questions = self.get_questions()
        for i, q in enumerate(questions):
            if q.get('id') == question_id:
                questions[i] = {**q, **question_data}
                break
        self.question_schema['questions'] = questions
        self.schema_version += 1
        self.save()

    def remove_question(self, question_id):
        questions = [q for q in self.get_questions() if q.get('id') != question_id]
        for i, q in enumerate(questions):
            q['order'] = i + 1
        self.question_schema['questions'] = questions
        self.schema_version += 1
        self.save()


class FormQuestion(models.Model):
    FIELD_TYPES = [
        ('text', 'Text Input'),
        ('textarea', 'Text Area'),
        ('email', 'Email'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('select', 'Single Select'),
        ('multiselect', 'Multi Select'),
        ('radio', 'Radio Buttons'),
        ('checkbox', 'Checkbox'),
        ('autocomplete', 'Autocomplete'),
        ('file', 'File Upload'),
    ]

    health_problem_type = models.ForeignKey(
        HealthProblemType,
        on_delete=models.CASCADE,
        related_name='form_questions'
    )
    label = models.CharField(max_length=255)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPES)
    placeholder = models.CharField(max_length=255, blank=True)
    help_text = models.CharField(max_length=500, blank=True)
    is_required = models.BooleanField(default=False)
    options = models.JSONField(
        default=list,
        blank=True,
        help_text='Options for select/multiselect/radio fields'
    )
    validation_rules = models.JSONField(
        default=dict,
        blank=True,
        help_text='Validation rules (min, max, pattern, etc.)'
    )
    order = models.PositiveIntegerField(default=0)
    section = models.CharField(max_length=100, blank=True, help_text='Group questions by section')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.label} ({self.field_type})"


class PatientHealthProblem(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('monitoring', 'Under Monitoring'),
        ('resolved', 'Resolved'),
        ('chronic', 'Chronic'),
    ]

    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.CASCADE,
        related_name='health_problems'
    )
    health_problem_type = models.ForeignKey(
        HealthProblemType,
        on_delete=models.PROTECT,
        related_name='patient_instances'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    onset_date = models.DateField(null=True, blank=True)
    diagnosis_date = models.DateField(null=True, blank=True)
    resolution_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='registered_health_problems'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_health_problems'
    )
    schema_version_used = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Patient Health Problems'

    def __str__(self):
        return f"{self.patient} - {self.health_problem_type}"


class FormResponse(models.Model):
    patient_health_problem = models.ForeignKey(
        PatientHealthProblem,
        on_delete=models.CASCADE,
        related_name='form_responses'
    )
    answers = models.JSONField(
        default=dict,
        help_text='JSON object with question_id: answer pairs'
    )
    schema_version = models.PositiveIntegerField(default=1)
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='submitted_form_responses'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Response for {self.patient_health_problem} at {self.submitted_at}"

    def get_answer(self, question_id):
        return self.answers.get(question_id)

    def set_answer(self, question_id, value):
        self.answers[question_id] = value
        self.save()


class AuditLog(models.Model):
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    object_repr = models.CharField(max_length=255)
    changes = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name}({self.object_id})"
