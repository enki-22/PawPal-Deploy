"""
Announcement Management Views (Chunk 9)
Implements 5 announcement management endpoints
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from datetime import date
import logging

from .permissions import require_any_admin
from .models import Announcement, Admin

logger = logging.getLogger(__name__)


def validate_announcement_data(data, is_update=False):
    """
    Validate announcement input data
    
    Args:
        data: Dictionary of announcement data
        is_update: Whether this is an update operation
    
    Returns:
        tuple: (is_valid, error_message, validated_data)
    """
    validated = {}
    errors = []
    
    # Title validation
    if 'title' in data or not is_update:
        title = data.get('title', '').strip() if 'title' in data else ''
        if not title and not is_update:
            errors.append('Title is required')
        elif len(title) > 100:
            errors.append('Title must be 100 characters or less')
        else:
            validated['title'] = title
    
    # Description validation
    if 'description' in data or not is_update:
        description = data.get('description', '').strip() if 'description' in data else ''
        if not description and not is_update:
            errors.append('Description is required')
        elif len(description) > 500:
            errors.append('Description must be 500 characters or less')
        else:
            validated['description'] = description
    
    # Valid until validation
    if 'valid_until' in data:
        valid_until_str = data.get('valid_until')
        if valid_until_str:
            try:
                from datetime import datetime
                valid_until = datetime.strptime(valid_until_str, '%Y-%m-%d').date()
                
                # Must be future date
                if valid_until < date.today():
                    errors.append('valid_until must be a future date')
                else:
                    validated['valid_until'] = valid_until
            except ValueError:
                errors.append('Invalid date format. Use YYYY-MM-DD')
        else:
            validated['valid_until'] = None  # Ongoing
    
    # Icon type validation
    if 'icon_type' in data or not is_update:
        icon_type = data.get('icon_type', 'general')
        valid_icons = [choice[0] for choice in Announcement.ICON_CHOICES]
        if icon_type not in valid_icons:
            errors.append(f'Invalid icon_type. Must be one of: {", ".join(valid_icons)}')
        else:
            validated['icon_type'] = icon_type
    
    if errors:
        return False, '; '.join(errors), None
    
    return True, None, validated


@api_view(['GET', 'POST'])
@require_any_admin
def manage_announcements(request):
    """
    GET /api/admin/announcements - List all announcements
    POST /api/admin/announcements - Create announcement
    
    Permissions: MASTER, VET, DESK
    """
    if request.method == 'GET':
        return _get_announcements(request)
    elif request.method == 'POST':
        return _create_announcement(request)


def _get_announcements(request):
    """Internal handler for GET /api/admin/announcements"""
    try:
        # Get all announcements (active + expired)
        announcements = Announcement.objects.select_related('created_by').all()
        
        # Format announcements
        results = []
        for announcement in announcements:
            results.append({
                'announcement_id': str(announcement.id),
                'title': announcement.title,
                'description': announcement.description,
                'valid_until': announcement.valid_until.isoformat() if announcement.valid_until else None,
                'icon_type': announcement.icon_type,
                'is_active': announcement.is_active,
                'is_expired': announcement.is_expired,
                'created_at': announcement.created_at.isoformat(),
                'created_by': announcement.created_by.name if announcement.created_by else None
            })
        
        logger.info(f"Admin {request.admin.email} viewed announcements")
        
        return Response({
            'success': True,
            'announcements': results,
            'total_count': len(results)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get announcements error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch announcements',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _create_announcement(request):
    """Internal handler for POST /api/admin/announcements"""
    try:
        # Validate input data
        is_valid, error_message, validated_data = validate_announcement_data(request.data, is_update=False)
        
        if not is_valid:
            return Response({
                'success': False,
                'error': 'Validation failed',
                'details': error_message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            # Create announcement
            announcement = Announcement.objects.create(
                title=validated_data['title'],
                description=validated_data['description'],
                valid_until=validated_data.get('valid_until'),
                icon_type=validated_data.get('icon_type', 'general'),
                is_active=True,
                created_by=request.admin
            )
        
        logger.info(f"Admin {request.admin.email} created announcement: {announcement.title}")
        
        return Response({
            'success': True,
            'message': 'Announcement created successfully',
            'announcement': {
                'announcement_id': str(announcement.id),
                'title': announcement.title,
                'description': announcement.description,
                'valid_until': announcement.valid_until.isoformat() if announcement.valid_until else None,
                'icon_type': announcement.icon_type,
                'is_active': announcement.is_active,
                'is_expired': announcement.is_expired,
                'created_at': announcement.created_at.isoformat()
            }
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Create announcement error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to create announcement',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'DELETE'])
@require_any_admin
def manage_announcement_detail(request, announcement_id):
    """
    GET /api/admin/announcements/:id - Get announcement
    PUT /api/admin/announcements/:id - Update announcement
    DELETE /api/admin/announcements/:id - Delete announcement
    
    Permissions: MASTER, VET, DESK
    """
    if request.method == 'GET':
        return _get_announcement_detail(request, announcement_id)
    elif request.method == 'PUT':
        return _update_announcement(request, announcement_id)
    elif request.method == 'DELETE':
        return _delete_announcement(request, announcement_id)


def _get_announcement_detail(request, announcement_id):
    """Internal handler for GET /api/admin/announcements/:id"""
    try:
        try:
            announcement = Announcement.objects.select_related('created_by').get(id=announcement_id)
        except Announcement.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Announcement not found',
                'announcement_id': announcement_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'announcement': {
                'announcement_id': str(announcement.id),
                'title': announcement.title,
                'description': announcement.description,
                'valid_until': announcement.valid_until.isoformat() if announcement.valid_until else None,
                'icon_type': announcement.icon_type,
                'is_active': announcement.is_active,
                'is_expired': announcement.is_expired,
                'created_at': announcement.created_at.isoformat(),
                'updated_at': announcement.updated_at.isoformat(),
                'created_by': announcement.created_by.name if announcement.created_by else None
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get announcement detail error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch announcement',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _update_announcement(request, announcement_id):
    """Internal handler for PUT /api/admin/announcements/:id"""
    try:
        try:
            announcement = Announcement.objects.get(id=announcement_id)
        except Announcement.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Announcement not found',
                'announcement_id': announcement_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate input data
        is_valid, error_message, validated_data = validate_announcement_data(request.data, is_update=True)
        
        if not is_valid:
            return Response({
                'success': False,
                'error': 'Validation failed',
                'details': error_message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            updated_fields = []
            
            # Update fields
            if 'title' in validated_data:
                announcement.title = validated_data['title']
                updated_fields.append('title')
            
            if 'description' in validated_data:
                announcement.description = validated_data['description']
                updated_fields.append('description')
            
            if 'valid_until' in validated_data:
                announcement.valid_until = validated_data['valid_until']
                updated_fields.append('valid_until')
            
            if 'icon_type' in validated_data:
                announcement.icon_type = validated_data['icon_type']
                updated_fields.append('icon_type')
            
            if updated_fields:
                announcement.save()
            else:
                return Response({
                    'success': False,
                    'error': 'No valid fields to update'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(
            f"Admin {request.admin.email} updated announcement {announcement_id} "
            f"(fields: {', '.join(updated_fields)})"
        )
        
        return Response({
            'success': True,
            'message': 'Announcement updated successfully',
            'updated_fields': updated_fields,
            'announcement': {
                'announcement_id': str(announcement.id),
                'title': announcement.title,
                'description': announcement.description,
                'valid_until': announcement.valid_until.isoformat() if announcement.valid_until else None,
                'icon_type': announcement.icon_type,
                'is_active': announcement.is_active,
                'is_expired': announcement.is_expired,
                'updated_at': announcement.updated_at.isoformat()
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Update announcement error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to update announcement',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _delete_announcement(request, announcement_id):
    """Internal handler for DELETE /api/admin/announcements/:id"""
    try:
        try:
            announcement = Announcement.objects.get(id=announcement_id)
        except Announcement.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Announcement not found',
                'announcement_id': announcement_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        announcement_title = announcement.title
        
        with transaction.atomic():
            # Hard delete
            announcement.delete()
        
        logger.info(f"Admin {request.admin.email} deleted announcement: {announcement_title}")
        
        return Response({
            'success': True,
            'message': 'Announcement deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Delete announcement error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to delete announcement',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def get_active_announcements(request):
    """
    GET /api/announcements/active
    
    Get only active, non-expired announcements
    PUBLIC endpoint (no authentication required)
    
    Returns:
        success: True/False
        announcements: Array of active announcements
    """
    try:
        today = date.today()
        
        # Filter: is_active=True AND (valid_until IS NULL OR valid_until >= today)
        announcements = Announcement.objects.filter(
            is_active=True
        ).filter(
            # Either no expiration date (ongoing) or expiration is in future
            Q(valid_until__isnull=True) | Q(valid_until__gte=today)
        ).order_by('-created_at')
        
        # Format announcements
        results = []
        for announcement in announcements:
            results.append({
                'announcement_id': str(announcement.id),
                'title': announcement.title,
                'description': announcement.description,
                'valid_until': announcement.valid_until.isoformat() if announcement.valid_until else None,
                'icon_type': announcement.icon_type,
                'created_at': announcement.created_at.isoformat()
            })
        
        logger.info(f"Public request for active announcements (found {len(results)})")
        
        return Response({
            'success': True,
            'announcements': results,
            'total_count': len(results)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get active announcements error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch announcements',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

