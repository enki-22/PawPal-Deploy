"""
Admin Role Management Views (Chunk 8)
Implements 6 comprehensive admin account management endpoints (MASTER ONLY)
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.core.mail import send_mail
from django.conf import settings
import logging
import threading

from .permissions import require_admin_role
from .admin_role_filters import filter_admins, validate_admin_filter_params
from .admin_utils import (
    generate_admin_password,
    validate_admin_role,
    can_modify_admin_role,
    check_master_admin_count
)
from .email_templates import (
    get_admin_welcome_email_template,
    get_admin_update_notification_template
)
from .models import Admin, AdminAuditLog

logger = logging.getLogger(__name__)


def log_admin_action(admin, action, target_admin_id, target_admin_email=None, details=None):
    """
    Log admin action to audit log
    
    Args:
        admin: Admin who performed the action
        action: Action type (CREATE, UPDATE, DELETE, etc.)
        target_admin_id: ID of admin account acted upon
        target_admin_email: Email of admin account acted upon
        details: Additional details (dict)
    """
    try:
        AdminAuditLog.objects.create(
            admin=admin,
            action=action,
            target_admin_id=str(target_admin_id),
            target_admin_email=target_admin_email,
            details=details or {}
        )
        logger.info(
            f"Admin {admin.email} performed {action} on admin {target_admin_email or target_admin_id}"
        )
    except Exception as e:
        logger.error(f"Failed to log admin action: {str(e)}", exc_info=True)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_admin_role(['MASTER'])
def get_admin_roles(request):
    """
    GET /api/admin/roles - List admins
    POST /api/admin/roles - Create admin
    
    Permissions: MASTER ONLY
    """
    if request.method == 'GET':
        return _get_admin_roles_list(request)
    elif request.method == 'POST':
        return _create_admin_role(request)


def _get_admin_roles_list(request):
    """Internal handler for GET /api/admin/roles"""
    try:
        # Get query parameters
        params = {
            'search': request.query_params.get('search', ''),
            'role': request.query_params.get('role', 'all'),
            'status': request.query_params.get('status', 'all'),
            'page': request.query_params.get('page', 1),
            'limit': request.query_params.get('limit', 1000)
        }
        
        # Validate parameters
        is_valid, error_message = validate_admin_filter_params(params)
        if not is_valid:
            return Response({
                'success': False,
                'error': 'Invalid filter parameters',
                'details': error_message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get base queryset (exclude soft-deleted)
        queryset = Admin.objects.filter(is_deleted=False).all()
        
        # Apply filters and pagination
        filtered_queryset, pagination_info, applied_filters = filter_admins(
            queryset,
            params
        )
        
        # Format results
        results = []
        for admin in filtered_queryset:
            results.append({
                'admin_id': str(admin.id),
                'name': admin.name,
                'email': admin.email,
                'role': admin.get_role_display(),
                'status': 'Active' if admin.is_active else 'Inactive',
                'profile_image': request.build_absolute_uri(admin.profile_image.url) if admin.profile_image else None,
                'date_created': admin.created_at.isoformat()
            })
        
        logger.info(
            f"Master Admin {request.admin.email} queried admin roles "
            f"(page {pagination_info['page']}, filters: {applied_filters})"
        )
        
        return Response({
            'success': True,
            'results': results,
            'pagination': pagination_info,
            'filters': applied_filters
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get admin roles error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch admin roles',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _create_admin_role(request):
    """
    POST /api/admin/roles
    Create new admin account.
    Uses threading to prevent email timeouts from crashing the response.
    """
    try:
        # --- Validation Block (Keep as is) ---
        name = request.data.get('name', '').strip()
        email = request.data.get('email', '').strip().lower()
        role = request.data.get('role', '').strip().upper()
        
        if not name or not email or not role:
            return Response({'success': False, 'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        is_valid, error_message = validate_admin_role(role)
        if not is_valid:
            return Response({'success': False, 'error': error_message}, status=status.HTTP_400_BAD_REQUEST)
            
        if role == 'MASTER':
            return Response({'success': False, 'error': 'Cannot create MASTER admin via API.'}, status=status.HTTP_403_FORBIDDEN)
            
        if Admin.objects.filter(email=email, is_deleted=False).exists():
            return Response({'success': False, 'error': 'Email already exists', 'code': 'EMAIL_EXISTS'}, status=status.HTTP_400_BAD_REQUEST)
        
        generated_password = generate_admin_password()
        
        # --- Transaction Block ---
        with transaction.atomic():
            admin = Admin.objects.create(
                name=name,
                email=email,
                role=role,
                is_active=True,
                is_deleted=False
            )
            admin.set_password(generated_password)
            admin.save()
            
            log_admin_action(
                admin=request.admin,
                action='CREATE',
                target_admin_id=admin.id,
                target_admin_email=admin.email,
                details={'role': role, 'name': name}
            )

        # --- BACKGROUND EMAIL SENDING ---
        # We define a small internal function to run in a separate thread
        def send_email_thread():
            try:
                subject, message = get_admin_welcome_email_template(
                    admin_name=name,
                    email=email,
                    temp_password=generated_password
                )
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
                logger.info(f"Email successfully sent to {email}")
            except Exception as e:
                logger.error(f"Background email failed for {email}: {str(e)}")

        # Start the thread. The code below this line runs INSTANTLY without waiting.
        email_thread = threading.Thread(target=send_email_thread)
        email_thread.start()
        
        # Return success immediately
        return Response({
            'success': True,
            'message': 'Admin account created successfully',
            'admin': {
                'admin_id': str(admin.id),
                'name': admin.name,
                'email': admin.email,
                'role': admin.get_role_display(),
                'status': 'Active',
                'date_created': admin.created_at.isoformat()
            },
            'generated_password': generated_password,
            'email_sent': True, # We assume True since it's processing in background
            'note': 'Please securely share the generated password. Email is being sent in the background.'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Create admin role error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to create admin account',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_admin_role(['MASTER'])
def get_admin_role_detail(request, admin_id):
    """
    GET /api/admin/roles/:adminId - Get admin details
    PUT /api/admin/roles/:adminId - Update admin
    DELETE /api/admin/roles/:adminId - Soft delete admin
    
    Permissions: MASTER ONLY
    """
    if request.method == 'GET':
        return _get_admin_detail(request, admin_id)
    elif request.method == 'PUT':
        return _update_admin_role(request, admin_id)
    elif request.method == 'DELETE':
        return _delete_admin_role(request, admin_id)


def _get_admin_detail(request, admin_id):
    """Internal handler for GET /api/admin/roles/:adminId"""
    try:
        # Get admin
        try:
            admin = Admin.objects.get(id=admin_id, is_deleted=False)
        except Admin.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Admin not found',
                'admin_id': admin_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        admin_data = {
            'admin_id': str(admin.id),
            'name': admin.name,
            'email': admin.email,
            'role': admin.get_role_display(),
            'status': 'Active' if admin.is_active else 'Inactive',
            'profile_image': request.build_absolute_uri(admin.profile_image.url) if admin.profile_image else None,
            'contact_number': admin.contact_number,
            'recovery_email': admin.recovery_email,
            'clinic_info': admin.clinic_info,
            'created_at': admin.created_at.isoformat(),
            'last_login': admin.last_login.isoformat() if admin.last_login else None,
            'password_updated_at': admin.password_updated_at.isoformat()
        }
        
        logger.info(f"Master Admin {request.admin.email} viewed admin {admin_id}")
        
        return Response({
            'success': True,
            'admin': admin_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get admin role detail error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch admin details',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _update_admin_role(request, admin_id):
    """
    PUT /api/admin/roles/:adminId
    
    Update admin account information
    Permissions: MASTER ONLY
    
    URL Parameters:
        admin_id: Admin ID
    
    Input:
        - name: Admin name (optional)
        - email: Admin email (optional)
        - role: VET or DESK (optional, cannot change MASTER)
        - status: active | inactive (optional)
    
    Returns:
        success: True/False
        admin: Updated admin object
    """
    try:
        # Get admin
        try:
            admin = Admin.objects.get(id=admin_id, is_deleted=False)
        except Admin.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Admin not found',
                'admin_id': admin_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Cannot modify MASTER role
        can_modify, error_message = can_modify_admin_role(admin.role)
        if not can_modify:
            return Response({
                'success': False,
                'error': error_message
            }, status=status.HTTP_403_FORBIDDEN)
        
        updated_fields = []
        old_email = admin.email
        old_role = admin.role
        email_changed = False
        
        with transaction.atomic():
            # Update name
            if 'name' in request.data:
                new_name = request.data['name'].strip()
                if new_name and new_name != admin.name:
                    admin.name = new_name
                    updated_fields.append('name')
            
            # Update email (validate uniqueness)
            if 'email' in request.data:
                new_email = request.data['email'].strip().lower()
                if new_email and new_email != admin.email:
                    # Check uniqueness
                    if Admin.objects.filter(email=new_email, is_deleted=False).exclude(id=admin.id).exists():
                        return Response({
                            'success': False,
                            'error': 'Email already exists',
                            'code': 'EMAIL_EXISTS'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    old_email = admin.email
                    admin.email = new_email
                    updated_fields.append('email')
                    email_changed = True
            
            # Update role (cannot change to/from MASTER, cannot change own role)
            if 'role' in request.data:
                # Prevent Master Admin from changing their own role
                if admin.id == request.admin.id:
                    return Response({
                        'success': False,
                        'error': 'Cannot modify your own role',
                        'code': 'CANNOT_MODIFY_OWN_ROLE'
                    }, status=status.HTTP_403_FORBIDDEN)
                
                new_role = request.data['role'].strip().upper()
                can_modify, error_message = can_modify_admin_role(admin.role, new_role)
                if not can_modify:
                    return Response({
                        'success': False,
                        'error': error_message
                    }, status=status.HTTP_403_FORBIDDEN)
                
                is_valid, error_message = validate_admin_role(new_role)
                if not is_valid:
                    return Response({
                        'success': False,
                        'error': error_message
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                if new_role != admin.role:
                    old_role = admin.role
                    admin.role = new_role
                    updated_fields.append('role')
            
            # Update status (cannot deactivate own account)
            if 'status' in request.data:
                # Prevent Master Admin from deactivating themselves
                if admin.id == request.admin.id:
                    return Response({
                        'success': False,
                        'error': 'Cannot deactivate your own account',
                        'code': 'CANNOT_DEACTIVATE_OWN_ACCOUNT'
                    }, status=status.HTTP_403_FORBIDDEN)
                
                new_status = request.data['status'].lower()
                if new_status in ['active', 'inactive']:
                    new_is_active = new_status == 'active'
                    if new_is_active != admin.is_active:
                        admin.is_active = new_is_active
                        updated_fields.append('status')
            
            # Save if any fields changed
            if updated_fields:
                admin.save()
                
                # Determine action type for logging
                if 'role' in updated_fields:
                    action = 'ROLE_CHANGE'
                elif 'email' in updated_fields:
                    action = 'EMAIL_CHANGE'
                elif 'status' in updated_fields:
                    action = 'STATUS_CHANGE'
                else:
                    action = 'UPDATE'
                
                # Log action
                log_admin_action(
                    admin=request.admin,
                    action=action,
                    target_admin_id=admin.id,
                    target_admin_email=admin.email,
                    details={
                        'updated_fields': updated_fields,
                        'old_email': old_email if email_changed else None,
                        'new_email': admin.email if email_changed else None,
                        'old_role': old_role if 'role' in updated_fields else None,
                        'new_role': admin.role if 'role' in updated_fields else None
                    }
                )
                
                # Send notification emails if email changed
                if email_changed:
                    try:
                        # Send to old email
                        subject_old, message_old = get_admin_update_notification_template(
                            admin_name=admin.name,
                            changed_fields=updated_fields,
                            old_email=old_email,
                            new_email=admin.email
                        )
                        send_mail(
                            subject=subject_old,
                            message=message_old,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[old_email],
                            fail_silently=True
                        )
                        
                        # Send to new email
                        subject_new, message_new = get_admin_update_notification_template(
                            admin_name=admin.name,
                            changed_fields=updated_fields,
                            old_email=old_email,
                            new_email=admin.email
                        )
                        send_mail(
                            subject=subject_new,
                            message=message_new,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[admin.email],
                            fail_silently=True
                        )
                    except Exception as email_error:
                        logger.error(f"Failed to send update notification emails: {str(email_error)}")
                elif updated_fields:
                    # Send notification to admin about changes
                    try:
                        subject, message = get_admin_update_notification_template(
                            admin_name=admin.name,
                            changed_fields=updated_fields
                        )
                        send_mail(
                            subject=subject,
                            message=message,
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[admin.email],
                            fail_silently=True
                        )
                    except Exception as email_error:
                        logger.error(f"Failed to send update notification email: {str(email_error)}")
        
        logger.info(
            f"Master Admin {request.admin.email} updated admin {admin_id} "
            f"(fields: {', '.join(updated_fields)})"
        )
        
        return Response({
            'success': True,
            'message': 'Admin account updated successfully',
            'updated_fields': updated_fields,
            'admin': {
                'admin_id': str(admin.id),
                'name': admin.name,
                'email': admin.email,
                'role': admin.get_role_display(),
                'status': 'Active' if admin.is_active else 'Inactive',
                'profile_image': request.build_absolute_uri(admin.profile_image.url) if admin.profile_image else None
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Update admin role error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to update admin account',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _delete_admin_role(request, admin_id):
    """
    DELETE /api/admin/roles/:adminId
    
    Soft delete admin account (set is_deleted=True)
    Permissions: MASTER ONLY
    
    URL Parameters:
        admin_id: Admin ID
    
    Returns:
        success: True/False
        message: Success message
    
    Rules:
    - Cannot delete last MASTER admin
    - Cannot delete MASTER admin
    """
    try:
        # Get admin
        try:
            admin = Admin.objects.get(id=admin_id, is_deleted=False)
        except Admin.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Admin not found',
                'admin_id': admin_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Cannot delete MASTER admin
        if admin.role == 'MASTER':
            return Response({
                'success': False,
                'error': 'Cannot delete MASTER admin',
                'code': 'CANNOT_DELETE_MASTER'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check if this is the last MASTER admin (shouldn't happen for non-MASTER, but safety check)
        master_count = check_master_admin_count()
        if master_count <= 1 and admin.role == 'MASTER':
            return Response({
                'success': False,
                'error': 'Cannot delete the last MASTER admin',
                'code': 'LAST_MASTER_ADMIN'
            }, status=status.HTTP_403_FORBIDDEN)
        
        with transaction.atomic():
            # Soft delete
            admin.is_deleted = True
            admin.is_active = False  # Also deactivate
            admin.save()
            
            # Log action
            log_admin_action(
                admin=request.admin,
                action='DELETE',
                target_admin_id=admin.id,
                target_admin_email=admin.email,
                details={
                    'name': admin.name,
                    'role': admin.role,
                    'soft_delete': True
                }
            )
        
        logger.info(
            f"Master Admin {request.admin.email} soft-deleted admin {admin_id} ({admin.email})"
        )
        
        return Response({
            'success': True,
            'message': 'Admin account deleted successfully',
            'note': 'Account has been soft-deleted and deactivated. Data is retained for audit purposes.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Delete admin role error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to delete admin account',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_admin_role(['MASTER'])
def toggle_admin_status(request, admin_id):
    """
    PUT /api/admin/roles/:adminId/status
    
    Toggle active/inactive status of admin account
    Permissions: MASTER ONLY
    
    URL Parameters:
        admin_id: Admin ID
    
    Input (optional):
        - status: active | inactive (if not provided, toggles current status)
    
    Returns:
        success: True/False
        admin: Updated admin object with new status
    """
    try:
        # Get admin
        try:
            admin = Admin.objects.get(id=admin_id, is_deleted=False)
        except Admin.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Admin not found',
                'admin_id': admin_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Prevent Master Admin from deactivating themselves
        if admin.id == request.admin.id:
            return Response({
                'success': False,
                'error': 'Cannot deactivate your own account',
                'code': 'CANNOT_DEACTIVATE_OWN_ACCOUNT'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Cannot modify MASTER status (unless it's the last one)
        if admin.role == 'MASTER':
            master_count = check_master_admin_count()
            if master_count <= 1:
                return Response({
                    'success': False,
                    'error': 'Cannot deactivate the last MASTER admin',
                    'code': 'LAST_MASTER_ADMIN'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Get new status from request or toggle
        if 'status' in request.data:
            new_status = request.data['status'].lower()
            if new_status not in ['active', 'inactive']:
                return Response({
                    'success': False,
                    'error': 'Status must be "active" or "inactive"'
                }, status=status.HTTP_400_BAD_REQUEST)
            new_is_active = new_status == 'active'
        else:
            # Toggle current status
            new_is_active = not admin.is_active
        
        old_status = 'Active' if admin.is_active else 'Inactive'
        
        with transaction.atomic():
            admin.is_active = new_is_active
            admin.save()
            
            # Log action
            log_admin_action(
                admin=request.admin,
                action='STATUS_CHANGE',
                target_admin_id=admin.id,
                target_admin_email=admin.email,
                details={
                    'old_status': old_status,
                    'new_status': 'Active' if new_is_active else 'Inactive'
                }
            )
        
        logger.info(
            f"Master Admin {request.admin.email} changed status of admin {admin_id} "
            f"from {old_status} to {'Active' if new_is_active else 'Inactive'}"
        )
        
        return Response({
            'success': True,
            'message': f'Admin status changed to {"Active" if new_is_active else "Inactive"}',
            'admin': {
                'admin_id': str(admin.id),
                'name': admin.name,
                'email': admin.email,
                'role': admin.get_role_display(),
                'status': 'Active' if new_is_active else 'Inactive'
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Toggle admin status error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to change admin status',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

