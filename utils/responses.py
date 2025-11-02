"""
Standardized response utilities for PawPal API
Provides consistent response formatting across all endpoints
"""
from rest_framework.response import Response
from rest_framework import status
from typing import Optional, Dict, Any, List


def success_response(
    data: Optional[Any] = None,
    message: Optional[str] = None,
    status_code: int = status.HTTP_200_OK
) -> Response:
    """
    Create a standardized success response
    
    Args:
        data: Response data (optional)
        message: Success message (optional)
        status_code: HTTP status code (default: 200)
    
    Returns:
        Response: DRF Response object with standardized format
    
    Example:
        return success_response(
            data={'user_id': 1, 'name': 'John'},
            message='User created successfully',
            status_code=status.HTTP_201_CREATED
        )
        
        Returns:
        {
            "success": true,
            "message": "User created successfully",
            "data": {
                "user_id": 1,
                "name": "John"
            }
        }
    """
    response_data: Dict[str, Any] = {
        "success": True
    }
    
    if message:
        response_data["message"] = message
    
    if data is not None:
        response_data["data"] = data
    
    return Response(response_data, status=status_code)


def error_response(
    code: str,
    message: str,
    details: Optional[Any] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> Response:
    """
    Create a standardized error response
    
    Args:
        code: Error code (from utils.error_codes)
        message: Error message
        details: Additional error details (optional)
        status_code: HTTP status code (default: 400)
    
    Returns:
        Response: DRF Response object with standardized format
    
    Example:
        return error_response(
            code=VALIDATION_ERROR,
            message="Invalid input provided",
            details={'email': 'Invalid email format'},
            status_code=status.HTTP_400_BAD_REQUEST
        )
        
        Returns:
        {
            "success": false,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid input provided",
                "details": {
                    "email": "Invalid email format"
                }
            }
        }
    """
    error_data: Dict[str, Any] = {
        "code": code,
        "message": message
    }
    
    if details is not None:
        error_data["details"] = details
    
    response_data: Dict[str, Any] = {
        "success": False,
        "error": error_data
    }
    
    return Response(response_data, status=status_code)


def paginated_response(
    results: List[Any],
    page: int,
    limit: int,
    total: int,
    message: Optional[str] = None
) -> Response:
    """
    Create a standardized paginated response
    
    Args:
        results: List of results for current page
        page: Current page number (1-based)
        limit: Number of items per page
        total: Total number of items
        message: Optional message
    
    Returns:
        Response: DRF Response object with pagination info
    
    Example:
        return paginated_response(
            results=[{'id': 1}, {'id': 2}],
            page=1,
            limit=10,
            total=25
        )
        
        Returns:
        {
            "success": true,
            "data": {
                "results": [{"id": 1}, {"id": 2}],
                "pagination": {
                    "page": 1,
                    "limit": 10,
                    "total": 25,
                    "totalPages": 3,
                    "hasNext": true,
                    "hasPrev": false
                }
            }
        }
    """
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    
    pagination_data = {
        "results": results,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": total_pages,
            "hasNext": page * limit < total,
            "hasPrev": page > 1
        }
    }
    
    return success_response(data=pagination_data, message=message)


def created_response(
    data: Optional[Any] = None,
    message: Optional[str] = None
) -> Response:
    """
    Create a standardized 201 Created response
    
    Args:
        data: Created resource data
        message: Success message
    
    Returns:
        Response: 201 Created response
    """
    return success_response(
        data=data,
        message=message or "Resource created successfully",
        status_code=status.HTTP_201_CREATED
    )


def no_content_response() -> Response:
    """
    Create a standardized 204 No Content response
    
    Returns:
        Response: 204 No Content response
    """
    return Response(status=status.HTTP_204_NO_CONTENT)


def validation_error_response(
    message: str = "Invalid input provided",
    details: Optional[Any] = None
) -> Response:
    """
    Create a standardized validation error response
    
    Args:
        message: Error message
        details: Validation error details
    
    Returns:
        Response: 400 Bad Request with validation error
    """
    from .error_codes import VALIDATION_ERROR
    
    return error_response(
        code=VALIDATION_ERROR,
        message=message,
        details=details,
        status_code=status.HTTP_400_BAD_REQUEST
    )


def not_found_response(
    resource: str = "Resource",
    resource_id: Optional[Any] = None
) -> Response:
    """
    Create a standardized 404 Not Found response
    
    Args:
        resource: Resource type name
        resource_id: Resource identifier
    
    Returns:
        Response: 404 Not Found response
    """
    from .error_codes import RESOURCE_NOT_FOUND
    
    message = f"{resource} not found"
    if resource_id is not None:
        message += f" (ID: {resource_id})"
    
    return error_response(
        code=RESOURCE_NOT_FOUND,
        message=message,
        status_code=status.HTTP_404_NOT_FOUND
    )


def permission_denied_response(
    message: str = "You do not have permission to perform this action"
) -> Response:
    """
    Create a standardized 403 Forbidden response
    
    Args:
        message: Permission denied message
    
    Returns:
        Response: 403 Forbidden response
    """
    from .error_codes import PERMISSION_DENIED
    
    return error_response(
        code=PERMISSION_DENIED,
        message=message,
        status_code=status.HTTP_403_FORBIDDEN
    )


def unauthorized_response(
    message: str = "Authentication required"
) -> Response:
    """
    Create a standardized 401 Unauthorized response
    
    Args:
        message: Unauthorized message
    
    Returns:
        Response: 401 Unauthorized response
    """
    from .error_codes import AUTH_UNAUTHORIZED
    
    return error_response(
        code=AUTH_UNAUTHORIZED,
        message=message,
        status_code=status.HTTP_401_UNAUTHORIZED
    )


def internal_server_error_response(
    message: str = "An unexpected error occurred",
    details: Optional[str] = None
) -> Response:
    """
    Create a standardized 500 Internal Server Error response
    
    Args:
        message: Error message
        details: Error details (optional, not exposed in production)
    
    Returns:
        Response: 500 Internal Server Error response
    """
    from django.conf import settings
    from .error_codes import INTERNAL_SERVER_ERROR
    
    # Only include details in debug mode
    error_details = details if settings.DEBUG else None
    
    return error_response(
        code=INTERNAL_SERVER_ERROR,
        message=message,
        details=error_details,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )

