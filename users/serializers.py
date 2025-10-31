from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import UserProfile, OTP
from django.utils import timezone

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

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    
    # Profile fields as extra fields
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    province = serializers.CharField(max_length=100, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'phone_number', 'province', 'city', 'address'
        ]
        
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return data
    
    def create(self, validated_data):
        # Extract profile data
        profile_data = {
            'phone_number': validated_data.pop('phone_number', ''),
            'province': validated_data.pop('province', ''),
            'city': validated_data.pop('city', ''),
            'address': validated_data.pop('address', ''),
        }
        
        # Remove password_confirm
        validated_data.pop('password_confirm')
        
        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Update the profile created by signal
        profile = user.profile
        for key, value in profile_data.items():
            if hasattr(profile, key):  # Only set fields that exist
                setattr(profile, key, value)
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
    code = serializers.RegexField(regex=r'^\d{6}$')
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError('Passwords do not match')
        return data