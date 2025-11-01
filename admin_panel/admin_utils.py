"""
Admin management utilities
Password generation and admin account helpers
"""
import secrets
import string
import logging

logger = logging.getLogger(__name__)


def generate_admin_password(length=12):
    """
    Generate a strong random password for admin accounts
    
    Args:
        length: Password length (default: 12)
    
    Returns:
        str: Generated password
    
    Password requirements:
    - Contains uppercase letters
    - Contains lowercase letters
    - Contains digits
    - Contains punctuation
    - Cryptographically secure using secrets module
    """
    # Character sets
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    punctuation = string.punctuation
    
    # Combine all characters
    all_chars = uppercase + lowercase + digits + punctuation
    
    # Ensure password contains at least one of each required character type
    password_chars = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
        secrets.choice(punctuation)
    ]
    
    # Fill remaining length with random characters
    remaining_length = length - len(password_chars)
    password_chars.extend(secrets.choice(all_chars) for _ in range(remaining_length))
    
    # Shuffle to avoid predictable patterns
    secrets.SystemRandom().shuffle(password_chars)
    
    password = ''.join(password_chars)
    
    logger.info(f"Generated admin password (length: {length})")
    return password


def validate_admin_role(role):
    """
    Validate admin role
    
    Args:
        role: Role string to validate
    
    Returns:
        tuple: (is_valid, error_message)
    """
    valid_roles = ['MASTER', 'VET', 'DESK']
    
    if role not in valid_roles:
        return False, f"Invalid role. Must be one of: {', '.join(valid_roles)}"
    
    return True, None


def can_modify_admin_role(current_role, new_role=None):
    """
    Check if admin role can be modified
    
    Rules:
    - MASTER role cannot be changed
    - Cannot create new MASTER admins via API (only via management command)
    
    Args:
        current_role: Current admin role
        new_role: New role to set (optional)
    
    Returns:
        tuple: (can_modify, error_message)
    """
    # Cannot modify MASTER role
    if current_role == 'MASTER':
        return False, "Cannot modify MASTER admin role"
    
    # Cannot create new MASTER via API
    if new_role and new_role == 'MASTER':
        return False, "Cannot create MASTER admin via API. Use management command instead."
    
    return True, None


def check_master_admin_count():
    """
    Count active MASTER admins
    
    Returns:
        int: Number of active MASTER admins
    """
    from .models import Admin
    
    return Admin.objects.filter(
        role='MASTER',
        is_active=True,
        is_deleted=False
    ).count()

