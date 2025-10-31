from django.contrib.auth.models import User
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
)


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
    """Create user (active, no OTP verification required)."""
    serializer = UserRegistrationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({'success': False, 'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    # Create active user directly (no OTP, no inactive status)
    with transaction.atomic():
        user = serializer.save()
        # User is created as active by default via create_user
        # No need to mark inactive or send OTP
        
    return Response({
        'success': True, 
        'message': 'Registration successful. You can now log in.',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def send_otp(request):
    data_ser = OTPRequestSerializer(data=request.data)
    if not data_ser.is_valid():
        return Response({'success': False, 'error': data_ser.errors}, status=400)
    email = data_ser.validated_data['email']
    purpose = data_ser.validated_data['purpose']

    if not _rate_limit_ok(email, purpose):
        return Response({'success': False, 'error': 'Too many OTP requests. Try again later.'}, status=429)

    otp = OTP.create_new(email=email, purpose=purpose)
    otp.code = _generate_otp_code()
    otp.save()

    send_mail(
        subject='Your PawPal OTP Code',
        message=f"Your OTP code is {otp.code}. It will expire in 10 minutes.",
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
        recipient_list=[email],
        fail_silently=True,
    )
    return Response({'success': True, 'message': 'OTP sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def verify_otp(request):
    data_ser = OTPVerifySerializer(data=request.data)
    if not data_ser.is_valid():
        return Response({'success': False, 'error': data_ser.errors}, status=400)
    email = data_ser.validated_data['email']
    purpose = data_ser.validated_data['purpose']
    code = data_ser.validated_data['code']

    try:
        otp = OTP.objects.filter(email=email, purpose=purpose).latest('created_at')
    except OTP.DoesNotExist:
        return Response({'success': False, 'error': 'Invalid code.'}, status=422)

    if otp.is_verified:
        return Response({'success': True, 'message': 'Already verified.'})

    if timezone.now() > otp.expires_at:
        return Response({'success': False, 'error': 'OTP expired.'}, status=422)

    if otp.attempts >= 3:
        return Response({'success': False, 'error': 'Too many attempts. Try again later.'}, status=429)

    if otp.code != code:
        otp.attempts += 1
        otp.save(update_fields=['attempts'])
        remaining = max(0, 3 - otp.attempts)
        return Response({'success': False, 'error': f'Invalid code. {remaining} attempts remaining.'}, status=422)

    otp.is_verified = True
    otp.save(update_fields=['is_verified'])

    if purpose == OTP.PURPOSE_ACCOUNT and otp.user:
        otp.user.is_active = True
        otp.user.save(update_fields=['is_active'])

    return Response({'success': True, 'message': 'OTP verified.'})


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def request_password_reset(request):
    ser = PasswordResetRequestSerializer(data=request.data)
    if not ser.is_valid():
        return Response({'success': False}, status=200)
    email = ser.validated_data['email']

    # Always respond ok to avoid user enumeration
    if _rate_limit_ok(email, OTP.PURPOSE_PASSWORD):
        otp = OTP.create_new(email=email, purpose=OTP.PURPOSE_PASSWORD)
        otp.code = _generate_otp_code()
        otp.save()
        send_mail(
            subject='Reset Your PawPal Password',
            message=f"Use this code to reset your password: {otp.code}. It expires in 10 minutes.",
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[email],
            fail_silently=True,
        )
    return Response({'success': True, 'message': 'If the email exists, an OTP has been sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def reset_password(request):
    ser = PasswordResetSerializer(data=request.data)
    if not ser.is_valid():
        return Response({'success': False, 'error': ser.errors}, status=400)
    email = ser.validated_data['email']
    code = ser.validated_data['code']
    new_password = ser.validated_data['new_password']

    try:
        otp = OTP.objects.filter(email=email, purpose=OTP.PURPOSE_PASSWORD).latest('created_at')
    except OTP.DoesNotExist:
        return Response({'success': False, 'error': 'Invalid code.'}, status=422)

    if timezone.now() > otp.expires_at:
        return Response({'success': False, 'error': 'OTP expired.'}, status=422)
    if otp.attempts >= 3:
        return Response({'success': False, 'error': 'Too many attempts. Try again later.'}, status=429)
    if otp.code != code:
        otp.attempts += 1
        otp.save(update_fields=['attempts'])
        remaining = max(0, 3 - otp.attempts)
        return Response({'success': False, 'error': f'Invalid code. {remaining} attempts remaining.'}, status=422)

    otp.is_verified = True
    otp.save(update_fields=['is_verified'])

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Generic success to avoid enumeration
        return Response({'success': True, 'message': 'Password updated.'})

    user.password = make_password(new_password)
    user.save(update_fields=['password'])
    return Response({'success': True, 'message': 'Password updated.'})



