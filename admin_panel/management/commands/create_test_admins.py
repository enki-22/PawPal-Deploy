"""
Management command to create test admin accounts
Usage: python manage.py create_test_admins
"""
from django.core.management.base import BaseCommand
from admin_panel.models import Admin


class Command(BaseCommand):
    help = 'Create test admin accounts for development'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('\nCreating test admin accounts...'))
        
        # Clear existing test admins
        Admin.objects.filter(email__contains='test').delete()
        
        # Create MASTER admin
        master = Admin.objects.create(
            email='master@pawpal.com',
            password='MasterAdmin123!',
            name='Master Administrator',
            role='MASTER',
            contact_number='555-0001',
            clinic_info='PawPal Headquarters',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS(
            f'[+] Created MASTER admin: {master.email} / MasterAdmin123!'
        ))
        
        # Create VET admin
        vet = Admin.objects.create(
            email='vet@pawpal.com',
            password='VetAdmin123!',
            name='Dr. Jane Veterinarian',
            role='VET',
            contact_number='555-0002',
            clinic_info='Downtown Veterinary Clinic',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS(
            f'[+] Created VET admin: {vet.email} / VetAdmin123!'
        ))
        
        # Create DESK admin
        desk = Admin.objects.create(
            email='desk@pawpal.com',
            password='DeskAdmin123!',
            name='John Receptionist',
            role='DESK',
            contact_number='555-0003',
            clinic_info='Downtown Veterinary Clinic',
            is_active=True
        )
        self.stdout.write(self.style.SUCCESS(
            f'[+] Created DESK admin: {desk.email} / DeskAdmin123!'
        ))
        
        self.stdout.write(self.style.SUCCESS('\n[+] All test admins created successfully!'))
        self.stdout.write(self.style.WARNING('\nLogin Credentials:'))
        self.stdout.write('  MASTER: master@pawpal.com / MasterAdmin123!')
        self.stdout.write('  VET:    vet@pawpal.com / VetAdmin123!')
        self.stdout.write('  DESK:   desk@pawpal.com / DeskAdmin123!')
        self.stdout.write('')

