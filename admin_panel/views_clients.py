"""
Admin Client Management Views (Chunk 6)
Implements 6 comprehensive client management endpoints
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from django.db import transaction
import logging

from .permissions import require_any_admin, require_admin_role
from .client_filters import filter_clients, validate_client_filter_params
from .email_templates import (
    get_verification_email_template,
    get_deactivation_email_template,
    get_custom_email_template
)
from chatbot.models import User
from pets.models import Pet

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_any_admin
def get_clients(request):
    """
    GET /api/admin/clients
    
    Get paginated list of clients with search and filtering
    Permissions: MASTER, VET, DESK
    
    Query Parameters:
        - search: Search in name, email
        - dateRange: today | last_7_days | last_30_days | custom | all_time
        - custom_start: Start date for custom range (YYYY-MM-DD)
        - custom_end: End date for custom range (YYYY-MM-DD)
        - status: all | active | inactive | pending_verification
        - page: Page number (default: 1)
        - limit: Items per page (default: 10, max: 100)
    
    Returns:
        success: True/False
        results: Array of client summaries
        pagination: Pagination information
        filters: Applied filters
    """
    try:
        # Get query parameters
        params = {
            'search': request.query_params.get('search', ''),
            'dateRange': request.query_params.get('dateRange', 'all_time'),
            'custom_start': request.query_params.get('custom_start'),
            'custom_end': request.query_params.get('custom_end'),
            'status': request.query_params.get('status', 'all'),
            'page': request.query_params.get('page', 1),
            'limit': request.query_params.get('limit', 10)
        }
        
        # Validate parameters
        is_valid, error_message = validate_client_filter_params(params)
        if not is_valid:
            return Response({
                'success': False,
                'error': 'Invalid filter parameters',
                'details': error_message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get base queryset - exclude vet admins, only show pet owners
        # Vet admins are managed separately in admin roles page
        # Use 'profile' as related_name (not 'userprofile')
        queryset = User.objects.select_related('profile').filter(
            profile__is_vet_admin=False
        )
        
        # Apply filters and pagination
        filtered_queryset, pagination_info, applied_filters = filter_clients(
            queryset,
            params
        )
        
        # Format results
        results = []
        for user in filtered_queryset:
            # Determine status
            if not user.is_active:
                user_status = "Inactive"
            elif hasattr(user, 'profile') and not user.profile.is_verified:
                user_status = "Pending Verification"
            else:
                user_status = "Active"
            
            results.append({
                'id': user.id,
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'email': user.email,
                'pet_count': user.pet_count if hasattr(user, 'pet_count') else 0,
                'status': user_status,
                'date_created': user.date_joined.isoformat()
            })
        
        logger.info(
            f"Admin {request.admin.email} queried clients "
            f"(page {pagination_info['page']}, filters: {applied_filters})"
        )
        
        return Response({
            'success': True,
            'results': results,
            'pagination': pagination_info,
            'filters': applied_filters
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get clients error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch clients',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_any_admin
def get_client_detail(request, user_id):
    """
    GET /api/admin/clients/:userId
    
    Get detailed client information including registered pets
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        user_id: User ID
    
    Returns:
        success: True/False
        client: Complete client object with:
            - user_id, name, email, contact info
            - address, city_province
            - status, profile_image
            - date_joined
            - pets: Array of registered pets
    """
    try:
        # Get user with related data
        try:
            user = User.objects.select_related('userprofile').get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Client not found',
                'user_id': user_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get user profile (if exists)
        profile = getattr(user, 'userprofile', None)
        
        # Determine status
        if not user.is_active:
            user_status = "Inactive"
        elif profile and not profile.is_verified:
            user_status = "Pending Verification"
        else:
            user_status = "Active"
        
        # Get user's pets
        pets = Pet.objects.filter(owner=user)
        pets_data = []
        for pet in pets:
            photo_url = None
            if getattr(pet, 'image', None) and hasattr(pet.image, 'url'):
                try:
                    photo_url = request.build_absolute_uri(pet.image.url)
                except Exception:
                    photo_url = None
            species = ''
            if hasattr(pet, 'get_animal_type_display'):
                try:
                    species = pet.get_animal_type_display()
                except Exception:
                    species = ''
            pets_data.append({
                'pet_id': pet.id,
                'name': pet.name,
                'species': species,
                'breed': pet.breed or 'Unknown',
                'photo': photo_url
            })
        
        # Build client data
        client_data = {
            'id': user.id,
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'email': user.email,
            'contact_number': profile.contact_number if profile and hasattr(profile, 'contact_number') else None,
            'city_province': profile.city_province if profile and hasattr(profile, 'city_province') else None,
            'address': profile.address if profile and hasattr(profile, 'address') else None,
            'status': user_status,
            'profile_image': None,  # Add if UserProfile has profile_image field
            'date_joined': user.date_joined.isoformat(),
            'pets': pets_data
        }
        
        logger.info(f"Admin {request.admin.email} viewed client {user_id}")
        
        return Response({
            'success': True,
            'client': client_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get client detail error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch client details',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_admin_role(['MASTER', 'VET'])  # NOT DESK
def update_client(request, user_id):
    """
    PUT /api/admin/clients/:userId
    
    Update client information
    Permissions: MASTER, VET only (NOT DESK)
    
    URL Parameters:
        user_id: User ID
    
    Input:
        - name: Full name (optional)
        - email: Email address (optional)
        - contact_number: Contact number (optional)
        - address: Address (optional)
        - city_province: City and province (optional)
    
    Returns:
        success: True/False
        message: Success message
        client: Updated client object
    """
    try:
        # Get user
        try:
            user = User.objects.select_related('userprofile').get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Client not found',
                'user_id': user_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create user profile
        profile = getattr(user, 'userprofile', None)
        
        updated_fields = []
        
        with transaction.atomic():
            # Update name (split into first_name and last_name)
            if 'name' in request.data:
                name = request.data['name'].strip()
                name_parts = name.split(maxsplit=1)
                user.first_name = name_parts[0] if len(name_parts) > 0 else ''
                user.last_name = name_parts[1] if len(name_parts) > 1 else ''
                updated_fields.append('name')
            
            # Update email (validate uniqueness)
            if 'email' in request.data:
                new_email = request.data['email'].strip().lower()
                if new_email != user.email:
                    # Check if email is already taken
                    if User.objects.filter(email=new_email).exclude(id=user_id).exists():
                        return Response({
                            'success': False,
                            'error': 'Email already exists',
                            'code': 'EMAIL_EXISTS'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    user.email = new_email
                    updated_fields.append('email')
            
            # Save user
            if updated_fields:
                user.save()
            
            # Update profile fields
            if profile:
                if 'contact_number' in request.data:
                    profile.contact_number = request.data['contact_number']
                    updated_fields.append('contact_number')
                
                if 'address' in request.data:
                    profile.address = request.data['address']
                    updated_fields.append('address')
                
                if 'city_province' in request.data:
                    profile.city_province = request.data['city_province']
                    updated_fields.append('city_province')
                
                if len(updated_fields) > (1 if 'name' in updated_fields or 'email' in updated_fields else 0):
                    profile.save()
        
        logger.info(
            f"Admin {request.admin.email} updated client {user_id} "
            f"(fields: {', '.join(updated_fields)})"
        )
        
        # Return updated client data
        client_data = {
            'user_id': user.id,
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'email': user.email,
            'contact_number': profile.contact_number if profile and hasattr(profile, 'contact_number') else None,
            'address': profile.address if profile and hasattr(profile, 'address') else None,
            'city_province': profile.city_province if profile and hasattr(profile, 'city_province') else None
        }
        
        return Response({
            'success': True,
            'message': 'Client information updated successfully',
            'updated_fields': updated_fields,
            'client': client_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Update client error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to update client',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_admin_role(['MASTER', 'VET'])  # NOT DESK
def verify_client(request, user_id):
    """
    POST /api/admin/clients/:userId/verify
    
    Verify client account
    Permissions: MASTER, VET only
    
    URL Parameters:
        user_id: User ID
    
    Returns:
        success: True/False
        message: Success message
    """
    try:
        # Get user
        try:
            user = User.objects.select_related('userprofile').get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Client not found',
                'user_id': user_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create user profile
        profile = getattr(user, 'userprofile', None)
        if not profile:
            return Response({
                'success': False,
                'error': 'User profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if already verified
        if profile.is_verified:
            return Response({
                'success': False,
                'message': 'Client is already verified'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set is_verified = True
        profile.is_verified = True
        profile.save()
        
        # Send verification confirmation email
        user_name = f"{user.first_name} {user.last_name}".strip() or user.username
        admin_name = request.admin.name
        
        subject, message = get_verification_email_template(user_name, admin_name)
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            email_sent = True
        except Exception as email_error:
            logger.error(f"Failed to send verification email: {str(email_error)}")
            email_sent = False
        
        logger.info(f"Admin {request.admin.email} verified client {user_id}")
        
        return Response({
            'success': True,
            'message': 'Client account verified successfully',
            'email_sent': email_sent
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Verify client error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to verify client',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_admin_role(['MASTER', 'VET'])  # NOT DESK
def deactivate_client(request, user_id):
    """
    POST /api/admin/clients/:userId/deactivate
    
    Deactivate client account
    Permissions: MASTER, VET only
    
    URL Parameters:
        user_id: User ID
    
    Input (optional):
        - reason: Reason for deactivation
    
    Returns:
        success: True/False
        message: Success message
    """
    try:
        # Get user
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Client not found',
                'user_id': user_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check if already inactive
        if not user.is_active:
            return Response({
                'success': False,
                'message': 'Client is already deactivated'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set is_active = False
        user.is_active = False
        user.save()
        
        # Send deactivation email
        user_name = f"{user.first_name} {user.last_name}".strip() or user.username
        reason = request.data.get('reason')
        
        subject, message = get_deactivation_email_template(user_name, reason)
        
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            email_sent = True
        except Exception as email_error:
            logger.error(f"Failed to send deactivation email: {str(email_error)}")
            email_sent = False
        
        logger.info(
            f"Admin {request.admin.email} deactivated client {user_id} "
            f"(reason: {reason if reason else 'Not specified'})"
        )
        
        return Response({
            'success': True,
            'message': 'Client account deactivated successfully',
            'email_sent': email_sent
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Deactivate client error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to deactivate client',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_any_admin  # ALL roles can send email
def send_client_email(request, user_id):
    """
    POST /api/admin/clients/:userId/email
    
    Send custom email to client
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        user_id: User ID
    
    Input:
        - subject: Email subject (required)
        - message: Email message body (required)
    
    Returns:
        success: True/False
        message: Success message
    """
    try:
        # Validate input
        subject = request.data.get('subject', '').strip()
        message_body = request.data.get('message', '').strip()
        
        if not subject:
            return Response({
                'success': False,
                'error': 'Email subject is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not message_body:
            return Response({
                'success': False,
                'error': 'Email message is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Client not found',
                'user_id': user_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Format email
        recipient_name = f"{user.first_name} {user.last_name}".strip() or user.username
        formatted_subject, formatted_message = get_custom_email_template(
            subject,
            message_body,
            recipient_name
        )
        
        # Send email
        try:
            send_mail(
                subject=formatted_subject,
                message=formatted_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            logger.info(
                f"Admin {request.admin.email} sent email to client {user_id} "
                f"(subject: {subject})"
            )
            
            return Response({
                'success': True,
                'message': 'Email sent successfully',
                'recipient': user.email
            }, status=status.HTTP_200_OK)
            
        except Exception as email_error:
            logger.error(f"Failed to send email: {str(email_error)}")
            return Response({
                'success': False,
                'error': 'Failed to send email',
                'details': str(email_error)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Send client email error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to send email',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

