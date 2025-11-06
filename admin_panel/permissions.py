"""
Role-based permission decorators for admin panel
Implements secure access control for different admin roles
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from .jwt_utils import extract_token_from_header, verify_admin_jwt
from .models import Admin
import logging

logger = logging.getLogger(__name__)


def require_admin_role(allowed_roles):
    """
    Decorator to check if admin has required role
    
    Args:
        allowed_roles: List of allowed roles (e.g., ['MASTER', 'VET'])
    
    Usage:
        @require_admin_role(['MASTER', 'VET'])
        def my_view(request):
            ...
    
    Returns:
        403 Forbidden if role not allowed
        401 Unauthorized if token invalid/expired
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            try:
                # Extract token from Authorization header
                auth_header = request.META.get('HTTP_AUTHORIZATION', '')
                print(f"[PERMISSIONS] Authorization header: {auth_header[:50]}...")
                token = extract_token_from_header(auth_header)
                print(f"[PERMISSIONS] Extracted token: {token[:30] if token else 'None'}...")
                
                if not token:
                    print("[PERMISSIONS] ERROR: No token found in Authorization header")
                    logger.warning("No token found in Authorization header")
                    return Response({
                        'success': False,
                        'error': 'Authentication required',
                        'code': 'AUTH_REQUIRED'
                    }, status=status.HTTP_401_UNAUTHORIZED)
                
                # Verify token
                payload, error = verify_admin_jwt(token)
                print(f"[PERMISSIONS] Token verification - error: {error}, payload keys: {list(payload.keys()) if payload else None}")
                
                if error or not payload:
                    print(f"[PERMISSIONS] ERROR: Token verification failed - {error}")
                    logger.warning(f"Token verification failed: {error}")
                    return Response({
                        'success': False,
                        'error': error or 'Invalid token',
                        'code': 'INVALID_TOKEN',
                        'debug_info': {
                            'token_preview': token[:30] + '...' if token else None,
                            'error': error
                        }
                    }, status=status.HTTP_401_UNAUTHORIZED)
                
                # Check role
                admin_role = payload.get('role')
                admin_id = payload.get('admin_id')
                print(f"[PERMISSIONS] Token payload - admin_id: {admin_id}, role: {admin_role}, allowed_roles: {allowed_roles}")
                logger.debug(f"Token payload - admin_id: {admin_id}, role: {admin_role}, allowed_roles: {allowed_roles}")
                
                if admin_role not in allowed_roles:
                    print(f"[PERMISSIONS] ERROR: Role mismatch - got {admin_role}, required {allowed_roles}")
                    logger.warning(
                        f"Admin {admin_id} ({admin_role}) attempted to access "
                        f"endpoint requiring roles: {allowed_roles}"
                    )
                    return Response({
                        'success': False,
                        'error': 'Insufficient permissions',
                        'code': 'PERMISSION_DENIED',
                        'required_roles': allowed_roles,
                        'your_role': admin_role
                    }, status=status.HTTP_403_FORBIDDEN)
                
                # Verify admin still exists and is active
                try:
                    admin = Admin.objects.get(id=admin_id, is_active=True)
                    print(f"[PERMISSIONS] Admin found: {admin.email}, role: {admin.role}, active: {admin.is_active}")
                    logger.debug(f"Admin found: {admin.email}, role: {admin.role}, active: {admin.is_active}")
                except Admin.DoesNotExist:
                    print(f"[PERMISSIONS] ERROR: Admin with id {admin_id} not found or inactive")
                    logger.warning(f"Admin with id {admin_id} not found or inactive")
                    return Response({
                        'success': False,
                        'error': 'Admin account not found or inactive',
                        'code': 'ACCOUNT_INACTIVE',
                        'admin_id': admin_id
                    }, status=status.HTTP_401_UNAUTHORIZED)
                
                # Attach admin info to request for use in view
                request.admin = admin
                request.admin_id = admin_id
                request.admin_role = admin_role
                request.admin_payload = payload
                
                return view_func(request, *args, **kwargs)
                
            except Exception as e:
                logger.error(f"Permission check error: {str(e)}", exc_info=True)
                return Response({
                    'success': False,
                    'error': 'Authentication error',
                    'code': 'AUTH_ERROR'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return wrapped_view
    return decorator


def require_master_admin(view_func):
    """
    Decorator to require MASTER role
    Shortcut for @require_admin_role(['MASTER'])
    """
    return require_admin_role(['MASTER'])(view_func)


def require_vet_or_master(view_func):
    """
    Decorator to require VET or MASTER role
    Shortcut for @require_admin_role(['MASTER', 'VET'])
    """
    return require_admin_role(['MASTER', 'VET'])(view_func)


def require_any_admin(view_func):
    """
    Decorator to require any admin role
    Shortcut for @require_admin_role(['MASTER', 'VET', 'DESK'])
    """
    return require_admin_role(['MASTER', 'VET', 'DESK'])(view_func)


class AdminPermissionMixin:
    """
    Mixin for class-based views to check admin permissions
    
    Usage:
        class MyView(AdminPermissionMixin, APIView):
            allowed_roles = ['MASTER', 'VET']
            
            def get(self, request):
                # request.admin will be available here
                ...
    """
    allowed_roles = ['MASTER', 'VET', 'DESK']  # Default: all roles
    
    def check_admin_permission(self, request):
        """Check if admin has required permission"""
        # Extract token
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = extract_token_from_header(auth_header)
        
        if not token:
            return None, Response({
                'success': False,
                'error': 'Authentication required',
                'code': 'AUTH_REQUIRED'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verify token
        payload, error = verify_admin_jwt(token)
        
        if error or not payload:
            return None, Response({
                'success': False,
                'error': error or 'Invalid token',
                'code': 'INVALID_TOKEN'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check role
        admin_role = payload.get('role')
        admin_id = payload.get('admin_id')
        
        if admin_role not in self.allowed_roles:
            return None, Response({
                'success': False,
                'error': 'Insufficient permissions',
                'code': 'PERMISSION_DENIED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Verify admin exists
        try:
            admin = Admin.objects.get(id=admin_id, is_active=True)
        except Admin.DoesNotExist:
            return None, Response({
                'success': False,
                'error': 'Admin account not found or inactive',
                'code': 'ACCOUNT_INACTIVE'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        return admin, None
    
    def dispatch(self, request, *args, **kwargs):
        """Override dispatch to check permissions before handling request"""
        admin, error_response = self.check_admin_permission(request)
        
        if error_response:
            return error_response
        
        # Attach admin to request
        request.admin = admin
        request.admin_id = admin.id
        request.admin_role = admin.role
        
        return super().dispatch(request, *args, **kwargs)

