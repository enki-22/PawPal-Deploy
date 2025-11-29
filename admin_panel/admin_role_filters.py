"""
Admin role filters for admin account management
Implements search and filtering for admin role endpoints
"""
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)


def apply_admin_search(queryset, search_term):
    """
    Apply search filter for admins
    
    Searches in:
    - Name
    - Email
    
    Args:
        queryset: Django QuerySet to filter
        search_term: Search term string
    
    Returns:
        Filtered QuerySet
    """
    if not search_term or not search_term.strip():
        return queryset
    
    search_term = search_term.strip()
    
    return queryset.filter(
        Q(name__icontains=search_term) |
        Q(email__icontains=search_term)
    )


def apply_admin_role_filter(queryset, role):
    """
    Apply role filter for admins
    
    Args:
        queryset: Django QuerySet to filter
        role: all | master | vet | desk
    
    Returns:
        Filtered QuerySet
    """
    if not role or role == 'all':
        return queryset
    
    # Map lowercase to uppercase role
    role_map = {
        'master': 'MASTER',
        'vet': 'VET',
        'desk': 'DESK'
    }
    
    role_upper = role_map.get(role.lower())
    
    if role_upper:
        return queryset.filter(role=role_upper)
    
    return queryset


def apply_admin_status_filter(queryset, status):
    """
    Apply status filter for admins
    
    Args:
        queryset: Django QuerySet to filter
        status: all | active | inactive
    
    Returns:
        Filtered QuerySet
    """
    if not status or status == 'all':
        return queryset
    
    # Filter out soft-deleted admins
    queryset = queryset.filter(is_deleted=False)
    
    if status == 'active':
        return queryset.filter(is_active=True)
    elif status == 'inactive':
        return queryset.filter(is_active=False)
    
    return queryset


def apply_admin_pagination(queryset, page, limit):
    """
    Apply pagination to admin queryset
    
    Args:
        queryset: Django QuerySet to paginate
        page: Page number (1-indexed)
        limit: Items per page
    
    Returns:
        tuple: (paginated_queryset, pagination_info)
    """
    try:
        page = max(int(page), 1)  # Ensure page >= 1
    except (ValueError, TypeError):
        page = 1
    
    try:
        # FIX: Increase max limit to 1000
        limit = max(min(int(limit), 1000), 1)
    except (ValueError, TypeError):
        # FIX: Default fallback to 50
        limit = 50
    
    total = queryset.count()
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    
    # Calculate offset
    offset = (page - 1) * limit
    
    # Paginate queryset
    paginated_queryset = queryset[offset:offset + limit]
    
    pagination_info = {
        'page': page,
        'limit': limit,
        'total': total,
        'totalPages': total_pages,
        'hasNext': page < total_pages,
        'hasPrev': page > 1
    }
    
    return paginated_queryset, pagination_info


def filter_admins(queryset, filters):
    """
    Apply all filters to admins queryset
    
    Args:
        queryset: Base QuerySet
        filters: Dictionary of filter parameters
            {
                'search': str,
                'role': str,
                'status': str,
                'page': int,
                'limit': int
            }
    
    Returns:
        tuple: (filtered_paginated_queryset, pagination_info, applied_filters)
    """
    # Extract filter parameters
    search_term = filters.get('search', '')
    role = filters.get('role', 'all')
    status = filters.get('status', 'all')
    page = filters.get('page', 1)
    limit = filters.get('limit', 50)
    
    # Filter out soft-deleted admins by default
    queryset = queryset.filter(is_deleted=False)
    
    # Apply filters sequentially
    queryset = apply_admin_search(queryset, search_term)
    queryset = apply_admin_role_filter(queryset, role)
    queryset = apply_admin_status_filter(queryset, status)
    
    # Order by created_at DESC (newest first)
    queryset = queryset.order_by('-created_at')
    
    # Apply pagination
    paginated_queryset, pagination_info = apply_admin_pagination(queryset, page, limit)
    
    # Track applied filters for response
    applied_filters = {
        'search': search_term if search_term else None,
        'role': role,
        'status': status
    }
    
    return paginated_queryset, pagination_info, applied_filters


def validate_admin_filter_params(params):
    """
    Validate admin filter parameters
    
    Args:
        params: Dictionary of parameters to validate
    
    Returns:
        tuple: (is_valid, error_message)
    """
    # Validate role
    valid_roles = ['all', 'master', 'vet', 'desk']
    role = params.get('role', 'all')
    
    if role and role.lower() not in valid_roles:
        return False, f"Invalid role. Must be one of: {', '.join(valid_roles)}"
    
    # Validate status
    valid_statuses = ['all', 'active', 'inactive']
    status = params.get('status', 'all')
    
    if status and status.lower() not in valid_statuses:
        return False, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
    
    # Validate pagination
    page = params.get('page', 1)
    limit = params.get('limit', 50)
    
    try:
        page = int(page)
        if page < 1:
            return False, "Page must be >= 1"
    except (ValueError, TypeError):
        return False, "Page must be a valid integer"
    
    try:
        limit = int(limit)
        if limit < 1 or limit > 1000:
            return False, "Limit must be between 1 and 1000"
    except (ValueError, TypeError):
        return False, "Limit must be a valid integer"
    
    return True, None

