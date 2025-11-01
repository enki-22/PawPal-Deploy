from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import UserProfile, OTP
from django.utils import timezone
from .utils import validate_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        # Only include fields that actually exist in your UserProfile model
        fields = ['user', 'phone_number', 'province', 'city', 'address', 'date_of_birth', 'is_vet_admin']

class UserRegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    contact_info = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def validate_password(self, value):
        """Validate password meets requirements"""
        is_valid, error_message = validate_password(value)
        if not is_valid:
            raise serializers.ValidationError(error_message)
        return value
    
    def create(self, validated_data):
        """Create user and profile"""
        name = validated_data['name']
        email = validated_data['email']
        password = validated_data['password']
        contact_info = validated_data.get('contact_info', '')
        
        # Generate username from email (part before @)
        username = email.split('@')[0]
        
        # Ensure username is unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Create user (inactive until OTP verified)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_active=False  # Will be activated after OTP verification
        )
        
        # Split name into first_name and last_name
        name_parts = name.strip().split(maxsplit=1)
        user.first_name = name_parts[0] if len(name_parts) > 0 else ''
        user.last_name = name_parts[1] if len(name_parts) > 1 else ''
        user.save()
        
        # Update the profile created by signal
        profile = user.profile
        profile.phone_number = contact_info
        profile.is_verified = False
        profile.save()
        
        return user


class OTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=[OTP.PURPOSE_ACCOUNT, OTP.PURPOSE_PASSWORD])


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.ChoiceField(choices=[OTP.PURPOSE_ACCOUNT, OTP.PURPOSE_PASSWORD])
    code = serializers.RegexField(regex=r'^\d{6}$')


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.RegexField(regex=r'^\d{6}$')
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        """Validate password meets requirements"""
        is_valid, error_message = validate_password(value)
        if not is_valid:
            raise serializers.ValidationError(error_message)
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)