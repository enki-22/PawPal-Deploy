"""
Management command to create test admin accounts
Usage: python manage.py create_test_admins
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from admin_panel.models import Admin


class Command(BaseCommand):
    help = 'Create test admin accounts for development (resets all Admin records)'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('\n========================================'))
        self.stdout.write(self.style.WARNING('  Admin Database Reset & Seeder'))
        self.stdout.write(self.style.WARNING('========================================\n'))
        
        # Clean slate - delete ALL existing Admin records
        count = Admin.objects.all().count()
        Admin.objects.all().delete()
        self.stdout.write(self.style.WARNING(f'[!] Deleted {count} existing Admin record(s)'))
        
        # Create MASTER admin
        master = Admin.objects.create(
            email='maria.santos@pawpal.com',
            password=make_password('MasterAdmin123!'),
            name='Dr. Maria Santos',
            role='MASTER',
            contact_number='555-0001',
            clinic_info='PawPal Headquarters',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS(
            f'[+] Created MASTER admin: {master.email}'
        ))
        
        # Create VET admin for OTP testing (VET role can use password reset)
        vet = Admin.objects.create(
            email='enki.prince.alava@gmail.com',
            password=make_password('TestAdmin123!'),
            name='Enki Prince (Test)',
            role='VET',
            contact_number='555-0002',
            clinic_info='PawPal Test Account',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS(
            f'[+] Created VET admin (for OTP testing): {vet.email}'
        ))
        
        # Print summary
        self.stdout.write(self.style.SUCCESS('\n========================================'))
        self.stdout.write(self.style.SUCCESS('  All test admins created successfully!'))
        self.stdout.write(self.style.SUCCESS('========================================\n'))
        
        self.stdout.write(self.style.WARNING('Login Credentials:\n'))
        self.stdout.write('  MASTER Admin (cannot reset password via email):')
        self.stdout.write(self.style.NOTICE('    Email:    maria.santos@pawpal.com'))
        self.stdout.write(self.style.NOTICE('    Password: MasterAdmin123!'))
        self.stdout.write('')
        self.stdout.write('  VET Admin (for testing Forgot Password flow):')
        self.stdout.write(self.style.NOTICE('    Email:    enki.prince.alava@gmail.com'))
        self.stdout.write(self.style.NOTICE('    Password: TestAdmin123!'))
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('Note: VET role is used for OTP testing because'))
        self.stdout.write(self.style.WARNING('      MASTER role is blocked from email password reset.\n'))
