"""
Admin Pet Management Views (Chunk 7)
Implements 10 comprehensive pet management endpoints
"""
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Count, Prefetch
from django.http import HttpResponse, FileResponse, Http404
import logging

from .permissions import require_any_admin
from .pet_filters import filter_pets, validate_pet_filter_params, get_vaccination_status
from .file_utils import create_medical_files_zip, stream_file_download, format_file_size, get_file_type_from_extension

from pets.models import Pet
from chatbot.models import Conversation, Message, SOAPReport
from users.models import UserProfile

logger = logging.getLogger(__name__)


@api_view(['GET'])
@require_any_admin
def get_pets(request):
    """
    GET /api/admin/pets
    
    Get paginated list of pets with search and filtering
    Permissions: MASTER, VET, DESK
    
    Query Parameters:
        - search: Search in pet name, owner name, pet ID
        - species: all | dogs | cats | birds | rabbits | others
        - status: all | active | inactive | deceased
        - page: Page number (default: 1)
        - limit: Items per page (default: 10, max: 100)
    
    Returns:
        success: True/False
        results: Array of pet summaries
        pagination: Pagination information
        filters: Applied filters
    """
    try:
        # Get query parameters
        params = {
            'search': request.query_params.get('search', ''),
            'species': request.query_params.get('species', 'all'),
            'status': request.query_params.get('status', 'all'),
            'page': request.query_params.get('page', 1),
            'limit': request.query_params.get('limit', 10)
        }
        
        # Validate parameters
        is_valid, error_message = validate_pet_filter_params(params)
        if not is_valid:
            return Response({
                'success': False,
                'error': 'Invalid filter parameters',
                'details': error_message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get base queryset
        queryset = Pet.objects.select_related('owner').all()
        
        # Apply filters and pagination
        filtered_queryset, pagination_info, applied_filters = filter_pets(
            queryset,
            params
        )
        
        # Format results
        results = []
        for pet in filtered_queryset:
            owner_name = f"{pet.owner.first_name} {pet.owner.last_name}".strip() or pet.owner.username
            
            results.append({
                'pet_id': f"RP-{str(pet.id).zfill(6)}",
                'name': pet.name,
                'species': pet.get_animal_type_display(),
                'breed': pet.breed or 'Unknown',
                'owner_name': owner_name,
                'status': 'Active',  # Placeholder as Pet model doesn't have status
                'photo': request.build_absolute_uri(pet.image.url) if pet.image else None,
                'registered_date': pet.created_at.isoformat()
            })
        
        logger.info(
            f"Admin {request.admin.email} queried pets "
            f"(page {pagination_info['page']}, filters: {applied_filters})"
        )
        
        return Response({
            'success': True,
            'results': results,
            'pagination': pagination_info,
            'filters': applied_filters
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get pets error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch pets',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_any_admin
def get_pet_detail(request, pet_id):
    """
    GET /api/admin/pets/:petId
    
    Get complete pet medical record data
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        pet_id: Pet ID (integer)
    
    Returns:
        success: True/False
        pet: Complete pet object with medical information
    """
    try:
        # Get pet with related data
        try:
            pet = Pet.objects.select_related('owner').get(id=pet_id)
        except Pet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pet not found',
                'pet_id': pet_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get owner information
        owner_name = f"{pet.owner.first_name} {pet.owner.last_name}".strip() or pet.owner.username
        owner_profile = getattr(pet.owner, 'profile', None)
        owner_contact = owner_profile.phone_number if owner_profile and hasattr(owner_profile, 'phone_number') else 'N/A'
        
        # Build pet data
        pet_data = {
            'pet_id': f"RP-{str(pet.id).zfill(6)}",
            'name': pet.name,
            'species': pet.get_animal_type_display(),
            'breed': pet.breed or 'Unknown',
            'sex': pet.get_sex_display(),
            'age': f"{pet.age} years old",
            'blood_type': None,  # Placeholder - not in current Pet model
            'spayed_neutered': None,  # Placeholder - not in current Pet model
            'allergies': None,  # Placeholder - can be added to medical_notes
            'chronic_disease': None,  # Placeholder - can be added to medical_notes
            'photo': request.build_absolute_uri(pet.image.url) if pet.image else None,
            'owner': {
                'name': owner_name,
                'contact': owner_contact
            },
            'registered_date': pet.created_at.isoformat(),
            'medical_notes': pet.medical_notes
        }
        
        logger.info(f"Admin {request.admin.email} viewed pet {pet_id}")
        
        return Response({
            'success': True,
            'pet': pet_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get pet detail error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch pet details',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_any_admin
def get_pet_medical_records(request, pet_id):
    """
    GET /api/admin/pets/:petId/medical-records
    
    Get medical records for a pet with optional filtering
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        pet_id: Pet ID (integer)
    
    Query Parameters:
        serviceType: all | checkup | laboratory | vaccination | surgery
    
    Returns:
        success: True/False
        records: Array of medical records
    
    Note: This is a placeholder implementation as MedicalRecord model doesn't exist yet.
    """
    try:
        # Verify pet exists
        try:
            pet = Pet.objects.get(id=pet_id)
        except Pet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pet not found',
                'pet_id': pet_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        service_type = request.query_params.get('serviceType', 'all')
        
        # Placeholder response - will be implemented when MedicalRecord model is created
        records = []
        
        # For now, return medical_notes as a placeholder
        if pet.medical_notes:
            records.append({
                'service_type': 'General',
                'veterinarian': 'N/A',
                'date': pet.created_at.isoformat(),
                'notes': pet.medical_notes
            })
        
        logger.info(f"Admin {request.admin.email} viewed medical records for pet {pet_id}")
        
        return Response({
            'success': True,
            'records': records,
            'message': 'Medical records feature coming soon. MedicalRecord model needs to be implemented.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get medical records error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch medical records',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_any_admin
def get_pet_vaccinations(request, pet_id):
    """
    GET /api/admin/pets/:petId/vaccinations
    
    Get vaccination records for a pet
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        pet_id: Pet ID (integer)
    
    Returns:
        success: True/False
        vaccinations: Array of vaccination records
    
    Note: This is a placeholder implementation as Vaccination model doesn't exist yet.
    """
    try:
        # Verify pet exists
        try:
            pet = Pet.objects.get(id=pet_id)
        except Pet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pet not found',
                'pet_id': pet_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Placeholder response - will be implemented when Vaccination model is created
        vaccinations = []
        
        logger.info(f"Admin {request.admin.email} viewed vaccinations for pet {pet_id}")
        
        return Response({
            'success': True,
            'vaccinations': vaccinations,
            'message': 'Vaccination records feature coming soon. Vaccination model needs to be implemented.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get vaccinations error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch vaccinations',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_any_admin
def get_pet_diagnoses(request, pet_id):
    """
    GET /api/admin/pets/:petId/diagnoses
    
    Get AI diagnosis history for a pet (SOAP reports)
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        pet_id: Pet ID (integer)
    
    Returns:
        success: True/False
        diagnoses: Array of SOAP reports (summary version)
    """
    try:
        # Verify pet exists
        try:
            pet = Pet.objects.get(id=pet_id)
        except Pet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pet not found',
                'pet_id': pet_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get SOAP reports for this pet
        soap_reports = SOAPReport.objects.filter(pet=pet).order_by('-date_generated')
        
        # Format diagnoses
        diagnoses = []
        for report in soap_reports:
            # Extract main condition from assessment
            main_condition = None
            likelihood = None
            urgency = None
            
            if report.assessment and isinstance(report.assessment, list) and len(report.assessment) > 0:
                main_condition = report.assessment[0].get('condition')
                likelihood = report.assessment[0].get('likelihood')
                urgency = report.assessment[0].get('urgency')
            
            diagnoses.append({
                'case_id': report.case_id,
                'date_generated': report.date_generated.isoformat(),
                'flag_level': report.flag_level,
                'main_condition': main_condition,
                'likelihood': likelihood,
                'urgency': urgency,
                'subjective_snippet': (report.subjective[:100] + '...') if len(report.subjective) > 100 else report.subjective
            })
        
        logger.info(f"Admin {request.admin.email} viewed diagnoses for pet {pet_id}")
        
        return Response({
            'success': True,
            'diagnoses': diagnoses,
            'total_count': len(diagnoses)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get diagnoses error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch diagnoses',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_any_admin
def get_pet_chat_history(request, pet_id):
    """
    GET /api/admin/pets/:petId/chat-history
    
    Get list of chatbot conversations for a pet
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        pet_id: Pet ID (integer)
    
    Returns:
        success: True/False
        chats: Array of conversation summaries
    """
    try:
        # Verify pet exists
        try:
            pet = Pet.objects.get(id=pet_id)
        except Pet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pet not found',
                'pet_id': pet_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get conversations for this pet
        conversations = Conversation.objects.filter(
            pet=pet
        ).prefetch_related('messages', 'soap_reports').order_by('-created_at')
        
        # Format chat history
        chats = []
        for conv in conversations:
            # Get first user message as preview
            preview = ""
            first_message = conv.messages.filter(is_user=True).first()
            if first_message:
                preview = first_message.content[:100]
            
            # Check if conversation has diagnosis
            has_diagnosis = conv.soap_reports.exists()
            
            chats.append({
                'chat_id': str(conv.id),
                'title': conv.title,
                'date': conv.created_at.isoformat(),
                'preview': preview,
                'has_diagnosis': has_diagnosis
            })
        
        logger.info(f"Admin {request.admin.email} viewed chat history for pet {pet_id}")
        
        return Response({
            'success': True,
            'chats': chats,
            'total_count': len(chats)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get chat history error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch chat history',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_any_admin
def get_pet_chat_detail(request, pet_id, chat_id):
    """
    GET /api/admin/pets/:petId/chat/:chatId
    
    Get complete chat conversation
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        pet_id: Pet ID (integer)
        chat_id: Conversation ID (integer or UUID)
    
    Returns:
        success: True/False
        chat: Complete conversation object with messages
    """
    try:
        # Verify pet exists
        try:
            pet = Pet.objects.get(id=pet_id)
        except Pet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pet not found',
                'pet_id': pet_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get conversation
        try:
            conversation = Conversation.objects.prefetch_related('messages', 'soap_reports').get(
                id=chat_id,
                pet=pet
            )
        except Conversation.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Chat conversation not found',
                'chat_id': chat_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Format messages
        messages = []
        for msg in conversation.messages.all():
            messages.append({
                'sender': 'user' if msg.is_user else 'bot',
                'message': msg.content,
                'timestamp': msg.created_at.isoformat()
            })
        
        # Get associated diagnosis case_id if exists
        diagnosis_case_id = None
        soap_report = conversation.soap_reports.first()
        if soap_report:
            diagnosis_case_id = soap_report.case_id
        
        # Get owner name
        owner_name = f"{pet.owner.first_name} {pet.owner.last_name}".strip() or pet.owner.username
        
        chat_data = {
            'chat_id': str(conversation.id),
            'pet_id': f"RP-{str(pet.id).zfill(6)}",
            'owner_name': owner_name,
            'date': conversation.created_at.isoformat(),
            'messages': messages,
            'diagnosis_case_id': diagnosis_case_id
        }
        
        logger.info(f"Admin {request.admin.email} viewed chat {chat_id} for pet {pet_id}")
        
        return Response({
            'success': True,
            'chat': chat_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get chat detail error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch chat details',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_any_admin
def get_pet_files(request, pet_id):
    """
    GET /api/admin/pets/:petId/files
    
    Get list of downloadable medical files for a pet
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        pet_id: Pet ID (integer)
    
    Returns:
        success: True/False
        files: Array of file objects
    
    Note: This is a placeholder implementation as MedicalFile model doesn't exist yet.
    """
    try:
        # Verify pet exists
        try:
            pet = Pet.objects.get(id=pet_id)
        except Pet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pet not found',
                'pet_id': pet_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Placeholder response - will be implemented when MedicalFile model is created
        files = []
        
        logger.info(f"Admin {request.admin.email} viewed files for pet {pet_id}")
        
        return Response({
            'success': True,
            'files': files,
            'total_count': 0,
            'message': 'Medical files feature coming soon. MedicalFile model needs to be implemented.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get files error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch files',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_any_admin
def download_pet_file(request, pet_id, file_id):
    """
    GET /api/admin/pets/:petId/files/:fileId/download
    
    Stream file for download
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        pet_id: Pet ID (integer)
        file_id: File ID (UUID)
    
    Returns:
        File stream with appropriate headers
    
    Note: This is a placeholder implementation as MedicalFile model doesn't exist yet.
    """
    try:
        # Verify pet exists
        try:
            pet = Pet.objects.get(id=pet_id)
        except Pet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pet not found',
                'pet_id': pet_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Placeholder response
        logger.info(f"Admin {request.admin.email} attempted to download file {file_id} for pet {pet_id}")
        
        return Response({
            'success': False,
            'error': 'File download feature coming soon',
            'message': 'MedicalFile model needs to be implemented.'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)
        
    except Exception as e:
        logger.error(f"Download file error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to download file',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_any_admin
def download_all_pet_files(request, pet_id):
    """
    GET /api/admin/pets/:petId/files/download-all
    
    Create temporary ZIP file with all medical files and download
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        pet_id: Pet ID (integer)
    
    Returns:
        ZIP file stream
    
    Note: This is a placeholder implementation as MedicalFile model doesn't exist yet.
    """
    try:
        # Verify pet exists
        try:
            pet = Pet.objects.get(id=pet_id)
        except Pet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pet not found',
                'pet_id': pet_id
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Placeholder response
        logger.info(f"Admin {request.admin.email} attempted to download all files for pet {pet_id}")
        
        return Response({
            'success': False,
            'error': 'Bulk file download feature coming soon',
            'message': 'MedicalFile model needs to be implemented.'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)
        
    except Exception as e:
        logger.error(f"Download all files error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to download files',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

