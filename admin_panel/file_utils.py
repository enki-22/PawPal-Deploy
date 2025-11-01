"""
File management utilities for admin panel
Implements ZIP generation and file streaming for medical records
"""
import zipfile
import os
import tempfile
import mimetypes
from django.http import HttpResponse, FileResponse, Http404
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def create_medical_files_zip(pet_id, files_queryset):
    """
    Create a ZIP file containing all medical files for a pet
    
    Args:
        pet_id: Pet ID
        files_queryset: QuerySet of file objects
    
    Returns:
        HttpResponse with ZIP file
    
    Note: This is a placeholder implementation as MedicalFile model doesn't exist yet.
    When the model is created, this function will work with actual files.
    """
    zip_filename = f'medical_records_pet_{pet_id}.zip'
    
    # Create response with appropriate headers
    response = HttpResponse(content_type='application/zip')
    response['Content-Disposition'] = f'attachment; filename="{zip_filename}"'
    
    # Create ZIP file in memory
    with zipfile.ZipFile(response, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add a README file explaining the contents
        readme_content = f"""Medical Records for Pet ID: {pet_id}
Generated: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}

This archive contains all medical files associated with this pet.

Contents:
---------
"""
        
        file_count = 0
        for file_obj in files_queryset:
            try:
                # Check if file exists and is readable
                if hasattr(file_obj, 'file') and file_obj.file:
                    file_path = file_obj.file.path
                    if os.path.exists(file_path):
                        # Get safe filename
                        arcname = os.path.basename(file_obj.file_name if hasattr(file_obj, 'file_name') else file_obj.file.name)
                        
                        # Add file to ZIP
                        zip_file.write(file_path, arcname)
                        readme_content += f"- {arcname}\n"
                        file_count += 1
                        logger.info(f"Added {arcname} to ZIP for pet {pet_id}")
            except Exception as e:
                logger.error(f"Error adding file to ZIP: {str(e)}")
                continue
        
        # Add README to ZIP
        readme_content += f"\nTotal files: {file_count}\n"
        zip_file.writestr('README.txt', readme_content)
    
    logger.info(f"Created ZIP with {file_count} files for pet {pet_id}")
    return response


def stream_file_download(file_obj, filename=None):
    """
    Stream a file for download with appropriate headers
    
    Args:
        file_obj: File object with a 'file' attribute (FileField)
        filename: Optional custom filename
    
    Returns:
        FileResponse for file download
    
    Raises:
        Http404: If file doesn't exist
    """
    if not file_obj or not hasattr(file_obj, 'file') or not file_obj.file:
        raise Http404("File not found")
    
    file_path = file_obj.file.path
    
    if not os.path.exists(file_path):
        logger.error(f"File not found at path: {file_path}")
        raise Http404("File not found on server")
    
    # Determine filename
    if not filename:
        filename = os.path.basename(file_obj.file.name)
        if hasattr(file_obj, 'file_name'):
            filename = file_obj.file_name
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(filename)
    if not content_type:
        content_type = 'application/octet-stream'
    
    # Open file and create response
    try:
        file_handle = open(file_path, 'rb')
        response = FileResponse(file_handle, content_type=content_type)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response['Content-Length'] = os.path.getsize(file_path)
        
        logger.info(f"Streaming file download: {filename}")
        return response
    except Exception as e:
        logger.error(f"Error streaming file: {str(e)}")
        raise Http404("Error reading file")


def format_file_size(size_bytes):
    """
    Format file size in human-readable format
    
    Args:
        size_bytes: Size in bytes (int or float)
    
    Returns:
        str: Formatted size (e.g., "2.4 MB", "150 KB")
    """
    if not size_bytes or size_bytes == 0:
        return "0 B"
    
    try:
        size_bytes = float(size_bytes)
    except (ValueError, TypeError):
        return "Unknown"
    
    # Define units
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    unit_index = 0
    
    while size_bytes >= 1024 and unit_index < len(units) - 1:
        size_bytes /= 1024
        unit_index += 1
    
    # Format with appropriate decimal places
    if size_bytes < 10:
        return f"{size_bytes:.2f} {units[unit_index]}"
    else:
        return f"{size_bytes:.1f} {units[unit_index]}"


def get_file_type_from_extension(filename):
    """
    Get file type category from filename extension
    
    Args:
        filename: Filename with extension
    
    Returns:
        str: File type category (pdf, image, document, other)
    """
    if not filename:
        return 'other'
    
    extension = os.path.splitext(filename)[1].lower()
    
    # Map extensions to categories
    type_map = {
        '.pdf': 'pdf',
        '.jpg': 'image',
        '.jpeg': 'image',
        '.png': 'image',
        '.gif': 'image',
        '.bmp': 'image',
        '.doc': 'document',
        '.docx': 'document',
        '.txt': 'document',
        '.rtf': 'document',
        '.xls': 'document',
        '.xlsx': 'document',
        '.csv': 'document',
        '.zip': 'archive',
        '.rar': 'archive',
        '.7z': 'archive'
    }
    
    return type_map.get(extension, 'other')


def sanitize_filename(filename):
    """
    Sanitize filename to prevent directory traversal and other security issues
    
    Args:
        filename: Original filename
    
    Returns:
        str: Sanitized filename
    """
    if not filename:
        return 'unnamed_file'
    
    # Remove directory separators and null bytes
    filename = filename.replace('/', '_').replace('\\', '_').replace('\0', '')
    
    # Remove leading dots to prevent hidden files
    while filename.startswith('.'):
        filename = filename[1:]
    
    # If filename is empty after sanitization, use default
    if not filename:
        filename = 'unnamed_file'
    
    return filename


def validate_file_access(file_obj, pet_id):
    """
    Validate that a file belongs to the specified pet
    
    Args:
        file_obj: File object
        pet_id: Pet ID to validate against
    
    Returns:
        bool: True if file belongs to pet, False otherwise
    """
    if not file_obj or not hasattr(file_obj, 'pet_id') and not hasattr(file_obj, 'pet'):
        return False
    
    # Check pet_id field
    if hasattr(file_obj, 'pet_id'):
        return str(file_obj.pet_id) == str(pet_id)
    
    # Check pet foreign key
    if hasattr(file_obj, 'pet'):
        return str(file_obj.pet.id) == str(pet_id)
    
    return False


# Placeholder for timezone import (should be at top of file)
from django.utils import timezone

