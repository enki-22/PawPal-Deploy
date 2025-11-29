"""
Pet filters for admin pet management
Implements search and filtering for pet endpoints
"""
from django.db.models import Q, Count
from datetime import datetime
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def apply_pet_search(queryset, search_term):
    """
    Apply search filter for pets
    
    Searches in:
    - Pet name
    - Owner's first name
    - Owner's last name
    - Owner's username
    - Pet ID
    
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
        Q(owner__first_name__icontains=search_term) |
        Q(owner__last_name__icontains=search_term) |
        Q(owner__username__icontains=search_term) |
        Q(id__icontains=search_term)
    )


def apply_pet_species_filter(queryset, species):
    """
    Apply species filter for pets
    
    Args:
        queryset: Django QuerySet to filter
        species: all | dogs | cats | birds | rabbits | others
    
    Returns:
        Filtered QuerySet
    """
    if not species or species == 'all':
        return queryset
    
    # Map plural to singular for animal_type
    species_map = {
        'dogs': 'dog',
        'cats': 'cat',
        'birds': 'bird',
        'rabbits': 'rabbit',
        'hamsters': 'hamster',
        'fish': 'fish',
        'others': 'other'
    }
    
    animal_type = species_map.get(species.lower())
    
    if animal_type:
        return queryset.filter(animal_type=animal_type)
    
    return queryset


def apply_pet_status_filter(queryset, status):
    """
    Apply status filter for pets
    
    Note: Pet model doesn't have status field currently,
    so this is a placeholder that considers all pets as 'active'
    
    Args:
        queryset: Django QuerySet to filter
        status: all | active | inactive | deceased
    
    Returns:
        Filtered QuerySet
    """
    # If no specific status requested, return original queryset
    if not status or status == 'all':
        return queryset

    # FIX: Pet model doesn't have a status field in current schema.
    # To avoid accidentally returning an empty set for 'inactive' or 'deceased',
    # return the queryset unchanged and let the frontend filter if needed.
    return queryset


def apply_pet_pagination(queryset, page, limit):
    """
    Apply pagination to pet queryset
    
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


def filter_pets(queryset, filters):
    """
    Apply all filters to pets queryset
    
    Args:
        queryset: Base QuerySet
        filters: Dictionary of filter parameters
            {
                'search': str,
                'species': str,
                'status': str,
                'page': int,
                'limit': int
            }
    
    Returns:
        tuple: (filtered_paginated_queryset, pagination_info, applied_filters)
    """
    # Extract filter parameters
    search_term = filters.get('search', '')
    species = filters.get('species', 'all')
    status = filters.get('status', 'all')
    page = filters.get('page', 1)
    limit = filters.get('limit', 50)
    
    # Apply filters sequentially
    queryset = apply_pet_search(queryset, search_term)
    queryset = apply_pet_species_filter(queryset, species)
    queryset = apply_pet_status_filter(queryset, status)
    
    # Order by created_at DESC (newest first)
    queryset = queryset.order_by('-created_at')
    
    # Apply pagination
    paginated_queryset, pagination_info = apply_pet_pagination(queryset, page, limit)
    
    # Track applied filters for response
    applied_filters = {
        'search': search_term if search_term else None,
        'species': species,
        'status': status
    }
    
    return paginated_queryset, pagination_info, applied_filters


def validate_pet_filter_params(params):
    """
    Validate pet filter parameters
    
    Args:
        params: Dictionary of parameters to validate
    
    Returns:
        tuple: (is_valid, error_message)
    """
    # Validate species
    valid_species = ['all', 'dogs', 'cats', 'birds', 'rabbits', 'hamsters', 'fish', 'others']
    species = params.get('species', 'all')
    
    if species and species.lower() not in valid_species:
        return False, f"Invalid species. Must be one of: {', '.join(valid_species)}"
    
    # Validate status
    valid_statuses = ['all', 'active', 'inactive', 'deceased']
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


def get_vaccination_status(next_due_date):
    """
    Determine vaccination status based on next due date
    
    Args:
        next_due_date: datetime.date or None
    
    Returns:
        str: "Up to Date", "Upcoming", or "Overdue"
    """
    if not next_due_date:
        return "Unknown"
    
    today = timezone.now().date()
    
    if next_due_date < today:
        return "Overdue"
    elif next_due_date <= today + timezone.timedelta(days=30):
        return "Upcoming"
    else:
        return "Up to Date"

