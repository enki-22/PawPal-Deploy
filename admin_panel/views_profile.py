"""
Admin Profile Management Views (Chunk 10)
Implements admin profile management endpoints
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
import logging

from .permissions import require_any_admin
from .profile_utils import (
    resize_profile_image,
    validate_image_file,
    generate_recovery_verification_token,
    verify_recovery_token,
    validate_contact_number,
    mask_contact_number
)
from .email_templates import get_recovery_email_verification_template
from .models import Admin

logger = logging.getLogger(__name__)


@api_view(['GET', 'PUT'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_any_admin
def get_admin_profile(request):
    """
    GET /api/admin/profile - Get profile
    PUT /api/admin/profile - Update profile
    
    Permissions: MASTER, VET, DESK (own profile only)
    """
    if request.method == 'GET':
        return _get_admin_profile(request)
    elif request.method == 'PUT':
        return _update_admin_profile(request)


def _get_admin_profile(request):
    """Internal handler for GET /api/admin/profile"""
    try:
        admin = request.admin
        
        # Mask contact number for privacy
        masked_contact = mask_contact_number(admin.contact_number) if admin.contact_number else None
        
        profile_data = {
            'admin_id': str(admin.id),
            'name': admin.name,
            'email': admin.email,
            'role': admin.get_role_display(),
            'profile_image': request.build_absolute_uri(admin.profile_image.url) if admin.profile_image else None,
            'clinic_info': admin.clinic_info,
            'contact_number': masked_contact,
            'recovery_email': admin.recovery_email,
            'recovery_email_verified': admin.recovery_email_verified,
            'password_updated_at': admin.password_updated_at.isoformat(),
            'created_at': admin.created_at.isoformat()
        }
        
        logger.info(f"Admin {admin.email} viewed own profile")
        
        return Response({
            'success': True,
            'admin': profile_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get admin profile error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch profile',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _update_admin_profile(request):
    """
    PUT /api/admin/profile
    
    Update admin profile information
    Permissions: MASTER, VET, DESK (own profile only)
    
    Input:
        - name: Admin name (optional)
        - clinic_info: Clinic information (optional)
        - contact_number: Contact number (optional)
    
    Cannot change: email, role
    
    Returns:
        success: True/False
        admin: Updated admin profile object
    """
    try:
        admin = request.admin
        updated_fields = []
        
        with transaction.atomic():
            # Update name
            if 'name' in request.data:
                new_name = request.data['name'].strip()
                if new_name and new_name != admin.name:
                    admin.name = new_name
                    updated_fields.append('name')
            
            # Update clinic_info
            if 'clinic_info' in request.data:
                new_clinic_info = request.data['clinic_info'].strip() if request.data['clinic_info'] else None
                if new_clinic_info != admin.clinic_info:
                    admin.clinic_info = new_clinic_info
                    updated_fields.append('clinic_info')
            
            # Update contact_number (with validation)
            if 'contact_number' in request.data:
                new_contact = request.data['contact_number'].strip() if request.data['contact_number'] else None
                
                # Validate contact number format
                if new_contact:
                    is_valid, error_message = validate_contact_number(new_contact)
                    if not is_valid:
                        return Response({
                            'success': False,
                            'error': error_message,
                            'field': 'contact_number'
                        }, status=status.HTTP_400_BAD_REQUEST)
                
                if new_contact != admin.contact_number:
                    admin.contact_number = new_contact
                    updated_fields.append('contact_number')
            
            # Save if any fields changed
            if updated_fields:
                admin.save()
                logger.info(
                    f"Admin {admin.email} updated profile "
                    f"(fields: {', '.join(updated_fields)})"
                )
            else:
                return Response({
                    'success': False,
                    'error': 'No valid fields to update'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Return updated profile
        masked_contact = mask_contact_number(admin.contact_number) if admin.contact_number else None
        
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'updated_fields': updated_fields,
            'admin': {
                'admin_id': str(admin.id),
                'name': admin.name,
                'email': admin.email,
                'role': admin.get_role_display(),
                'profile_image': request.build_absolute_uri(admin.profile_image.url) if admin.profile_image else None,
                'clinic_info': admin.clinic_info,
                'contact_number': masked_contact,
                'recovery_email': admin.recovery_email,
                'recovery_email_verified': admin.recovery_email_verified
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Update admin profile error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to update profile',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_any_admin
def update_admin_profile_photo(request):
    """
    PUT /api/admin/profile/photo
    
    Upload and update admin profile photo
    Permissions: MASTER, VET, DESK (own profile only)
    
    Input:
        - image: Image file (multipart/form-data)
    
    Validations:
        - JPG/PNG only
        - Max 2MB
        - Resize to 200x200px
    
    Returns:
        success: True/False
        profile_image: New image URL
    """
    try:
        admin = request.admin
        
        # Check if image file is provided
        if 'image' not in request.FILES:
            return Response({
                'success': False,
                'error': 'Image file is required',
                'field': 'image'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Validate image file
        is_valid, error_message = validate_image_file(image_file, max_size_mb=2)
        if not is_valid:
            return Response({
                'success': False,
                'error': error_message,
                'field': 'image'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            try:
                # Resize image
                resized_image = resize_profile_image(image_file, size=(200, 200))
                
                # Save to admin profile
                admin.profile_image = resized_image
                admin.save()
                
                logger.info(f"Admin {admin.email} updated profile photo")
                
                return Response({
                    'success': True,
                    'message': 'Profile photo updated successfully',
                    'profile_image': request.build_absolute_uri(admin.profile_image.url)
                }, status=status.HTTP_200_OK)
                
            except ValueError as e:
                return Response({
                    'success': False,
                    'error': str(e),
                    'field': 'image'
                }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Update profile photo error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to update profile photo',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_any_admin
def set_recovery_email(request):
    """
    POST /api/admin/recovery-email
    
    Set or update recovery email address
    Permissions: MASTER, VET, DESK (own profile only)
    
    Input:
        - recovery_email: Recovery email address
        - confirm_recovery_email: Confirmation of recovery email
    
    Validations:
        - recovery_email != primary email
        - Valid email format
        - Emails match
        - Send verification email
    
    Returns:
        success: True/False
        message: Success message
    """
    try:
        admin = request.admin
        
        recovery_email = request.data.get('recovery_email', '').strip().lower()
        confirm_recovery_email = request.data.get('confirm_recovery_email', '').strip().lower()
        
        # Validate input
        if not recovery_email:
            return Response({
                'success': False,
                'error': 'Recovery email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not confirm_recovery_email:
            return Response({
                'success': False,
                'error': 'Recovery email confirmation is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if emails match
        if recovery_email != confirm_recovery_email:
            return Response({
                'success': False,
                'error': 'Recovery email and confirmation do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if recovery email is different from primary email
        if recovery_email == admin.email.lower():
            return Response({
                'success': False,
                'error': 'Recovery email must be different from your primary email'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Basic email format validation
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, recovery_email):
            return Response({
                'success': False,
                'error': 'Invalid email format'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Update recovery email and mark as unverified
            admin.recovery_email = recovery_email
            admin.recovery_email_verified = False
            admin.save()
            
            # Generate verification token
            verification_token = generate_recovery_verification_token(admin.id, recovery_email)
            
            # Build verification URL
            verification_url = f"{settings.FRONTEND_URL or 'https://admin.pawpal.com'}/verify-recovery-email?token={verification_token}"
            
            # Send verification email
            subject, message = get_recovery_email_verification_template(
                admin_name=admin.name,
                verification_link=verification_url
            )
            
            email_sent = False
            try:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[recovery_email],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as email_error:
                logger.error(f"Failed to send recovery email verification: {str(email_error)}")
        
        logger.info(f"Admin {admin.email} set recovery email to {recovery_email}")
        
        return Response({
            'success': True,
            'message': 'Verification email sent to recovery email address',
            'email_sent': email_sent,
            'note': 'Please check your recovery email inbox and click the verification link'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Set recovery email error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to set recovery email',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def verify_recovery_email(request):
    """
    POST /api/admin/recovery-email/verify
    
    Verify recovery email using token from email link
    PUBLIC endpoint (no authentication required)
    
    Input:
        - token: Verification token from email
    
    Returns:
        success: True/False
        message: Success or error message
    """
    try:
        token = request.data.get('token', '').strip()
        
        if not token:
            return Response({
                'success': False,
                'error': 'Verification token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify token
        is_valid, data = verify_recovery_token(token)
        
        if not is_valid or not data:
            return Response({
                'success': False,
                'error': 'Invalid or expired verification token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        admin_id = data.get('admin_id')
        recovery_email = data.get('email')
        
        try:
            admin = Admin.objects.get(id=admin_id)
        except Admin.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Admin account not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verify the email matches
        if admin.recovery_email != recovery_email:
            return Response({
                'success': False,
                'error': 'Recovery email mismatch'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Mark recovery email as verified
            admin.recovery_email_verified = True
            admin.save()
        
        logger.info(f"Admin {admin.email} verified recovery email {recovery_email}")
        
        return Response({
            'success': True,
            'message': 'Recovery email verified successfully',
            'admin_email': admin.email
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Verify recovery email error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to verify recovery email',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

