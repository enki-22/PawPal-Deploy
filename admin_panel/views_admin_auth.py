"""
Admin authentication views
Implements secure authentication endpoints for admin panel
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
import logging
import random
import string
import sib_api_v3_sdk
import threading

from .models import Admin, AdminPasswordHistory
from .admin_auth_serializers import (
    AdminLoginSerializer,
    AdminInfoSerializer,
    VerifyTokenSerializer,
    ChangePasswordSerializer,
    RequestPasswordResetSerializer,
    AdminVerifyOTPSerializer,
    ResetPasswordSerializer
)
from .jwt_utils import (
    generate_admin_jwt,
    verify_admin_jwt,
    extract_token_from_header
)
from .permissions import require_any_admin
from users.models import OTP  # Reuse OTP model from users app

logger = logging.getLogger(__name__)


def send_via_brevo(to_email, to_name, subject, html_content):
    """Helper to send via Brevo API"""
    try:
        configuration = sib_api_v3_sdk.Configuration()
        configuration.api_key['api-key'] = settings.BREVO_API_KEY
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        sender = {"name": "PawPal Admin", "email": settings.DEFAULT_FROM_EMAIL}
        to = [{"email": to_email, "name": to_name}]
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=to, sender=sender, subject=subject, html_content=html_content)
        api_instance.send_transac_email(send_smtp_email)
    except Exception as e:
        print(f"Brevo API Error: {str(e)}")


@api_view(['POST'])
@permission_classes([AllowAny])  # CRITICAL: Login must be public
def admin_login(request):
    """
    POST /api/admin/login
    
    Admin login endpoint
    - Validates credentials against Admin model
    - Checks is_active = True
    - Generates JWT with role embedded (MASTER, VET, DESK)
    - Returns token and admin info
    
    Input:
        email: Admin email
        password: Admin password
    
    Returns:
        success: True/False
        message: Success or error message
        data:
            token: JWT token (8-hour expiration)
            admin_info: Admin profile information
            expires_in: Token expiration time
    """
    serializer = AdminLoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Login failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        admin = serializer.validated_data['admin']
        
        # Generate JWT token with role embedded
        token = generate_admin_jwt(admin)
        
        # Update last login
        admin.last_login = timezone.now()
        admin.save(update_fields=['last_login'])
        
        # Serialize admin info
        admin_info = AdminInfoSerializer(admin).data
        
        logger.info(f"Admin login successful: {admin.email} ({admin.role})")
        
        return Response({
            'success': True,
            'message': 'Login successful',
            'data': {
                'token': token,
                'admin_info': admin_info,
                'expires_in': '8 hours'
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Admin login error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Login failed',
            'error': 'An unexpected error occurred'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@require_any_admin
def admin_logout(request):
    """
    POST /api/admin/logout
    
    Admin logout endpoint
    - Invalidates JWT token (client-side should discard)
    - Clears session
    - Returns success message
    
    Note: JWT is stateless, so actual invalidation happens client-side
    In a production system, you might maintain a token blacklist
    
    Returns:
        success: True/False
        message: Success message
    """
    try:
        admin = request.admin
        
        logger.info(f"Admin logout: {admin.email} ({admin.role})")
        
        # In production, you might add token to blacklist here
        # For now, client will discard the token
        
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Admin logout error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Logout failed',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # CRITICAL: Token verification must be public
def admin_verify_token(request):
    """
    POST /api/admin/verify-token
    
    Verify JWT token and return admin info if valid
    
    Input:
        token: JWT token (in body or Authorization header)
    
    Returns:
        success: True/False
        valid: True/False
        admin_info: Admin information if token valid
        error: Error message if invalid
    """
    try:
        # Try to get token from header first, then from body
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = extract_token_from_header(auth_header)
        
        if not token:
            # Try to get from request body
            token = request.data.get('token')
        
        if not token:
            return Response({
                'success': False,
                'valid': False,
                'error': 'Token not provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify token
        payload, error = verify_admin_jwt(token)
        
        if error or not payload:
            return Response({
                'success': False,
                'valid': False,
                'error': error or 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get admin from database
        try:
            admin = Admin.objects.get(
                id=payload['admin_id'],
                is_active=True
            )
        except Admin.DoesNotExist:
            return Response({
                'success': False,
                'valid': False,
                'error': 'Admin not found or inactive'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Return admin info
        admin_info = AdminInfoSerializer(admin).data
        
        return Response({
            'success': True,
            'valid': True,
            'admin_info': admin_info
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'valid': False,
            'error': 'Token verification failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@require_any_admin
def admin_change_password(request):
    """
    POST /api/admin/change-password
    
    Change admin password
    - Validates current password
    - Checks new password meets requirements
    - Checks not in last 3 passwords
    - Hashes and saves
    - Invalidates all admin sessions (client should re-login)
    
    Input:
        current_password: Current password
        new_password: New password
        confirm_password: Password confirmation
    
    Returns:
        success: True/False
        message: Success or error message
    """
    serializer = ChangePasswordSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        admin = request.admin
        current_password = serializer.validated_data['current_password']
        new_password = serializer.validated_data['new_password']
        
        # Verify current password
        if not admin.check_password(current_password):
            return Response({
                'success': False,
                'message': 'Current password is incorrect',
                'code': 'INVALID_CURRENT_PASSWORD'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if new password is in last 3 passwords
        if AdminPasswordHistory.is_password_in_history(admin, new_password):
            return Response({
                'success': False,
                'message': 'Password was used recently. Please choose a different password.',
                'code': 'PASSWORD_REUSE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use transaction to ensure atomicity
        with transaction.atomic():
            # Add current password to history
            AdminPasswordHistory.add_password_to_history(admin, admin.password)
            
            # Set new password
            admin.set_password(new_password)
            admin.save()
            
            logger.info(f"Password changed for admin: {admin.email} ({admin.role})")
        
        return Response({
            'success': True,
            'message': 'Password changed successfully. Please login again with your new password.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Password change error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Password change failed',
            'error': 'An unexpected error occurred'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # CRITICAL: Password reset request must be public
def admin_request_password_reset(request):
    """
    POST /api/admin/request-password-reset
    
    Request password reset for admin
    Only for VET and DESK roles (NOT MASTER for security)
    - Generates OTP
    - Sends email
    - Returns generic success message (don't reveal if email exists)
    
    Input:
        email: Admin email
    
    Returns:
        success: True (always, for security)
        message: Generic success message
    """
    serializer = RequestPasswordResetSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid email',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    
    try:
        # Try to find admin
        try:
            admin = Admin.objects.get(email=email, is_active=True)
        except Admin.DoesNotExist:
            # Don't reveal if admin exists - return generic success
            logger.warning(f"Password reset requested for non-existent admin: {email}")
            return Response({
                'success': True,
                'message': 'If an account exists with this email, a password reset code will be sent.'
            }, status=status.HTTP_200_OK)
        
        # Check role - MASTER cannot reset password via this endpoint
        if admin.role == 'MASTER':
            logger.warning(f"MASTER admin attempted password reset: {email}")
            return Response({
                'success': False,
                'message': 'Master admins cannot reset password via this method. Please contact system administrator.',
                'code': 'MASTER_RESET_DENIED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Generate 6-digit OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        # Invalidate old OTPs for this email
        OTP.objects.filter(
            email=email,
            purpose='admin_password_reset'
        ).delete()
        
        # Create new OTP (expires in 10 minutes)
        otp = OTP.objects.create(
            email=email,
            code=otp_code,
            purpose='admin_password_reset',
            expires_at=timezone.now() + timedelta(minutes=10)
        )
        
        # Send email
        # Send email via Brevo
        email_content = f"""
        <html><body>
        <p>Hello {admin.name},</p>
        <p>You requested a password reset for your PawPal admin account.</p>
        <p>Your verification code is: <b>{otp_code}</b></p>
        <p>This code will expire in 10 minutes.</p>
        </body></html>
        """
        threading.Thread(target=send_via_brevo, args=(email, admin.name, 'PawPal Admin - Password Reset Code', email_content)).start()

        return Response({
            'success': True,
            'message': 'If an account exists with this email, a password reset code will be sent.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Password reset request error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Password reset request failed',
            'error': 'An unexpected error occurred'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_verify_otp_code(request):
    """
    POST /api/admin/verify-reset-otp
    
    Verify OTP code WITHOUT consuming it (for UI validation)
    - Validates OTP exists, not expired, attempts < 3
    - Does NOT mark as verified or consume
    - Returns success if valid
    
    Input:
        email: Admin email
        otp_code: 6-digit OTP code
    
    Returns:
        success: True/False
        message: Success or error message
        code: Error code if applicable
    """
    serializer = AdminVerifyOTPSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid input',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    otp_code = serializer.validated_data['otp_code']
    
    try:
        # Get latest unverified OTP for this email
        try:
            otp = OTP.objects.filter(
                email=email,
                purpose='admin_password_reset',
                is_verified=False
            ).latest('created_at')
        except OTP.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid OTP code',
                'code': 'INVALID_OTP'
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        # Check if already verified (this check is now redundant but kept for safety)
        if otp.is_verified:
            return Response({
                'success': True,
                'message': 'OTP already verified'
            }, status=status.HTTP_200_OK)
        
        # Check expiration
        if timezone.now() > otp.expires_at:
            return Response({
                'success': False,
                'message': 'OTP has expired. Please request a new code.',
                'code': 'OTP_EXPIRED'
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        # Check attempts
        if otp.attempts >= 3:
            return Response({
                'success': False,
                'message': 'Too many failed attempts. Please request a new code.',
                'code': 'MAX_ATTEMPTS_EXCEEDED'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Verify code (WITHOUT consuming)
        if otp.code != otp_code:
            # Increment attempts but don't consume
            otp.attempts += 1
            otp.save(update_fields=['attempts'])
            remaining = max(0, 3 - otp.attempts)
            return Response({
                'success': False,
                'message': f'Invalid code. {remaining} attempts remaining.',
                'code': 'INVALID_OTP'
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        # Code is valid - return success WITHOUT marking as verified
        logger.info(f"OTP verified (not consumed) for admin: {email}")
        
        return Response({
            'success': True,
            'message': 'OTP code verified successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"OTP verification error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'OTP verification failed',
            'error': 'An unexpected error occurred'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def admin_reset_password_confirm(request):
    """
    POST /api/admin/reset-password-confirm
    
    Reset admin password with OTP (consumes OTP)
    - Validates OTP
    - Resets password
    - Adds to password history
    - Marks OTP as verified/consumed
    
    Input:
        email: Admin email
        otp_code: 6-digit OTP code
        new_password: New password
        confirm_password: Password confirmation
    
    Returns:
        success: True/False
        message: Success or error message
    """
    serializer = ResetPasswordSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Validation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    otp_code = serializer.validated_data['otp_code']
    new_password = serializer.validated_data['new_password']
    
    try:
        # Get admin first
        try:
            admin = Admin.objects.get(email=email, is_active=True)
        except Admin.DoesNotExist:
            # Generic error to avoid user enumeration
            return Response({
                'success': False,
                'message': 'Invalid credentials',
                'code': 'INVALID_CREDENTIALS'
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        # Get latest unverified OTP
        try:
            otp = OTP.objects.filter(
                email=email,
                purpose='admin_password_reset',
                is_verified=False
            ).latest('created_at')
        except OTP.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Invalid OTP code',
                'code': 'INVALID_OTP'
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        # Check expiration
        if timezone.now() > otp.expires_at:
            return Response({
                'success': False,
                'message': 'OTP has expired',
                'code': 'OTP_EXPIRED'
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        # Check attempts
        if otp.attempts >= 3:
            return Response({
                'success': False,
                'message': 'Too many failed attempts. Please request a new code.',
                'code': 'MAX_ATTEMPTS_EXCEEDED'
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Verify code
        if otp.code != otp_code:
            otp.attempts += 1
            otp.save(update_fields=['attempts'])
            remaining = max(0, 3 - otp.attempts)
            return Response({
                'success': False,
                'message': f'Invalid code. {remaining} attempts remaining.',
                'code': 'INVALID_OTP'
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        
        # Check if new password is in history
        if AdminPasswordHistory.is_password_in_history(admin, new_password):
            return Response({
                'success': False,
                'message': 'Password was used recently. Please choose a different password.',
                'code': 'PASSWORD_REUSE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Use transaction to ensure atomicity
        with transaction.atomic():
            # Add current password to history
            AdminPasswordHistory.add_password_to_history(admin, admin.password)
            
            # Mark OTP as verified
            otp.is_verified = True
            otp.save(update_fields=['is_verified'])
            
            # Set new password
            admin.set_password(new_password)
            admin.save()
            
            logger.info(f"Password reset successfully for admin: {email} ({admin.role})")
        
        return Response({
            'success': True,
            'message': 'Password reset successfully. Please log in with your new password.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'message': 'Password reset failed',
            'error': 'An unexpected error occurred'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
