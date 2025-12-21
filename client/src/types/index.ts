export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_active: boolean;
  is_staff: boolean;
  roles: Role[];
  health_problem_permissions: HealthProblemType[];
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  description: string;
  permission_type: string;
}

export interface Patient {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  gender: 'M' | 'F' | 'O' | 'U';
  email: string;
  phone: string;
  secondary_phone: string;
  document_type: string;
  document_number: string;
  marital_status: string;
  occupation: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
  is_active: boolean;
  addresses: PatientAddress[];
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface PatientAddress {
  id: number;
  address_type: 'home' | 'work' | 'other';
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientListItem {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  age: number;
  gender: string;
  phone: string;
  document_number: string;
  is_active: boolean;
  primary_address: string | null;
  health_problems_count: number;
  created_at: string;
}

export interface HealthProblemType {
  id: number;
  name: string;
  code: string;
  description: string;
  color: string;
  icon: string;
  is_active: boolean;
  question_schema: QuestionSchema;
  schema_version: number;
  form_questions: FormQuestion[];
  questions_count: number;
  patients_count: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionSchema {
  questions: Question[];
}

export interface FieldDependency {
  field_id: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'is_truthy' | 'is_falsy';
  value?: string | string[];
}

export interface Question {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: Option[];
  placeholder?: string;
  help_text?: string;
  validation?: ValidationRules;
  order: number;
  section?: string;
  depends_on?: FieldDependency;
  conditionally_required?: FieldDependency;
}

export interface Option {
  value: string;
  label: string;
}

export interface ValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
}

export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'email' 
  | 'number' 
  | 'date' 
  | 'select' 
  | 'multiselect' 
  | 'radio' 
  | 'checkbox' 
  | 'autocomplete' 
  | 'file';

export interface FormQuestion {
  id: number;
  label: string;
  field_type: FieldType;
  placeholder: string;
  help_text: string;
  is_required: boolean;
  options: Option[];
  validation_rules: ValidationRules;
  order: number;
  section: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatientHealthProblem {
  id: number;
  patient: number;
  patient_name: string;
  health_problem_type: number;
  health_problem_type_name: string;
  health_problem_type_color: string;
  status: 'active' | 'monitoring' | 'resolved' | 'chronic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  onset_date: string | null;
  diagnosis_date: string | null;
  resolution_date: string | null;
  notes: string;
  registered_by: number;
  registered_by_name: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  schema_version_used: number;
  form_responses: FormResponse[];
  created_at: string;
  updated_at: string;
}

export interface FormResponse {
  id: number;
  answers: Record<string, unknown>;
  schema_version: number;
  submitted_by: number;
  submitted_by_name: string;
  submitted_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_patients: number;
  active_patients: number;
  total_health_problems: number;
  health_problem_types: number;
  recent_registrations: PatientListItem[];
  problems_by_type: { name: string; count: number; color: string }[];
}
