from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from patients.models import Patient, PatientAddress
from faker import Faker
import random

class Command(BaseCommand):
    help = 'Creates fake patients for testing'

    def add_arguments(self, parser):
        parser.add_argument('count', type=int, nargs='?', default=1, help='Number of patients to create')

    def handle(self, *args, **options):
        count = options['count']
        fake = Faker('pt_BR')
        User = get_user_model()
        
        # Try to get a user to assign as creator
        user = User.objects.first()
        if not user:
            self.stdout.write(self.style.WARNING('No users found. Creating patients without a creator.'))

        self.stdout.write(f'Generating {count} fake patient(s)...')

        for i in range(count):
            try:
                # Generate consistent gender/name
                gender_choices = ['M', 'F']
                gender_code = random.choice(gender_choices)
                
                if gender_code == 'M':
                    first_name = fake.first_name_male()
                    last_name = fake.last_name()
                else:
                    first_name = fake.first_name_female()
                    last_name = fake.last_name()
                
                patient = Patient(
                    first_name=first_name,
                    last_name=last_name,
                    date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=90),
                    gender=gender_code,
                    email=fake.email(),
                    phone=fake.phone_number(),
                    secondary_phone=fake.phone_number() if random.random() > 0.5 else '',
                    document_type='CPF',
                    document_number=fake.cpf(),
                    marital_status=random.choice(['single', 'married', 'divorced', 'widowed', 'other']),
                    occupation=fake.job(),
                    emergency_contact_name=fake.name(),
                    emergency_contact_phone=fake.phone_number(),
                    notes=fake.text(max_nb_chars=200),
                    created_by=user,
                    is_active=True
                )
                
                patient.save()

                # Create Address
                address = PatientAddress(
                    patient=patient,
                    address_type='home',
                    street=fake.street_name(),
                    number=fake.building_number(),
                    complement=fake.secondary_address() if random.random() > 0.7 else '',
                    # Use standard accessible fields. neighborhood might differ by provider version
                    neighborhood=getattr(fake, 'bairro', lambda: fake.city_suffix())(), 
                    city=fake.city(),
                    state=fake.state_abbr(),
                    postal_code=fake.postcode(),
                    country='Brasil',
                    is_primary=True
                )
                address.save()
                
                self.stdout.write(self.style.SUCCESS(f'Successfully created patient: {patient.first_name} {patient.last_name}'))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating patient {i+1}: {str(e)}'))
