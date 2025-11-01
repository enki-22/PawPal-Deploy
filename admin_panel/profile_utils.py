"""
Profile management utilities
Image resizing and recovery email verification
"""
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.cache import cache
import io
import secrets
import re
import logging

logger = logging.getLogger(__name__)


def resize_profile_image(image_file, size=(200, 200), quality=85):
    """
    Resize profile image to specified dimensions
    
    Args:
        image_file: Uploaded image file
        size: Tuple of (width, height) in pixels
        quality: JPEG quality (1-100)
    
    Returns:
        InMemoryUploadedFile: Resized image file
    """
    try:
        # Open image
        img = Image.open(image_file)
        
        # Convert RGBA to RGB if necessary (for PNG with transparency)
        if img.mode == 'RGBA':
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            rgb_img.paste(img, mask=img.split()[3])  # Use alpha channel as mask
            img = rgb_img
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize image using LANCZOS resampling for high quality
        img = img.resize(size, Image.Resampling.LANCZOS)
        
        # Create output buffer
        output = io.BytesIO()
        img.save(output, format='JPEG', quality=quality)
        output.seek(0)
        
        # Get original filename without extension
        original_filename = image_file.name.split('.')[0] if '.' in image_file.name else 'profile'
        
        # Create InMemoryUploadedFile
        resized_file = InMemoryUploadedFile(
            output,
            'ImageField',
            f"{original_filename}_resized.jpg",
            'image/jpeg',
            output.getbuffer().nbytes,
            None
        )
        
        logger.info(f"Resized profile image to {size[0]}x{size[1]}")
        return resized_file
        
    except Exception as e:
        logger.error(f"Error resizing profile image: {str(e)}", exc_info=True)
        raise ValueError(f"Failed to process image: {str(e)}")


def validate_image_file(image_file, max_size_mb=2):
    """
    Validate uploaded image file
    
    Args:
        image_file: Uploaded file
        max_size_mb: Maximum file size in MB
    
    Returns:
        tuple: (is_valid, error_message)
    """
    if not image_file:
        return False, "No image file provided"
    
    # Check file size
    max_size_bytes = max_size_mb * 1024 * 1024
    if image_file.size > max_size_bytes:
        return False, f"Image file too large. Maximum size is {max_size_mb}MB"
    
    # Check file extension
    allowed_extensions = ['.jpg', '.jpeg', '.png']
    filename = image_file.name.lower()
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        return False, "Invalid file type. Only JPG, JPEG, and PNG are allowed"
    
    # Try to open and verify it's a valid image
    try:
        img = Image.open(image_file)
        img.verify()
        # Reset file pointer after verify
        image_file.seek(0)
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"
    
    return True, None


def generate_recovery_verification_token(admin_id, recovery_email):
    """
    Generate verification token for recovery email
    
    Args:
        admin_id: Admin ID
        recovery_email: Recovery email address
    
    Returns:
        str: Verification token
    
    Stores token in cache with 24-hour expiration
    """
    token = secrets.token_urlsafe(32)
    
    # Store in cache with 24-hour expiration
    cache_key = f'recovery_verify_{token}'
    cache_data = {
        'admin_id': str(admin_id),
        'email': recovery_email
    }
    cache.set(cache_key, cache_data, timeout=86400)  # 24 hours
    
    logger.info(f"Generated recovery email verification token for admin {admin_id}")
    return token


def verify_recovery_token(token):
    """
    Verify recovery email verification token
    
    Args:
        token: Verification token
    
    Returns:
        tuple: (is_valid, data_dict) or (False, None)
        data_dict contains: admin_id, email
    """
    cache_key = f'recovery_verify_{token}'
    data = cache.get(cache_key)
    
    if not data:
        logger.warning(f"Invalid or expired recovery verification token")
        return False, None
    
    # Delete token after verification (one-time use)
    cache.delete(cache_key)
    
    logger.info(f"Verified recovery email token for admin {data.get('admin_id')}")
    return True, data


def validate_contact_number(contact_number):
    """
    Validate contact number format
    
    Args:
        contact_number: Contact number string
    
    Returns:
        tuple: (is_valid, error_message)
    
    Format: Accepts various formats (with/without spaces, dashes, parentheses)
    """
    if not contact_number:
        return True, None  # Contact number is optional
    
    # Remove common formatting characters
    cleaned = re.sub(r'[\s\-\(\)]', '', contact_number)
    
    # Check if it contains only digits and optional + prefix
    if not re.match(r'^\+?\d{10,15}$', cleaned):
        return False, "Invalid contact number format. Use 10-15 digits with optional country code (+)"
    
    return True, None


def mask_contact_number(contact_number):
    """
    Mask contact number for privacy
    
    Args:
        contact_number: Full contact number
    
    Returns:
        str: Masked contact number (e.g., "09** *** **98")
    """
    if not contact_number or len(contact_number) < 4:
        return "****"
    
    # Show first 2 and last 2 digits, mask the rest
    if len(contact_number) <= 4:
        return contact_number[:2] + "**"
    
    first_part = contact_number[:2]
    last_part = contact_number[-2:]
    middle_length = len(contact_number) - 4
    
    # Create masked middle part
    masked_middle = "*" * middle_length
    
    return f"{first_part}{masked_middle}{last_part}"

