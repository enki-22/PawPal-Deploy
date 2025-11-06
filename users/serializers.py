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
    # Accept both formats: 'name' OR 'first_name' + 'last_name'
    name = serializers.CharField(max_length=255, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    
    # Accept both 'username' and 'email' (email is required)
    username = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=True)
    
    # Password fields
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Contact info - accept both 'contact_info' and 'phone_number'
    contact_info = serializers.CharField(max_length=20, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    # Profile fields
    province = serializers.CharField(max_length=100, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate required fields and password match"""
        errors = {}
        
        # Check if name OR (first_name and/or last_name) is provided
        name = data.get('name', '').strip()
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        username = data.get('username', '').strip()
        
        # If no name provided, use username as fallback
        if not name and not first_name and not last_name:
            if username:
                # Use username as name if no name provided
                name = username
            else:
                errors['name'] = ['Either "name", "first_name", or "username" must be provided']
        
        # Check email
        email = data.get('email', '').strip()
        if not email:
            errors['email'] = ['Email is required']
        elif User.objects.filter(email=email).exists():
            errors['email'] = ['Email already exists']
        
        # Check password
        password = data.get('password', '')
        if not password:
            errors['password'] = ['Password is required']
        else:
            is_valid, error_message = validate_password(password)
            if not is_valid:
                errors['password'] = [error_message]
        
        # Check password confirmation if provided
        password_confirm = data.get('password_confirm', '')
        if password_confirm and password != password_confirm:
            errors['password_confirm'] = ['Passwords do not match']
        
        if errors:
            raise serializers.ValidationError(errors)
        
        return data
    
    def validate_email(self, value):
        """Check if email already exists"""
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value
    
    def validate_password(self, value):
        """Validate password meets requirements"""
        if value:
            is_valid, error_message = validate_password(value)
            if not is_valid:
                raise serializers.ValidationError(error_message)
        return value
    
    def create(self, validated_data):
        """Create user and profile"""
        # Get name - prefer 'name', fallback to first_name + last_name, then username
        name = validated_data.get('name', '').strip()
        first_name = validated_data.get('first_name', '').strip()
        last_name = validated_data.get('last_name', '').strip()
        username = validated_data.get('username', '').strip()
        
        if name:
            # Split name into first_name and last_name
            name_parts = name.split(maxsplit=1)
            first_name = name_parts[0] if len(name_parts) > 0 else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
        elif not first_name and not last_name and username:
            # Use username as first_name if no name provided
            first_name = username
            last_name = ''
        
        email = validated_data['email']
        password = validated_data['password']
        
        # Get contact info - prefer 'contact_info', fallback to 'phone_number'
        contact_info = validated_data.get('contact_info', '').strip() or validated_data.get('phone_number', '').strip()
        
        # Generate username from email (part before @) or use provided username
        username = validated_data.get('username', '').strip()
        if not username:
            username = email.split('@')[0]
        
        # Ensure username is unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Create user (active - OTP verification temporarily disabled)
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=True  # Temporarily skip OTP verification
        )
        
        # Update the profile created by signal
        profile = user.profile
        if contact_info:
            profile.phone_number = contact_info
        if validated_data.get('province'):
            profile.province = validated_data['province']
        if validated_data.get('city'):
            profile.city = validated_data['city']
        if validated_data.get('address'):
            profile.address = validated_data['address']
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