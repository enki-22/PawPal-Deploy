from django.db import models
from django.contrib.auth.models import User as DjangoUser
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from chatbot.models import User  # Keep User import
# from chatbot.models import AIDiagnosis  # TEMPORARILY COMMENTED OUT
from pets.models import Pet

class Admin(models.Model):
    """
    Admin model for PawPal admin panel authentication
    Separate from regular User model with role-based access control
    """
    ROLE_CHOICES = [
        ('MASTER', 'Master Admin'),
        ('VET', 'Veterinarian'),
        ('DESK', 'Front Desk'),
    ]
    
    email = models.EmailField(unique=True, db_index=True)
    password = models.CharField(max_length=255)  # Hashed password
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False, help_text="Soft delete flag for audit purposes")
    
    # Profile information
    profile_image = models.ImageField(
        upload_to='admin_profiles/',
        null=True,
        blank=True,
        help_text="Admin profile picture"
    )
    recovery_email = models.EmailField(
        null=True,
        blank=True,
        help_text="Email for password recovery"
    )
    recovery_email_verified = models.BooleanField(
        default=False,
        help_text="Whether the recovery email has been verified"
    )
    clinic_info = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Clinic or organization information"
    )
    contact_number = models.CharField(max_length=20)
    
    # Timestamps
    password_updated_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'admins'
        ordering = ['-created_at']
        verbose_name = 'Admin'
        verbose_name_plural = 'Admins'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_role_display()}) - {self.email}"
    
    def set_password(self, raw_password):
        """Hash and set password"""
        self.password = make_password(raw_password)
        self.password_updated_at = timezone.now()
    
    def check_password(self, raw_password):
        """Check if password matches"""
        return check_password(raw_password, self.password)
    
    def save(self, *args, **kwargs):
        """Override save to ensure password is hashed"""
        # If password doesn't start with hash prefix, hash it
        if self.password and not self.password.startswith(('pbkdf2_', 'bcrypt', 'argon2')):
            self.set_password(self.password)
        super().save(*args, **kwargs)


class AdminPasswordHistory(models.Model):
    """
    Track last 3 passwords for each admin to prevent password reuse
    """
    admin = models.ForeignKey(
        Admin,
        on_delete=models.CASCADE,
        related_name='password_history'
    )
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'admin_password_history'
        ordering = ['-created_at']
        verbose_name = 'Admin Password History'
        verbose_name_plural = 'Admin Password Histories'
        indexes = [
            models.Index(fields=['admin', '-created_at']),
        ]
    
    def __str__(self):
        return f"Password history for {self.admin.name} - {self.created_at}"
    
    @classmethod
    def add_password_to_history(cls, admin, password_hash):
        """Add password to history and keep only last 3"""
        cls.objects.create(admin=admin, password_hash=password_hash)
        
        # Keep only last 3 passwords
        old_passwords = cls.objects.filter(admin=admin).order_by('-created_at')[3:]
        for old_password in old_passwords:
            old_password.delete()
    
    @classmethod
    def is_password_in_history(cls, admin, raw_password):
        """Check if password was used in last 3 passwords"""
        history = cls.objects.filter(admin=admin).order_by('-created_at')[:3]
        for record in history:
            if check_password(raw_password, record.password_hash):
                return True
        return False


# Keep AdminUser for backward compatibility
class AdminUser(models.Model):
    """Admin user profile linked to Django User (DEPRECATED - Use Admin model)"""
    user = models.OneToOneField(DjangoUser, on_delete=models.CASCADE, related_name='admin_profile')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=50, default='admin')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.email})"
    
    @property
    def first_name(self):
        return self.user.first_name
    
    @property
    def last_name(self):
        return self.user.last_name
    
    @property
    def username(self):
        return self.user.username
    
    @property
    def is_staff(self):
        return self.user.is_staff
    
    @property
    def last_login(self):
        return self.user.last_login
    
    def check_password(self, password):
        return self.user.check_password(password)
    
    class Meta:
        db_table = 'admin_users'

class AdminSession(models.Model):
    """Track admin login sessions"""
    admin = models.ForeignKey(AdminUser, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.admin.email} - {self.login_time}"
    
    class Meta:
        db_table = 'admin_sessions'

class AdminSettings(models.Model):
    """Admin system settings"""
    setting_key = models.CharField(max_length=100, unique=True)
    setting_value = models.TextField()
    setting_type = models.CharField(max_length=20, choices=[
        ('string', 'String'),
        ('integer', 'Integer'),
        ('boolean', 'Boolean'),
        ('json', 'JSON'),
    ], default='string')
    description = models.TextField(default="No description provided")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return f"{self.setting_key}: {self.setting_value}"
    
    class Meta:
        db_table = 'admin_settings'

class Announcement(models.Model):
    """
    System announcements for PawPal platform
    Used for notifications, promotions, and general announcements
    """
    ICON_CHOICES = [
        ('vaccination', 'Vaccination'),
        ('wellness', 'Wellness'),
        ('welcome', 'Welcome'),
        ('general', 'General'),
    ]
    
    title = models.CharField(max_length=100, help_text="Announcement title (max 100 characters)")
    description = models.TextField(max_length=500, help_text="Announcement description (max 500 characters)")
    valid_until = models.DateField(
        null=True,
        blank=True,
        help_text="Expiration date (null = ongoing/never expires)"
    )
    icon_type = models.CharField(
        max_length=20,
        choices=ICON_CHOICES,
        default='general',
        help_text="Icon type for display"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether announcement is currently active"
    )
    created_by = models.ForeignKey(
        Admin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='announcements',
        help_text="Admin who created this announcement"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def is_expired(self):
        """
        Check if announcement is expired
        Returns True if valid_until is set and is in the past
        """
        from datetime import date
        if self.valid_until is None:
            return False
        return self.valid_until < date.today()
    
    def __str__(self):
        return f"{self.title} ({self.get_icon_type_display()})"
    
    class Meta:
        db_table = 'announcements'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', '-created_at']),
            models.Index(fields=['valid_until']),
        ]
        verbose_name = 'Announcement'
        verbose_name_plural = 'Announcements'

# TEMPORARILY COMMENTED OUT - SOAPReport will be added after AIDiagnosis is created
# We'll add this back in a future migration
"""
class SOAPReport(models.Model):
    # SOAP (Subjective, Objective, Assessment, Plan) Reports
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='soap_reports')
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE, related_name='soap_reports')
    ai_diagnosis = models.ForeignKey(AIDiagnosis, on_delete=models.CASCADE, related_name='soap_reports')
    
    # SOAP Components
    subjective = models.TextField(help_text="Pet owner's description of symptoms")
    objective = models.TextField(help_text="Observable/measurable data from AI analysis")
    assessment = models.TextField(help_text="AI diagnosis and interpretation")
    plan = models.TextField(help_text="Recommended treatment and follow-up")
    
    # Additional fields
    case_id = models.CharField(max_length=50, unique=True)
    severity_level = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ])
    
    # Veterinary information
    recommended_vet_visit = models.BooleanField(default=False)
    urgency_level = models.CharField(max_length=20, choices=[
        ('routine', 'Routine Check-up'),
        ('soon', 'Schedule Soon'),
        ('urgent', 'Urgent Care'),
        ('emergency', 'Emergency'),
    ])
    
    # Follow-up
    follow_up_required = models.BooleanField(default=False)
    follow_up_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    # Metadata
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=[
        ('draft', 'Draft'),
        ('completed', 'Completed'),
        ('reviewed', 'Reviewed'),
        ('archived', 'Archived'),
    ], default='completed')
    
    def __str__(self):
        return f"SOAP-{self.case_id} - {self.pet.name} ({self.user.username})"
    
    class Meta:
        db_table = 'soap_reports'
        ordering = ['-generated_at']
"""

class DashboardStats(models.Model):
    """Dashboard analytics data"""
    date = models.DateField(unique=True)
    
    # User statistics
    total_users = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    
    # Pet statistics
    total_pets = models.IntegerField(default=0)
    new_pets = models.IntegerField(default=0)
    
    # Diagnosis statistics
    total_diagnoses = models.IntegerField(default=0)
    diagnoses_today = models.IntegerField(default=0)
    
    # Performance metrics
    avg_response_time = models.FloatField(default=0.0)
    accuracy_rate = models.FloatField(default=0.0)
    user_satisfaction = models.FloatField(default=0.0)
    
    # Usage analytics
    peak_usage_hour = models.IntegerField(default=0)
    total_messages = models.IntegerField(default=0)
    avg_session_duration = models.FloatField(default=0.0)
    
    def __str__(self):
        return f"Dashboard Stats - {self.date}"
    
    class Meta:
        db_table = 'dashboard_stats'
        ordering = ['-date']


class AdminAuditLog(models.Model):
    """
    Audit log for admin account management actions
    Tracks all CRUD operations on admin accounts
    """
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
        ('STATUS_CHANGE', 'Status Changed'),
        ('ROLE_CHANGE', 'Role Changed'),
        ('EMAIL_CHANGE', 'Email Changed'),
    ]
    
    admin = models.ForeignKey(
        Admin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="Admin who performed the action"
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_admin_id = models.CharField(
        max_length=100,
        help_text="ID of the admin account that was acted upon"
    )
    target_admin_email = models.EmailField(
        null=True,
        blank=True,
        help_text="Email of the admin account that was acted upon"
    )
    details = models.JSONField(
        default=dict,
        help_text="Additional details about the action"
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'admin_audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['admin', '-timestamp']),
            models.Index(fields=['target_admin_id']),
            models.Index(fields=['action', '-timestamp']),
        ]
        verbose_name = 'Admin Audit Log'
        verbose_name_plural = 'Admin Audit Logs'
    
    def __str__(self):
        return f"{self.get_action_display()} - {self.target_admin_email or self.target_admin_id} - {self.timestamp}"