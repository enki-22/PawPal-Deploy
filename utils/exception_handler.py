"""
Custom exception handler for Django REST Framework
Provides standardized error responses for all API exceptions
"""
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.exceptions import (
    ValidationError,
    NotFound,
    PermissionDenied,
    AuthenticationFailed,
    NotAuthenticated,
    Throttled
)
from rest_framework import status
from .responses import error_response
from .error_codes import (
    VALIDATION_ERROR,
    RESOURCE_NOT_FOUND,
    PERMISSION_DENIED,
    AUTH_UNAUTHORIZED,
    AUTH_INVALID_CREDENTIALS,
    RATE_LIMIT_EXCEEDED,
    INTERNAL_SERVER_ERROR
)
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for all API errors
    
    This handler standardizes all error responses to follow the PawPal API format:
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "Error message",
            "details": {...}  // Optional
        }
    }
    
    Args:
        exc: The exception that was raised
        context: Dictionary containing context information about the exception
    
    Returns:
        Response: Standardized error response
    """
    # Call DRF's default handler first to get standard error response
    response = drf_exception_handler(exc, context)
    
    # Handle ValidationError (400)
    if isinstance(exc, ValidationError):
        # DRF ValidationError can have different structures
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                # Field-level errors
                details = exc.detail
                message = "Validation failed"
            elif isinstance(exc.detail, list):
                # Non-field errors
                details = None
                message = exc.detail[0] if exc.detail else "Validation failed"
            else:
                # String error
                details = None
                message = str(exc.detail)
        else:
            details = None
            message = "Validation failed"
        
        return error_response(
            code=VALIDATION_ERROR,
            message=message,
            details=details,
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle NotFound (404)
    if isinstance(exc, NotFound):
        error_detail = str(exc.detail) if hasattr(exc, 'detail') else "Resource not found"
        
        return error_response(
            code=RESOURCE_NOT_FOUND,
            message=error_detail,
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    # Handle PermissionDenied (403)
    if isinstance(exc, PermissionDenied):
        error_detail = str(exc.detail) if hasattr(exc, 'detail') else "Permission denied"
        
        return error_response(
            code=PERMISSION_DENIED,
            message=error_detail,
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    # Handle AuthenticationFailed (401)
    if isinstance(exc, AuthenticationFailed):
        error_detail = str(exc.detail) if hasattr(exc, 'detail') else "Invalid authentication credentials"
        
        return error_response(
            code=AUTH_INVALID_CREDENTIALS,
            message=error_detail,
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # Handle NotAuthenticated (401)
    if isinstance(exc, NotAuthenticated):
        error_detail = str(exc.detail) if hasattr(exc, 'detail') else "Authentication required"
        
        return error_response(
            code=AUTH_UNAUTHORIZED,
            message=error_detail,
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    # Handle Throttled (429)
    if isinstance(exc, Throttled):
        wait_time = exc.wait if hasattr(exc, 'wait') else None
        message = "Too many requests"
        details = None
        
        if wait_time:
            message += f". Please try again in {wait_time:.0f} seconds."
            details = {"retry_after": wait_time}
        else:
            message += ". Please try again later."
        
        return error_response(
            code=RATE_LIMIT_EXCEEDED,
            message=message,
            details=details,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )
    
    # Handle unhandled exceptions (500)
    if response is None:
        # Log the exception for debugging
        logger.error(
            f"Unhandled exception in API: {exc}",
            exc_info=True,
            extra={
                'exception_type': type(exc).__name__,
                'exception_message': str(exc),
                'request_path': context.get('request').path if context.get('request') else None,
                'request_method': context.get('request').method if context.get('request') else None,
            }
        )
        
        return error_response(
            code=INTERNAL_SERVER_ERROR,
            message="An unexpected error occurred",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    # If DRF provided a response, standardize its format
    # Convert DRF's default error format to our standard format
    if hasattr(response, 'data'):
        # Check if response is already in our format
        if isinstance(response.data, dict) and 'success' in response.data:
            return response
        
        # Convert DRF format to our format
        error_data = response.data
        
        # Determine error code based on status code
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            error_code = VALIDATION_ERROR
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            error_code = RESOURCE_NOT_FOUND
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            error_code = PERMISSION_DENIED
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            error_code = AUTH_UNAUTHORIZED
        elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            error_code = RATE_LIMIT_EXCEEDED
        else:
            error_code = INTERNAL_SERVER_ERROR
        
        # Extract message and details
        if isinstance(error_data, dict):
            message = error_data.get('detail', error_data.get('message', 'An error occurred'))
            details = {k: v for k, v in error_data.items() if k not in ('detail', 'message')}
        elif isinstance(error_data, list):
            message = error_data[0] if error_data else 'An error occurred'
            details = None
        else:
            message = str(error_data)
            details = None
        
        return error_response(
            code=error_code,
            message=str(message),
            details=details if details else None,
            status_code=response.status_code
        )
    
    return response

