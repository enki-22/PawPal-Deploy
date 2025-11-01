"""
JWT utility functions for admin authentication
Implements secure JWT token generation and verification for admin panel
"""
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from typing import Dict, Tuple, Optional


def generate_admin_jwt(admin) -> str:
    """
    Generate JWT token for admin with role embedded
    
    Args:
        admin: Admin model instance
    
    Returns:
        str: JWT token string
    
    Token includes:
        - admin_id: Admin's database ID
        - email: Admin's email
        - role: Admin's role (MASTER, VET, DESK)
        - name: Admin's name
        - exp: Expiration time (8 hours)
        - iat: Issued at time
    """
    payload = {
        'admin_id': admin.id,
        'email': admin.email,
        'role': admin.role,
        'name': admin.name,
        'exp': datetime.utcnow() + timedelta(hours=8),  # 8-hour expiration
        'iat': datetime.utcnow(),
        'token_type': 'admin_access'
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token


def verify_admin_jwt(token: str) -> Tuple[Optional[Dict], Optional[str]]:
    """
    Verify JWT token and return payload
    
    Args:
        token: JWT token string
    
    Returns:
        tuple: (payload dict or None, error message or None)
    
    Possible errors:
        - "Token expired"
        - "Invalid token"
        - "Invalid token type"
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        # Verify it's an admin token
        if payload.get('token_type') != 'admin_access':
            return None, "Invalid token type"
        
        return payload, None
        
    except jwt.ExpiredSignatureError:
        return None, "Token expired"
    except jwt.InvalidTokenError:
        return None, "Invalid token"
    except Exception as e:
        return None, f"Token verification failed: {str(e)}"


def generate_refresh_token(admin) -> str:
    """
    Generate refresh token for admin (optional, longer expiration)
    
    Args:
        admin: Admin model instance
    
    Returns:
        str: Refresh token string
    """
    payload = {
        'admin_id': admin.id,
        'email': admin.email,
        'exp': datetime.utcnow() + timedelta(days=7),  # 7-day expiration
        'iat': datetime.utcnow(),
        'token_type': 'admin_refresh'
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token


def verify_refresh_token(token: str) -> Tuple[Optional[Dict], Optional[str]]:
    """
    Verify refresh token
    
    Args:
        token: Refresh token string
    
    Returns:
        tuple: (payload dict or None, error message or None)
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        
        # Verify it's a refresh token
        if payload.get('token_type') != 'admin_refresh':
            return None, "Invalid token type"
        
        return payload, None
        
    except jwt.ExpiredSignatureError:
        return None, "Refresh token expired"
    except jwt.InvalidTokenError:
        return None, "Invalid refresh token"
    except Exception as e:
        return None, f"Token verification failed: {str(e)}"


def extract_token_from_header(authorization_header: str) -> Optional[str]:
    """
    Extract JWT token from Authorization header
    
    Args:
        authorization_header: Authorization header value
    
    Returns:
        str or None: Token string if found, None otherwise
    
    Expected format: "Bearer <token>"
    """
    if not authorization_header:
        return None
    
    parts = authorization_header.split()
    
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None
    
    return parts[1]


def get_token_expiry_time(token: str) -> Optional[datetime]:
    """
    Get expiration time from token without verification
    
    Args:
        token: JWT token string
    
    Returns:
        datetime or None: Expiration datetime if found
    """
    try:
        # Decode without verification to get expiry
        payload = jwt.decode(token, options={"verify_signature": False})
        exp_timestamp = payload.get('exp')
        
        if exp_timestamp:
            return datetime.fromtimestamp(exp_timestamp)
        
        return None
    except Exception:
        return None


def is_token_expired(token: str) -> bool:
    """
    Check if token is expired without full verification
    
    Args:
        token: JWT token string
    
    Returns:
        bool: True if expired, False otherwise
    """
    try:
        expiry = get_token_expiry_time(token)
        if not expiry:
            return True
        
        return datetime.utcnow() > expiry
    except Exception:
        return True

