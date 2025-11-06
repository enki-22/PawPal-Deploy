"""
Management command to seed database with sample data
Usage: python manage.py seed_data

This command creates:
- 3 Admin accounts (MASTER, VET, DESK)
- 2 Pet Owner accounts (with UserProfile)
- 2 Sample Pets
- 2 Sample Announcements

CRITICAL: The Master Admin account is created ONLY through this command.
Never create Master Admin via API - this is the secure way to bootstrap the system.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date, timedelta

from admin_panel.models import Admin, Announcement
from users.models import UserProfile
from pets.models import Pet


class Command(BaseCommand):
    help = 'Seed database with sample data (admins, users, pets, announcements)'
    
    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('\n🌱 Seeding database with sample data...\n'))
        
        # ============= CREATE ADMIN ACCOUNTS =============
        self.stdout.write(self.style.WARNING('Creating Admin accounts...'))
        
        # Create Master Admin (CRITICAL - Only way to create Master Admin)
        master_admin, created = Admin.objects.get_or_create(
            email='maria.santos@pawpal.com',
            defaults={
                'name': 'Dr. Maria Santos',
                'role': 'MASTER',
                'password': make_password('MasterAdmin123!'),
                'is_active': True,
                'is_deleted': False,
                'contact_number': '09171234567',
                'clinic_info': 'PawPal Veterinary Clinic',
                'password_updated_at': timezone.now(),
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  ✅ Created Master Admin: maria.santos@pawpal.com'))
        else:
            self.stdout.write(self.style.WARNING('  ℹ️  Master Admin already exists: maria.santos@pawpal.com'))
        
        # Create Veterinarian Admin
        vet_admin, created = Admin.objects.get_or_create(
            email='hazel.liwanag@pawpal.com',
            defaults={
                'name': 'Dr. Hazel Liwanag',
                'role': 'VET',
                'password': make_password('VetAdmin123!'),
                'is_active': True,
                'is_deleted': False,
                'contact_number': '09181234567',
                'clinic_info': 'PawPal Veterinary Clinic',
                'password_updated_at': timezone.now(),
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  ✅ Created Veterinarian Admin: hazel.liwanag@pawpal.com'))
        else:
            self.stdout.write(self.style.WARNING('  ℹ️  Veterinarian Admin already exists: hazel.liwanag@pawpal.com'))
        
        # Create Front Desk Admin
        desk_admin, created = Admin.objects.get_or_create(
            email='john.delacruz@pawpal.com',
            defaults={
                'name': 'John Dela Cruz',
                'role': 'DESK',
                'password': make_password('DeskAdmin123!'),
                'is_active': True,
                'is_deleted': False,
                'contact_number': '09191234567',
                'clinic_info': 'PawPal Veterinary Clinic',
                'password_updated_at': timezone.now(),
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  ✅ Created Front Desk Admin: john.delacruz@pawpal.com'))
        else:
            self.stdout.write(self.style.WARNING('  ℹ️  Front Desk Admin already exists: john.delacruz@pawpal.com'))
        
        # ============= CREATE PET OWNER ACCOUNTS =============
        self.stdout.write(self.style.WARNING('\nCreating Pet Owner accounts...'))
        
        # Create Pet Owner 1: Mal Beausoleil
        owner1_user, created = User.objects.get_or_create(
            username='mal.beausoleil',
            email='mal.beausoleil@example.com',
            defaults={
                'first_name': 'Mal',
                'last_name': 'Beausoleil',
                'password': make_password('Owner123!'),
                'is_active': True,
                'is_staff': False,
                'is_superuser': False,
            }
        )
        
        if created:
            # Create UserProfile for owner1
            UserProfile.objects.update_or_create(
                user=owner1_user,
                defaults={
                    'phone_number': '09453419798',
                    'city': 'Santa Rosa',
                    'province': 'Laguna',
                    'address': '123 Sample Street, Santa Rosa',
                    'is_verified': True,
                }
            )
            self.stdout.write(self.style.SUCCESS('  ✅ Created pet owner: Mal Beausoleil (mal.beausoleil@example.com)'))
        else:
            self.stdout.write(self.style.WARNING('  ℹ️  Pet owner already exists: Mal Beausoleil'))
        
        # Create Pet Owner 2: Sarah Johnson
        owner2_user, created = User.objects.get_or_create(
            username='sarah.j',
            email='sarah.j@example.com',
            defaults={
                'first_name': 'Sarah',
                'last_name': 'Johnson',
                'password': make_password('Owner123!'),
                'is_active': True,
                'is_staff': False,
                'is_superuser': False,
            }
        )
        
        if created:
            # Create UserProfile for owner2
            UserProfile.objects.update_or_create(
                user=owner2_user,
                defaults={
                    'phone_number': '09171234567',
                    'city': 'Quezon City',
                    'province': 'Metro Manila',
                    'address': '456 Test Avenue, QC',
                    'is_verified': True,
                }
            )
            self.stdout.write(self.style.SUCCESS('  ✅ Created pet owner: Sarah Johnson (sarah.j@example.com)'))
        else:
            self.stdout.write(self.style.WARNING('  ℹ️  Pet owner already exists: Sarah Johnson'))
        
        # ============= CREATE SAMPLE PETS =============
        self.stdout.write(self.style.WARNING('\nCreating Sample Pets...'))
        
        # Pet 1: Charlie (Cat)
        pet1, created = Pet.objects.get_or_create(
            name='Charlie',
            owner=owner1_user,
            defaults={
                'animal_type': 'cat',
                'breed': 'Domestic Shorthair',
                'sex': 'male',
                'age': 2,
                'weight': 4.5,  # kg
                'medical_notes': 'Flea Allergy Dermatitis. Monitor for itching and skin irritation. Regular flea prevention required.',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  ✅ Created pet: Charlie (Cat)'))
        else:
            self.stdout.write(self.style.WARNING('  ℹ️  Pet already exists: Charlie'))
        
        # Pet 2: Max (Dog)
        pet2, created = Pet.objects.get_or_create(
            name='Max',
            owner=owner2_user,
            defaults={
                'animal_type': 'dog',
                'breed': 'Golden Retriever',
                'sex': 'male',
                'age': 4,
                'weight': 30.0,  # kg
                'medical_notes': 'Hip Dysplasia. Regular exercise and joint supplements recommended. Monitor for limping or discomfort.',
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  ✅ Created pet: Max (Dog)'))
        else:
            self.stdout.write(self.style.WARNING('  ℹ️  Pet already exists: Max'))
        
        # ============= CREATE SAMPLE ANNOUNCEMENTS =============
        self.stdout.write(self.style.WARNING('\nCreating Sample Announcements...'))
        
        # Announcement 1: Summer Vaccination Special
        ann1, created = Announcement.objects.get_or_create(
            title='Summer Vaccination Special',
            defaults={
                'description': 'Get 20% off all vaccinations during June and July. Keep your pets protected for less!',
                'valid_until': date.today() + timedelta(days=60),
                'icon_type': 'vaccination',
                'is_active': True,
                'created_by': master_admin
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  ✅ Created announcement: Summer Vaccination Special'))
        else:
            self.stdout.write(self.style.WARNING('  ℹ️  Announcement already exists: Summer Vaccination Special'))
        
        # Announcement 2: New Client Welcome Package
        ann2, created = Announcement.objects.get_or_create(
            title='New Client Welcome Package',
            defaults={
                'description': 'First-time clients receive 15% off their initial consultation and a free pet care kit.',
                'valid_until': None,  # Ongoing - no expiration
                'icon_type': 'welcome',
                'is_active': True,
                'created_by': master_admin
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('  ✅ Created announcement: New Client Welcome Package'))
        else:
            self.stdout.write(self.style.WARNING('  ℹ️  Announcement already exists: New Client Welcome Package'))
        
        # ============= SUMMARY =============
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('✅ Database seeded successfully!'))
        self.stdout.write(self.style.SUCCESS('='*60))
        
        self.stdout.write(self.style.SUCCESS('\n📧 Admin Accounts:'))
        self.stdout.write('  • Master Admin:')
        self.stdout.write('    Email: maria.santos@pawpal.com')
        self.stdout.write('    Password: MasterAdmin123!')
        self.stdout.write('    Role: MASTER')
        
        self.stdout.write('\n  • Veterinarian:')
        self.stdout.write('    Email: hazel.liwanag@pawpal.com')
        self.stdout.write('    Password: VetAdmin123!')
        self.stdout.write('    Role: VET')
        
        self.stdout.write('\n  • Front Desk:')
        self.stdout.write('    Email: john.delacruz@pawpal.com')
        self.stdout.write('    Password: DeskAdmin123!')
        self.stdout.write('    Role: DESK')
        
        self.stdout.write(self.style.SUCCESS('\n👤 Pet Owner Accounts:'))
        self.stdout.write('  • Mal Beausoleil:')
        self.stdout.write('    Email: mal.beausoleil@example.com')
        self.stdout.write('    Password: Owner123!')
        
        self.stdout.write('\n  • Sarah Johnson:')
        self.stdout.write('    Email: sarah.j@example.com')
        self.stdout.write('    Password: Owner123!')
        
        self.stdout.write(self.style.SUCCESS('\n🐾 Sample Pets:'))
        self.stdout.write('  • Charlie (Cat) - Owned by Mal Beausoleil')
        self.stdout.write('  • Max (Dog) - Owned by Sarah Johnson')
        
        self.stdout.write(self.style.SUCCESS('\n📢 Sample Announcements:'))
        self.stdout.write('  • Summer Vaccination Special (Expires in 60 days)')
        self.stdout.write('  • New Client Welcome Package (Ongoing)')
        
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.WARNING('⚠️  IMPORTANT:'))
        self.stdout.write('   The Master Admin account (maria.santos@pawpal.com)')
        self.stdout.write('   can ONLY be created through this seed command.')
        self.stdout.write('   Never create Master Admin via API for security.')
        self.stdout.write('='*60 + '\n')

