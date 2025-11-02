from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import secrets

from .models import OTP
from .serializers import (
    UserRegistrationSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
    PasswordResetRequestSerializer,
    PasswordResetSerializer,
    LoginSerializer,
)
from .utils import generate_jwt_token


def _generate_otp_code() -> str:
    # Cryptographically secure 6-digit numeric
    return f"{secrets.randbelow(1000000):06d}"


def _rate_limit_ok(email: str, purpose: str) -> bool:
    one_hour_ago = timezone.now() - timezone.timedelta(hours=1)
    count = OTP.objects.filter(email=email, purpose=purpose, created_at__gte=one_hour_ago).count()
    return count < 3


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def register(request):
    """
    POST /api/auth/register
    Input: name, email, password, contact_info
    - Generate 6-digit OTP
    - Send OTP email (console backend for dev)
    - Return: user_id, message "OTP sent to email"
    """
    serializer = UserRegistrationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False, 
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    # Create inactive user
    with transaction.atomic():
        user = serializer.save()
        
        # Generate OTP for account creation
        otp = OTP.create_new(email=user.email, purpose=OTP.PURPOSE_ACCOUNT, user=user)
        otp.code = _generate_otp_code()
        otp.save()
        
        # Send OTP email
        send_mail(
            subject='Verify Your PawPal Account',
            message=f'Welcome to PawPal! Your verification code is {otp.code}. It will expire in 10 minutes.',
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[user.email],
            fail_silently=True,
        )
        
    return Response({
        'success': True,
        'user_id': user.id,
        'message': 'OTP sent to email'
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def send_otp(request):
    """
    POST /api/auth/send-otp
    Input: email, purpose (account_creation|password_reset)
    - Rate limit: Max 3 per hour per email
    - Generate new OTP, invalidate old ones
    - Send email
    - Return: success message
    """
    data_ser = OTPRequestSerializer(data=request.data)
    if not data_ser.is_valid():
        return Response({
            'success': False, 
            'error': data_ser.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = data_ser.validated_data['email']
    purpose = data_ser.validated_data['purpose']

    # Rate limiting check
    if not _rate_limit_ok(email, purpose):
        return Response({
            'success': False, 
            'error': 'Too many OTP requests. Please try again in 1 hour.',
            'code': 'RATE_LIMIT_EXCEEDED'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    # Generate new OTP (invalidates old ones automatically via create_new)
    otp = OTP.create_new(email=email, purpose=purpose)
    otp.code = _generate_otp_code()
    otp.save()

    # Send email
    send_mail(
        subject='Your PawPal OTP Code',
        message=f"Your OTP code is {otp.code}. It will expire in 10 minutes.",
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        recipient_list=[email],
        fail_silently=True,
    )
    
    return Response({
        'success': True, 
        'message': 'OTP sent to email'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def verify_otp(request):
    """
    POST /api/auth/verify-otp
    Input: email, otp_code, purpose
    - Validate: code matches, not expired (10 min), attempts < 3
    - If account_creation: activate user account
    - If password_reset: return token for password reset
    - Return: success, token (if needed)
    """
    data_ser = OTPVerifySerializer(data=request.data)
    if not data_ser.is_valid():
        return Response({
            'success': False, 
            'error': data_ser.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = data_ser.validated_data['email']
    purpose = data_ser.validated_data['purpose']
    code = data_ser.validated_data['code']

    try:
        otp = OTP.objects.filter(email=email, purpose=purpose).latest('created_at')
    except OTP.DoesNotExist:
        return Response({
            'success': False, 
            'error': 'Invalid OTP code',
            'code': 'INVALID_OTP'
        }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    # Check if already verified
    if otp.is_verified:
        return Response({
            'success': True, 
            'message': 'OTP already verified'
        })

    # Check expiration (10 minutes)
    if timezone.now() > otp.expires_at:
        return Response({
            'success': False, 
            'error': 'OTP has expired. Please request a new code.',
            'code': 'OTP_EXPIRED'
        }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    # Check attempts (max 3)
    if otp.attempts >= 3:
        # Calculate cooldown time (5 minutes from last attempt)
        cooldown_end = otp.created_at + timezone.timedelta(minutes=15)  # 10 min expiry + 5 min cooldown
        return Response({
            'success': False, 
            'error': 'Too many failed attempts. Please wait 5 minutes and request a new code.',
            'code': 'MAX_ATTEMPTS_EXCEEDED'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    # Verify code
    if otp.code != code:
        otp.attempts += 1
        otp.save(update_fields=['attempts'])
        remaining = max(0, 3 - otp.attempts)
        return Response({
            'success': False, 
            'error': f'Invalid code. {remaining} attempts remaining.',
            'code': 'INVALID_OTP'
        }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    # Mark OTP as verified
    otp.is_verified = True
    otp.save(update_fields=['is_verified'])

    # Handle account creation
    if purpose == OTP.PURPOSE_ACCOUNT and otp.user:
        otp.user.is_active = True
        otp.user.save(update_fields=['is_active'])
        
        # Update profile verification status
        if hasattr(otp.user, 'profile'):
            otp.user.profile.is_verified = True
            otp.user.profile.save(update_fields=['is_verified'])
        
        return Response({
            'success': True, 
            'message': 'Account verified successfully. You can now log in.'
        })
    
    # Handle password reset
    if purpose == OTP.PURPOSE_PASSWORD:
        # Generate temporary token for password reset
        reset_token = generate_jwt_token(otp.user) if otp.user else None
        return Response({
            'success': True, 
            'message': 'OTP verified',
            'token': reset_token
        })

    return Response({
        'success': True, 
        'message': 'OTP verified'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def request_password_reset(request):
    """
    POST /api/auth/request-password-reset
    Input: email
    - Generate OTP with purpose="password_reset"
    - Send email
    - Return: generic success message (don't reveal if email exists)
    """
    ser = PasswordResetRequestSerializer(data=request.data)
    if not ser.is_valid():
        # Return generic success to avoid user enumeration
        return Response({
            'success': True, 
            'message': 'If the email is registered, a password reset code has been sent.'
        }, status=status.HTTP_200_OK)
    
    email = ser.validated_data['email']

    # Always respond with success to avoid user enumeration
    # Only send email if rate limit not exceeded
    if _rate_limit_ok(email, OTP.PURPOSE_PASSWORD):
        # Check if user exists before creating OTP
        try:
            user = User.objects.get(email=email)
            otp = OTP.create_new(email=email, purpose=OTP.PURPOSE_PASSWORD, user=user)
            otp.code = _generate_otp_code()
            otp.save()
            
            send_mail(
                subject='Reset Your PawPal Password',
                message=f"Use this code to reset your password: {otp.code}. It expires in 10 minutes.",
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                recipient_list=[email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            # Don't reveal that user doesn't exist
            pass
    
    return Response({
        'success': True, 
        'message': 'If the email is registered, a password reset code has been sent.'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def reset_password(request):
    """
    POST /api/auth/reset-password
    Input: email, otp_code, new_password
    - Verify OTP is valid
    - Hash new password
    - Invalidate all user sessions
    - Return: success message
    """
    ser = PasswordResetSerializer(data=request.data)
    if not ser.is_valid():
        return Response({
            'success': False, 
            'error': ser.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = ser.validated_data['email']
    otp_code = ser.validated_data['otp_code']
    new_password = ser.validated_data['new_password']

    # Get latest OTP for password reset
    try:
        otp = OTP.objects.filter(email=email, purpose=OTP.PURPOSE_PASSWORD).latest('created_at')
    except OTP.DoesNotExist:
        return Response({
            'success': False, 
            'error': 'Invalid OTP code',
            'code': 'INVALID_OTP'
        }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    # Check expiration
    if timezone.now() > otp.expires_at:
        return Response({
            'success': False, 
            'error': 'OTP has expired',
            'code': 'OTP_EXPIRED'
        }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
    
    # Check attempts
    if otp.attempts >= 3:
        return Response({
            'success': False, 
            'error': 'Too many failed attempts. Please request a new code.',
            'code': 'MAX_ATTEMPTS_EXCEEDED'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    # Verify code
    if otp.code != otp_code:
        otp.attempts += 1
        otp.save(update_fields=['attempts'])
        remaining = max(0, 3 - otp.attempts)
        return Response({
            'success': False, 
            'error': f'Invalid code. {remaining} attempts remaining.',
            'code': 'INVALID_OTP'
        }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

    # Mark OTP as verified
    otp.is_verified = True
    otp.save(update_fields=['is_verified'])

    # Update password
    try:
        user = User.objects.get(email=email)
        user.password = make_password(new_password)
        user.save(update_fields=['password'])
        
        # Invalidate all sessions/tokens for this user
        # Note: With JWT, tokens remain valid until expiry
        # For Token auth, we can delete tokens
        from rest_framework.authtoken.models import Token
        Token.objects.filter(user=user).delete()
        
        return Response({
            'success': True, 
            'message': 'Password reset successfully. Please log in with your new password.'
        }, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        # Generic success to avoid enumeration
        return Response({
            'success': True, 
            'message': 'Password reset successfully. Please log in with your new password.'
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def login(request):
    """
    POST /api/auth/login
    Input: email, password
    - Validate credentials
    - Check account is active
    - Return: JWT token, user info
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False, 
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    
    # Get user by email
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'success': False, 
            'error': 'Invalid email or password',
            'code': 'INVALID_CREDENTIALS'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Authenticate with username (Django's authenticate uses username)
    authenticated_user = authenticate(username=user.username, password=password)
    
    if not authenticated_user:
        return Response({
            'success': False, 
            'error': 'Invalid email or password',
            'code': 'INVALID_CREDENTIALS'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Check if account is active
    if not authenticated_user.is_active:
        return Response({
            'success': False, 
            'error': 'Account is not active. Please verify your email.',
            'code': 'ACCOUNT_INACTIVE'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Generate JWT token
    token = generate_jwt_token(authenticated_user)
    
    # Get user profile info
    profile = getattr(authenticated_user, 'profile', None)
    
    return Response({
        'success': True,
        'token': token,
        'user': {
            'id': authenticated_user.id,
            'email': authenticated_user.email,
            'name': f"{authenticated_user.first_name} {authenticated_user.last_name}".strip() or authenticated_user.username,
            'first_name': authenticated_user.first_name,
            'last_name': authenticated_user.last_name,
            'username': authenticated_user.username,
            'contact_info': profile.phone_number if profile else '',
            'is_verified': profile.is_verified if profile else False,
        }
    }, status=status.HTTP_200_OK)



