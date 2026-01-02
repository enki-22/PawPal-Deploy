from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from admin_panel.models import Admin

class Command(BaseCommand):
    help = 'Seeds 10 Veterinarian and 10 Front Desk accounts'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('\n💉 Checking for Staff Accounts...'))

        # Roles defined in your admin_panel.models.Admin.ROLE_CHOICES
        staff_to_create = [
            {'role': 'VET', 'prefix': 'vet', 'label': 'Veterinarian'},
            {'role': 'DESK', 'prefix': 'desk', 'label': 'Front Desk'}
        ]

        for config in staff_to_create:
            for i in range(1, 11):
                email = f"{config['prefix']}{i}@pawpal.com"
                
                # get_or_create is critical here so it doesn't duplicate every time you deploy
                admin, created = Admin.objects.get_or_create(
                    email=email,
                    defaults={
                        'name': f"{config['label']} User {i}",
                        'role': config['role'],
                        'password': make_password('StaffPassword123!'),
                        'contact_number': f'090000000{i:02d}',
                        'clinic_info': 'PawPal South Valley Clinic',
                        'is_active': True,
                        'password_updated_at': timezone.now(),
                    }
                )

                if created:
                    self.stdout.write(self.style.SUCCESS(f"  ✅ Created: {email}"))
                else:
                    self.stdout.write(f"  ℹ️  Exists: {email}")

        self.stdout.write(self.style.SUCCESS('\n🎉 Staff account check complete!'))