from django.db import models
from django.contrib.auth.models import User as DjangoUser
from django.utils import timezone
from chatbot.models import User  # Keep User import
# from chatbot.models import AIDiagnosis  # TEMPORARILY COMMENTED OUT
from pets.models import Pet

class AdminUser(models.Model):
    """Admin user profile linked to Django User"""
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
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(AdminUser, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return f"{self.setting_key}: {self.setting_value}"
    
    class Meta:
        db_table = 'admin_settings'

class Announcement(models.Model):
    """System announcements"""
    title = models.CharField(max_length=200)
    content = models.TextField()
    announcement_type = models.CharField(max_length=20, choices=[
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('urgent', 'Urgent'),
        ('maintenance', 'Maintenance'),
        ('feature', 'New Feature'),
    ], default='info')
    target_audience = models.CharField(max_length=20, choices=[
        ('all', 'All Users'),
        ('new', 'New Users'),
        ('active', 'Active Users'),
        ('premium', 'Premium Users'),
    ], default='all')
    is_active = models.BooleanField(default=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(AdminUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.title} ({self.announcement_type})"
    
    class Meta:
        db_table = 'announcements'
        ordering = ['-created_at']

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