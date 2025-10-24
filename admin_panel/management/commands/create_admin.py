from django.core.management.base import BaseCommand
from django.contrib.auth.models import User as DjangoUser
from admin_panel.models import AdminUser

class Command(BaseCommand):
    help = 'Create admin user'
    
    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, help='Admin email')
        parser.add_argument('--password', type=str, help='Admin password')
        parser.add_argument('--first_name', type=str, help='First name')
        parser.add_argument('--last_name', type=str, help='Last name')
    
    def handle(self, *args, **options):
        email = options['email'] or input('Enter admin email: ')
        password = options['password'] or input('Enter admin password: ')
        first_name = options['first_name'] or input('Enter first name: ')
        last_name = options['last_name'] or input('Enter last name: ')
        
        try:
            # Create Django user first
            django_user = DjangoUser.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_staff=True,
                is_superuser=True
            )
            
            # Create admin profile
            admin_user = AdminUser.objects.create(
                user=django_user,
                email=email,
                role='admin'
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Admin user created successfully: {email}')
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Failed to create admin user: {e}')
            )