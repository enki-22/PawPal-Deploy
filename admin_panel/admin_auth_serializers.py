"""
Serializers for admin authentication endpoints
Implements validation for login, password changes, and OTP requests
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password as django_validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Admin, AdminPasswordHistory
import re


class AdminLoginSerializer(serializers.Serializer):
    """
    Serializer for admin login
    POST /api/admin/login
    """
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'Email is required',
            'invalid': 'Enter a valid email address'
        }
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        error_messages={
            'required': 'Password is required'
        }
    )
    
    def validate(self, data):
        """Validate credentials and return admin if valid"""
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            raise serializers.ValidationError({
                'detail': 'Both email and password are required'
            })
        
        # Try to find admin
        try:
            admin = Admin.objects.get(email=email)
        except Admin.DoesNotExist:
            raise serializers.ValidationError({
                'detail': 'Invalid credentials'
            })
        
        # Check if admin is active
        if not admin.is_active:
            raise serializers.ValidationError({
                'detail': 'Admin account is inactive'
            })
        
        # Check password
        if not admin.check_password(password):
            raise serializers.ValidationError({
                'detail': 'Invalid credentials'
            })
        
        data['admin'] = admin
        return data


class AdminInfoSerializer(serializers.ModelSerializer):
    """
    Serializer for admin information (response)
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = Admin
        fields = [
            'id', 'name', 'email', 'role', 'role_display',
            'contact_number', 'clinic_info', 'profile_image',
            'created_at', 'last_login'
        ]
        read_only_fields = fields


class VerifyTokenSerializer(serializers.Serializer):
    """
    Serializer for token verification
    POST /api/admin/verify-token
    """
    token = serializers.CharField(
        required=True,
        error_messages={
            'required': 'Token is required'
        }
    )


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing admin password
    POST /api/admin/change-password
    """
    current_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        error_messages={
            'required': 'Current password is required'
        }
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        min_length=8,
        error_messages={
            'required': 'New password is required',
            'min_length': 'Password must be at least 8 characters long'
        }
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        error_messages={
            'required': 'Password confirmation is required'
        }
    )
    
    def validate_new_password(self, value):
        """
        Validate new password meets requirements:
        - At least 8 characters
        - Contains uppercase letter
        - Contains lowercase letter
        - Contains number
        - Contains special character
        """
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long"
            )
        
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError(
                "Password must contain at least one uppercase letter"
            )
        
        if not re.search(r"[a-z]", value):
            raise serializers.ValidationError(
                "Password must contain at least one lowercase letter"
            )
        
        if not re.search(r"\d", value):
            raise serializers.ValidationError(
                "Password must contain at least one number"
            )
        
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise serializers.ValidationError(
                "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)"
            )
        
        return value
    
    def validate(self, data):
        """Validate passwords match and not in history"""
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        # Check if passwords match
        if new_password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match'
            })
        
        # Check if new password same as current
        current_password = data.get('current_password')
        if new_password == current_password:
            raise serializers.ValidationError({
                'new_password': 'New password must be different from current password'
            })
        
        return data


class RequestPasswordResetSerializer(serializers.Serializer):
    """
    Serializer for requesting password reset
    POST /api/admin/request-password-reset
    Only for VET and DESK roles (NOT MASTER)
    """
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'Email is required',
            'invalid': 'Enter a valid email address'
        }
    )
    
    def validate_email(self, value):
        """Normalize email"""
        return value.lower().strip()


class ResetPasswordSerializer(serializers.Serializer):
    """
    Serializer for resetting password with OTP
    """
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(required=True, min_length=6, max_length=6)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        min_length=8
    )
    confirm_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate_new_password(self, value):
        """Validate new password meets requirements"""
        if len(value) < 8:
            raise serializers.ValidationError(
                "Password must be at least 8 characters long"
            )
        
        if not re.search(r"[A-Z]", value):
            raise serializers.ValidationError(
                "Password must contain at least one uppercase letter"
            )
        
        if not re.search(r"[a-z]", value):
            raise serializers.ValidationError(
                "Password must contain at least one lowercase letter"
            )
        
        if not re.search(r"\d", value):
            raise serializers.ValidationError(
                "Password must contain at least one number"
            )
        
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", value):
            raise serializers.ValidationError(
                "Password must contain at least one special character"
            )
        
        return value
    
    def validate(self, data):
        """Validate passwords match"""
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match'
            })
        return data

