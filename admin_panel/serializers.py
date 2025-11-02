from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import AdminUser, AdminSession, AdminSettings, Announcement, DashboardStats  # REMOVED SOAPReport
from chatbot.models import User  # Keep User import
# from chatbot.models import AIDiagnosis  # TEMPORARILY COMMENTED OUT
from pets.models import Pet

class AdminLoginSerializer(serializers.Serializer):
    """Admin login serializer"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            try:
                admin_user = AdminUser.objects.get(email=email, is_active=True)
                if admin_user.check_password(password):
                    if not admin_user.is_staff:
                        raise serializers.ValidationError("Access denied. Admin privileges required.")
                    data['admin_user'] = admin_user
                    return data
                else:
                    raise serializers.ValidationError("Invalid credentials.")
            except AdminUser.DoesNotExist:
                raise serializers.ValidationError("Admin account not found.")
        else:
            raise serializers.ValidationError("Email and password are required.")

class AdminUserSerializer(serializers.ModelSerializer):
    """Admin user profile serializer"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AdminUser
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 
                 'full_name', 'phone', 'role', 'is_active', 'created_at', 'last_login']
        read_only_fields = ['id', 'created_at', 'last_login']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class AdminSettingsSerializer(serializers.ModelSerializer):
    """Admin settings serializer"""
    class Meta:
        model = AdminSettings
        fields = ['id', 'setting_key', 'setting_value', 'setting_type', 
                 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserManagementSerializer(serializers.ModelSerializer):
    """Serializer for managing pet owners"""
    pets_count = serializers.SerializerMethodField()
    diagnoses_count = serializers.SerializerMethodField()
    last_diagnosis = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'username',
                 'is_active', 'date_joined', 'last_login', 'pets_count', 
                 'diagnoses_count', 'last_diagnosis']
    
    def get_pets_count(self, obj):
        return obj.pets.count() if hasattr(obj, 'pets') else 0
    
    def get_diagnoses_count(self, obj):
        # Will be updated when AIDiagnosis is available
        return 0
    
    def get_last_diagnosis(self, obj):
        # Will be updated when AIDiagnosis is available
        return None

class PetProfileSerializer(serializers.ModelSerializer):
    """Pet profile management serializer"""
    owner_name = serializers.SerializerMethodField()
    diagnoses_count = serializers.SerializerMethodField()
    last_diagnosis = serializers.SerializerMethodField()
    
    class Meta:
        model = Pet
        fields = ['id', 'name', 'species', 'breed', 'age', 'weight', 
                 'owner', 'owner_name', 'created_at', 'diagnoses_count', 'last_diagnosis']
    
    def get_owner_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}".strip()
    
    def get_diagnoses_count(self, obj):
        # Will be updated when AIDiagnosis is available
        return 0
    
    def get_last_diagnosis(self, obj):
        # Will be updated when AIDiagnosis is available
        return None

class AnnouncementSerializer(serializers.ModelSerializer):
    """Announcement serializer"""
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'announcement_type', 'target_audience',
                 'is_active', 'start_date', 'end_date', 'created_by', 'created_by_name',
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()

# TEMPORARILY COMMENTED OUT - SOAPReportSerializer will be added after AIDiagnosis is created
"""
class SOAPReportSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    pet_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SOAPReport
        fields = ['id', 'case_id', 'user', 'user_name', 'pet', 'pet_name',
                 'subjective', 'objective', 'assessment', 'plan',
                 'severity_level', 'recommended_vet_visit', 'urgency_level',
                 'follow_up_required', 'follow_up_date', 'notes',
                 'generated_at', 'status']
        read_only_fields = ['id', 'generated_at']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip()
    
    def get_pet_name(self, obj):
        return obj.pet.name
"""

class DashboardStatsSerializer(serializers.ModelSerializer):
    """Dashboard statistics serializer"""
    class Meta:
        model = DashboardStats
        fields = '__all__'

class DashboardAnalyticsSerializer(serializers.Serializer):
    """Complete dashboard analytics"""
    overview_stats = serializers.DictField()
    user_analytics = serializers.DictField()
    pet_analytics = serializers.DictField()
    diagnosis_analytics = serializers.DictField()
    performance_metrics = serializers.DictField()
    usage_trends = serializers.ListField()
    top_symptoms = serializers.ListField()
    geographic_data = serializers.DictField()