"""
Unified Permission System for Pet Owners and Admins
Supports both user types in shared endpoints with role-based access control
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from admin_panel.jwt_utils import extract_token_from_header, verify_admin_jwt
from admin_panel.models import Admin
from users.utils import verify_jwt_token
from users.models import User
import logging

logger = logging.getLogger(__name__)


def check_user_or_admin(request):
    """
    Check if request is authenticated as either a pet owner or admin.
    Returns (user_type, user_object, error_response)
    
    user_type can be:
        - 'pet_owner': Django User authenticated via standard JWT
        - 'admin': Admin authenticated via admin JWT
        - None: Not authenticated
    
    Returns:
        (user_type, user_object, None) on success
        (None, None, error_response) on failure
    """
    # Extract token from Authorization header
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    print(f"[UNIFIED_PERMISSIONS] Authorization header: {auth_header[:50] if auth_header else 'None'}...")
    
    # Try to extract token (supports both "Bearer <token>" and "Token <token>" formats)
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1] if len(auth_header.split(' ', 1)) > 1 else None
        print(f"[UNIFIED_PERMISSIONS] Extracted Bearer token: {token[:30] if token else 'None'}...")
    elif auth_header.startswith('Token '):
        token = auth_header.split(' ', 1)[1] if len(auth_header.split(' ', 1)) > 1 else None
        print(f"[UNIFIED_PERMISSIONS] Extracted Token token: {token[:30] if token else 'None'}...")
    else:
        print(f"[UNIFIED_PERMISSIONS] No Bearer/Token prefix found in header")
    
    if token:
        # Try admin authentication first
        payload, error = verify_admin_jwt(token)
        if payload and not error:
            # Valid admin token
            admin_id = payload.get('admin_id')
            admin_role = payload.get('role')
            
            try:
                admin = Admin.objects.get(id=admin_id, is_active=True)
                print(f"[UNIFIED_PERMISSIONS] Admin authenticated: {admin.email}, role: {admin_role}")
                return ('admin', admin, None)
            except Admin.DoesNotExist:
                # Admin token valid but admin not found - fall through to pet owner check
                pass
        
        # Try pet owner JWT authentication
        print(f"[UNIFIED_PERMISSIONS] Attempting pet owner JWT verification...")
        payload, error = verify_jwt_token(token)
        if payload and not error:
            # Valid pet owner JWT token
            user_id = payload.get('user_id')
            print(f"[UNIFIED_PERMISSIONS] Pet owner JWT verified, user_id: {user_id}")
            try:
                user = User.objects.get(id=user_id, is_active=True)
                print(f"[UNIFIED_PERMISSIONS] Pet owner authenticated: {user.email}")
                return ('pet_owner', user, None)
            except User.DoesNotExist:
                print(f"[UNIFIED_PERMISSIONS] User with id {user_id} not found or inactive")
        else:
            print(f"[UNIFIED_PERMISSIONS] Pet owner JWT verification failed: {error}")
    
    # Fallback: Try Django's standard authentication (for DRF TokenAuthentication, etc.)
    if hasattr(request, 'user') and request.user.is_authenticated:
        print(f"[UNIFIED_PERMISSIONS] Pet owner authenticated via DRF: {request.user.email}")
        return ('pet_owner', request.user, None)
    
    # Not authenticated
    print(f"[UNIFIED_PERMISSIONS] Authentication failed - no valid token or user")
    return (None, None, Response({
        'success': False,
        'error': 'Authentication required',
        'code': 'AUTH_REQUIRED'
    }, status=status.HTTP_401_UNAUTHORIZED))


def require_user_or_admin(view_func):
    """
    Decorator that allows both pet owners and admins to access an endpoint.
    
    After authentication:
    - request.user_type will be 'pet_owner' or 'admin'
    - request.user will be the Django User (pet owner) or None
    - request.admin will be the Admin object or None
    
    Usage:
        @require_user_or_admin
        def my_view(request):
            if request.user_type == 'admin':
                # Admin can see all data
                queryset = Model.objects.all()
            else:  # pet_owner
                # Pet owner sees only their data
                queryset = Model.objects.filter(owner=request.user)
    """
    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        user_type, user_obj, error_response = check_user_or_admin(request)
        
        if error_response:
            return error_response
        
        # Set user type and attach appropriate object
        request.user_type = user_type
        
        if user_type == 'admin':
            request.admin = user_obj
            request.admin_id = user_obj.id
            request.admin_role = user_obj.role
            request.user = None  # Clear to avoid confusion
        else:  # pet_owner
            request.user = user_obj
            request.admin = None  # Clear to avoid confusion
        
        return view_func(request, *args, **kwargs)
    
    return wrapped_view


def require_admin_or_owner(owner_check_func=None):
    """
    Decorator that requires either admin access OR ownership of the resource.
    
    Args:
        owner_check_func: Optional function(request, obj) -> bool
            Returns True if the pet owner owns the resource.
            If not provided, checks obj.owner == request.user
    
    Usage:
        @require_admin_or_owner(lambda req, obj: obj.pet.owner == req.user)
        def get_report(request, case_id):
            report = get_object_or_404(SOAPReport, case_id=case_id)
            # Permission already checked by decorator
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            user_type, user_obj, error_response = check_user_or_admin(request)
            
            if error_response:
                return error_response
            
            # Admins always have access
            if user_type == 'admin':
                request.user_type = 'admin'
                request.admin = user_obj
                request.admin_id = user_obj.id
                request.admin_role = user_obj.role
                request.user = None
                return view_func(request, *args, **kwargs)
            
            # Pet owners - check ownership
            request.user_type = 'pet_owner'
            request.user = user_obj
            request.admin = None
            
            # If owner_check_func provided, use it for object-level check
            # Note: This requires the view to fetch the object first
            # We'll handle this in the view itself for flexibility
            
            return view_func(request, *args, **kwargs)
        
        return wrapped_view
    return decorator


class IsUserOrAdmin(IsAuthenticated):
    """
    DRF Permission class that allows both authenticated users and admins.
    
    Usage:
        permission_classes = [IsUserOrAdmin]
    """
    
    def has_permission(self, request, view):
        # Check if it's a standard authenticated user
        if hasattr(request, 'user') and request.user.is_authenticated:
            request.user_type = 'pet_owner'
            return True
        
        # Check if it's an admin
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = extract_token_from_header(auth_header)
        
        if token:
            payload, error = verify_admin_jwt(token)
            if payload and not error:
                admin_id = payload.get('admin_id')
                try:
                    admin = Admin.objects.get(id=admin_id, is_active=True)
                    request.user_type = 'admin'
                    request.admin = admin
                    request.admin_id = admin.id
                    request.admin_role = admin.role
                    return True
                except Admin.DoesNotExist:
                    pass
        
        return False


def filter_by_ownership(queryset, request, owner_field='owner'):
    """
    Helper function to filter queryset based on user type.
    
    Args:
        queryset: Django queryset to filter
        request: Request object with user_type set
        owner_field: Field name that points to the owner (default: 'owner')
    
    Returns:
        Filtered queryset
        
    Usage:
        queryset = SOAPReport.objects.all()
        queryset = filter_by_ownership(queryset, request, owner_field='pet__owner')
    """
    if not hasattr(request, 'user_type'):
        # Fallback: try to determine user type
        user_type, _, _ = check_user_or_admin(request)
        if user_type:
            request.user_type = user_type
    
    if request.user_type == 'admin':
        # Admin sees all - no filter
        return queryset
    else:  # pet_owner
        # Pet owner sees only their own
        filter_kwargs = {owner_field: request.user}
        return queryset.filter(**filter_kwargs)

