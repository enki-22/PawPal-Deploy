"""
Custom filters for admin reports
Implements advanced filtering and search functionality
"""
from django.db.models import Q
from datetime import datetime, timedelta
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def apply_search_filter(queryset, search_term):
    """
    Apply search filter across multiple fields
    
    Searches in:
    - Pet name
    - Owner first name
    - Owner last name
    - Owner username
    - Case ID
    
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
        Q(pet__name__icontains=search_term) |
        Q(pet__owner__first_name__icontains=search_term) |
        Q(pet__owner__last_name__icontains=search_term) |
        Q(pet__owner__username__icontains=search_term) |
        Q(case_id__icontains=search_term)
    )


def apply_date_range_filter(queryset, date_range, custom_start=None, custom_end=None):
    """
    Apply date range filter
    
    Args:
        queryset: Django QuerySet to filter
        date_range: today | last_7_days | last_30_days | custom | all_time
        custom_start: Start date for custom range (YYYY-MM-DD)
        custom_end: End date for custom range (YYYY-MM-DD)
    
    Returns:
        Filtered QuerySet
    """
    if not date_range or date_range == 'all_time':
        return queryset
    
    now = timezone.now()
    today = now.date()
    
    if date_range == 'today':
        start_date = today
        end_date = today
        queryset = queryset.filter(
            date_generated__date__gte=start_date,
            date_generated__date__lte=end_date
        )
    
    elif date_range == 'last_7_days':
        start_date = today - timedelta(days=7)
        queryset = queryset.filter(date_generated__date__gte=start_date)
    
    elif date_range == 'last_30_days':
        start_date = today - timedelta(days=30)
        queryset = queryset.filter(date_generated__date__gte=start_date)
    
    elif date_range == 'custom':
        if custom_start:
            try:
                start_date = datetime.strptime(custom_start, '%Y-%m-%d').date()
                queryset = queryset.filter(date_generated__date__gte=start_date)
            except ValueError:
                logger.warning(f"Invalid custom_start date format: {custom_start}")
        
        if custom_end:
            try:
                end_date = datetime.strptime(custom_end, '%Y-%m-%d').date()
                queryset = queryset.filter(date_generated__date__lte=end_date)
            except ValueError:
                logger.warning(f"Invalid custom_end date format: {custom_end}")
    
    return queryset


def apply_species_filter(queryset, species):
    """
    Apply species filter
    
    Args:
        queryset: Django QuerySet to filter
        species: all | dogs | cats | birds | rabbits | others
    
    Returns:
        Filtered QuerySet
    """
    if not species or species == 'all':
        return queryset
    
    # Map plural to singular animal_type values
    species_map = {
        'dogs': 'dog',
        'cats': 'cat',
        'birds': 'bird',
        'rabbits': 'rabbit',
        'others': ['hamster', 'fish', 'other']
    }
    
    animal_type = species_map.get(species.lower())
    
    if animal_type:
        if isinstance(animal_type, list):
            # For "others", filter by multiple types
            queryset = queryset.filter(pet__animal_type__in=animal_type)
        else:
            # For specific species
            queryset = queryset.filter(pet__animal_type__iexact=animal_type)
    
    return queryset


def apply_flag_level_filter(queryset, flag_level):
    """
    Apply flag level filter
    
    Args:
        queryset: Django QuerySet to filter
        flag_level: all | emergency | urgent | moderate
    
    Returns:
        Filtered QuerySet
    """
    if not flag_level or flag_level == 'all':
        return queryset
    
    valid_levels = ['emergency', 'urgent', 'moderate']
    
    if flag_level.lower() in valid_levels:
        queryset = queryset.filter(flag_level__iexact=flag_level)
    
    return queryset


def apply_pagination(queryset, page, limit):
    """
    Apply pagination to queryset
    
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
        limit = max(min(int(limit), 100), 1)  # Limit between 1 and 100
    except (ValueError, TypeError):
        limit = 10
    
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


def filter_reports(queryset, filters):
    """
    Apply all filters to reports queryset
    
    Args:
        queryset: Base QuerySet
        filters: Dictionary of filter parameters
            {
                'search': str,
                'dateRange': str,
                'custom_start': str,
                'custom_end': str,
                'species': str,
                'flagLevel': str,
                'page': int,
                'limit': int
            }
    
    Returns:
        tuple: (filtered_paginated_queryset, pagination_info, applied_filters)
    """
    # Extract filter parameters
    search_term = filters.get('search', '')
    date_range = filters.get('dateRange', 'all_time')
    custom_start = filters.get('custom_start')
    custom_end = filters.get('custom_end')
    species = filters.get('species', 'all')
    flag_level = filters.get('flagLevel', 'all')
    page = filters.get('page', 1)
    limit = filters.get('limit', 10)
    
    # Apply filters sequentially
    queryset = apply_search_filter(queryset, search_term)
    queryset = apply_date_range_filter(queryset, date_range, custom_start, custom_end)
    queryset = apply_species_filter(queryset, species)
    queryset = apply_flag_level_filter(queryset, flag_level)
    
    # Order by date_generated DESC
    queryset = queryset.order_by('-date_generated')
    
    # Apply pagination
    paginated_queryset, pagination_info = apply_pagination(queryset, page, limit)
    
    # Track applied filters for response
    applied_filters = {
        'search': search_term if search_term else None,
        'dateRange': date_range,
        'species': species,
        'flagLevel': flag_level
    }
    
    # Add custom dates if used
    if date_range == 'custom':
        applied_filters['custom_start'] = custom_start
        applied_filters['custom_end'] = custom_end
    
    return paginated_queryset, pagination_info, applied_filters


def validate_filter_params(params):
    """
    Validate filter parameters
    
    Args:
        params: Dictionary of parameters to validate
    
    Returns:
        tuple: (is_valid, error_message)
    """
    # Validate dateRange
    valid_date_ranges = ['today', 'last_7_days', 'last_30_days', 'custom', 'all_time']
    date_range = params.get('dateRange', 'all_time')
    
    if date_range and date_range not in valid_date_ranges:
        return False, f"Invalid dateRange. Must be one of: {', '.join(valid_date_ranges)}"
    
    # Validate species
    valid_species = ['all', 'dogs', 'cats', 'birds', 'rabbits', 'others']
    species = params.get('species', 'all')
    
    if species and species not in valid_species:
        return False, f"Invalid species. Must be one of: {', '.join(valid_species)}"
    
    # Validate flagLevel
    valid_flag_levels = ['all', 'emergency', 'urgent', 'moderate']
    flag_level = params.get('flagLevel', 'all')
    
    if flag_level and flag_level not in valid_flag_levels:
        return False, f"Invalid flagLevel. Must be one of: {', '.join(valid_flag_levels)}"
    
    # Validate custom date format if dateRange is custom
    if date_range == 'custom':
        custom_start = params.get('custom_start')
        custom_end = params.get('custom_end')
        
        if custom_start:
            try:
                datetime.strptime(custom_start, '%Y-%m-%d')
            except ValueError:
                return False, "Invalid custom_start format. Must be YYYY-MM-DD"
        
        if custom_end:
            try:
                datetime.strptime(custom_end, '%Y-%m-%d')
            except ValueError:
                return False, "Invalid custom_end format. Must be YYYY-MM-DD"
    
    # Validate pagination
    page = params.get('page', 1)
    limit = params.get('limit', 10)
    
    try:
        page = int(page)
        if page < 1:
            return False, "Page must be >= 1"
    except (ValueError, TypeError):
        return False, "Page must be a valid integer"
    
    try:
        limit = int(limit)
        if limit < 1 or limit > 100:
            return False, "Limit must be between 1 and 100"
    except (ValueError, TypeError):
        return False, "Limit must be a valid integer"
    
    return True, None

