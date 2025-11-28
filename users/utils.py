"""
Utility functions for user authentication and validation
"""
import re
import jwt
from datetime import datetime, timedelta
from django.conf import settings


def validate_password(password):
    """
    Validate password requirements:
    - At least 8 characters
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character
    
    Returns: (is_valid: bool, error_message: str or None)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    # FIX: Use broad regex for ANY special character (non-alphanumeric OR underscore)
    # This matches _, -, @, #, $, etc.
    if not re.search(r'[\W_]', password):
        return False, "Password must contain at least one special character"
    
    return True, None


def generate_jwt_token(user):
    """
    Generate JWT token for authenticated user
    """
    payload = {
        'user_id': user.id,
        'email': user.email,
        'username': user.username,
        'exp': datetime.utcnow() + timedelta(hours=24),  # 24-hour expiry
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token


def verify_jwt_token(token):
    """
    Verify JWT token and return payload
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "Token expired"
    except jwt.InvalidTokenError:
        return None, "Invalid token"