"""
Admin audit logging utility
Provides functions to log admin actions for audit trail and security compliance
"""
from typing import Optional, Dict, Any
from .models import AdminAuditLog, Admin
import logging

logger = logging.getLogger(__name__)


def log_admin_action(
    admin_id: int,
    action: str,
    target_admin_id: Optional[int] = None,
    target_admin_email: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
):
    """
    Log admin actions for audit trail
    
    Args:
        admin_id: ID of the admin who performed the action
        action: Action type (CREATE, UPDATE, DELETE, STATUS_CHANGE, ROLE_CHANGE, EMAIL_CHANGE)
        target_admin_id: ID of the admin account that was acted upon (defaults to admin_id if None)
        target_admin_email: Email of the target admin (optional)
        details: Additional details about the action as a dictionary (optional)
    
    Usage:
        log_admin_action(
            request.admin_id,
            'UPDATE',
            target_admin_id=user_id,
            details={'changes': updated_fields, 'old_role': 'VET', 'new_role': 'MASTER'}
        )
    
    Examples:
        # Log admin creation
        log_admin_action(
            admin_id=1,
            action='CREATE',
            target_admin_id=new_admin.id,
            target_admin_email=new_admin.email,
            details={'role': new_admin.role, 'name': new_admin.name}
        )
        
        # Log admin update
        log_admin_action(
            admin_id=request.admin_id,
            action='UPDATE',
            target_admin_id=target_admin.id,
            details={'updated_fields': ['name', 'contact_number']}
        )
        
        # Log status change
        log_admin_action(
            admin_id=request.admin_id,
            action='STATUS_CHANGE',
            target_admin_id=target_admin.id,
            details={'old_status': 'active', 'new_status': 'inactive'}
        )
    """
    try:
        # Get admin instance
        try:
            admin = Admin.objects.get(id=admin_id)
        except Admin.DoesNotExist:
            logger.error(f"Cannot log action: Admin with ID {admin_id} not found")
            return
        
        # Get target admin email if target_admin_id is provided and email not given
        if target_admin_id and not target_admin_email:
            try:
                target_admin = Admin.objects.get(id=target_admin_id)
                target_admin_email = target_admin.email
            except Admin.DoesNotExist:
                # Target admin might be deleted, continue without email
                pass
        
        # Use admin_id as target_admin_id if not provided (self-action)
        if target_admin_id is None:
            target_admin_id = admin_id
            if not target_admin_email:
                target_admin_email = admin.email
        
        # Validate action
        valid_actions = [choice[0] for choice in AdminAuditLog.ACTION_CHOICES]
        if action not in valid_actions:
            logger.warning(f"Invalid action type: {action}. Using 'UPDATE' instead.")
            action = 'UPDATE'
        
        # Create audit log entry
        AdminAuditLog.objects.create(
            admin=admin,
            action=action,
            target_admin_id=str(target_admin_id),
            target_admin_email=target_admin_email,
            details=details or {}
        )
        
        logger.info(
            f"Audit log created: Admin {admin.email} ({admin_id}) performed '{action}' "
            f"on admin {target_admin_id}"
        )
        
    except Exception as e:
        logger.error(f"Failed to create audit log: {str(e)}", exc_info=True)


def log_admin_creation(admin_id: int, new_admin_id: int, new_admin_email: str, role: str):
    """
    Convenience function to log admin creation
    
    Args:
        admin_id: ID of admin who created the new admin
        new_admin_id: ID of the newly created admin
        new_admin_email: Email of the newly created admin
        role: Role assigned to the new admin
    """
    log_admin_action(
        admin_id=admin_id,
        action='CREATE',
        target_admin_id=new_admin_id,
        target_admin_email=new_admin_email,
        details={'role': role, 'action': 'account_creation'}
    )


def log_admin_update(
    admin_id: int,
    target_admin_id: int,
    updated_fields: list,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None
):
    """
    Convenience function to log admin update
    
    Args:
        admin_id: ID of admin who performed the update
        target_admin_id: ID of admin being updated
        updated_fields: List of field names that were updated
        old_values: Dictionary of old values (optional)
        new_values: Dictionary of new values (optional)
    """
    details = {
        'updated_fields': updated_fields,
        'action': 'account_update'
    }
    
    if old_values:
        details['old_values'] = old_values
    
    if new_values:
        details['new_values'] = new_values
    
    log_admin_action(
        admin_id=admin_id,
        action='UPDATE',
        target_admin_id=target_admin_id,
        details=details
    )


def log_admin_status_change(
    admin_id: int,
    target_admin_id: int,
    old_status: str,
    new_status: str
):
    """
    Convenience function to log admin status change
    
    Args:
        admin_id: ID of admin who changed the status
        target_admin_id: ID of admin whose status changed
        old_status: Previous status (e.g., 'active', 'inactive')
        new_status: New status (e.g., 'active', 'inactive')
    """
    log_admin_action(
        admin_id=admin_id,
        action='STATUS_CHANGE',
        target_admin_id=target_admin_id,
        details={
            'old_status': old_status,
            'new_status': new_status,
            'action': 'status_change'
        }
    )


def log_admin_role_change(
    admin_id: int,
    target_admin_id: int,
    old_role: str,
    new_role: str
):
    """
    Convenience function to log admin role change
    
    Args:
        admin_id: ID of admin who changed the role
        target_admin_id: ID of admin whose role changed
        old_role: Previous role (MASTER, VET, DESK)
        new_role: New role (MASTER, VET, DESK)
    """
    log_admin_action(
        admin_id=admin_id,
        action='ROLE_CHANGE',
        target_admin_id=target_admin_id,
        details={
            'old_role': old_role,
            'new_role': new_role,
            'action': 'role_change'
        }
    )


def log_admin_deletion(admin_id: int, deleted_admin_id: int, deleted_admin_email: str):
    """
    Convenience function to log admin deletion (soft delete)
    
    Args:
        admin_id: ID of admin who deleted the account
        deleted_admin_id: ID of the deleted admin
        deleted_admin_email: Email of the deleted admin
    """
    log_admin_action(
        admin_id=admin_id,
        action='DELETE',
        target_admin_id=deleted_admin_id,
        target_admin_email=deleted_admin_email,
        details={'action': 'account_deletion', 'deletion_type': 'soft_delete'}
    )

