"""
Diagnosis and SOAP Report API Views
Implements Chunk 2: SOAP Report & Diagnosis Endpoints
Supports both Pet Owners and Admins via unified permission system
"""
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
import json


from .models import SOAPReport, Conversation, AIDiagnosis
from .serializers import (
    SOAPReportSerializer,
    SOAPReportListSerializer,
    DiagnosisGenerateSerializer
)
from .utils import (
    calculate_flag_level,
    generate_case_id,
    generate_care_advice,
    determine_severity_level_from_urgency,
    validate_symptoms_input,
    format_soap_report_response
)
from pets.models import Pet
from utils.unified_permissions import require_user_or_admin, filter_by_ownership

# Import filter utilities from admin_panel for report filtering
try:
    from admin_panel.filters import filter_reports, validate_filter_params
    FILTER_UTILS_AVAILABLE = True
except ImportError:
    FILTER_UTILS_AVAILABLE = False

import logging
logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_diagnosis(request):
    """
    POST /api/diagnosis/generate
    
    Generate a comprehensive SOAP report from symptoms and optional image
    
    Input:
        - pet_id (int): Pet ID
        - symptoms (list): List of symptom strings
        - duration (str, optional): Duration of symptoms
        - subjective (str, optional): Subjective description
        - chat_conversation_id (int, optional): Link to chat conversation
        - image (file, optional): Symptom image
    
    Returns:
        - case_id: Generated case ID
        - soap_report: Complete SOAP report object
    
    Status Codes:
        - 201: Successfully created
        - 400: Bad request (validation error)
        - 404: Pet not found
        - 500: Server error
    """
    try:
        # Validate input
        serializer = DiagnosisGenerateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'error': serializer.errors,
                'code': 'VALIDATION_ERROR'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        validated_data = serializer.validated_data
        
        # Get pet
        pet = get_object_or_404(Pet, id=validated_data['pet_id'], owner=request.user)
        
        # Get conversation if provided
        conversation = None
        if validated_data.get('chat_conversation_id'):
            try:
                conversation = Conversation.objects.get(
                    id=validated_data['chat_conversation_id'],
                    user=request.user
                )
            except Conversation.DoesNotExist:
                logger.warning(f"Conversation {validated_data['chat_conversation_id']} not found")
        
        symptoms = validated_data['symptoms']
        duration = validated_data.get('duration', '')
        subjective_text = validated_data.get('subjective', '')
        
        # If no subjective text provided, generate from symptoms
        if not subjective_text:
            subjective_text = f"Owner reports the following symptoms: {', '.join(symptoms)}."
            if duration:
                subjective_text += f" Duration: {duration}."
        
        # Call ML prediction endpoint (reuse existing predict_symptoms logic)
        # Build request data for ML prediction
        ml_request_data = {
            'symptoms': ', '.join(symptoms),
            'species': pet.animal_type,
            'pet_id': pet.id
        }
        
        # Create a temporary request object for ML prediction
        from rest_framework.request import Request
        from django.http import QueryDict
        
        temp_request = Request(request._request)
        temp_request._full_data = ml_request_data
        
        # Import and call existing ML prediction view
        from .views import predict_symptoms
        ml_response = predict_symptoms(temp_request)
        
        if ml_response.status_code != 200:
            return Response({
                'success': False,
                'error': 'ML prediction failed',
                'code': 'ML_PREDICTION_ERROR',
                'details': ml_response.data
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        ml_data = ml_response.data
        
        # Build assessment from ML predictions
        assessment = []
        for pred in ml_data.get('predictions', [])[:3]:  # Top 3 predictions
            assessment.append({
                'condition': pred.get('label', 'Unknown'),
                'likelihood': float(pred.get('confidence', 0.0)),
                'description': f"AI-predicted condition based on reported symptoms: {', '.join(symptoms)}",
                'matched_symptoms': symptoms,
                'urgency': determine_severity_level_from_urgency(
                    ml_data.get('urgency', 'routine')
                ),
                'contagious': False,  # Could be enhanced with a knowledge base
            })
        
        # Calculate flag level
        flag_level = calculate_flag_level(assessment, symptoms)
        
        # Determine severity level for plan
        severity_level = determine_severity_level_from_urgency(
            ml_data.get('urgency', 'routine')
        )
        
        # Ensure flag_level is at least as severe as severity_level
        if severity_level == 'Emergency' and flag_level != 'Emergency':
            flag_level = 'Emergency'
        elif severity_level == 'Urgent' and flag_level not in ['Emergency', 'Urgent']:
            flag_level = 'Urgent'
        
        # Generate care advice
        care_advice = generate_care_advice(severity_level, assessment)
        
        # Build objective data
        objective_data = {
            'symptoms': symptoms,
            'duration': duration,
            'image_analysis': ml_data.get('image_analysis'),
            'ml_confidence': ml_data.get('confidence_score', 0)
        }
        
        # Build plan
        plan_data = {
            'severityLevel': severity_level,
            'careAdvice': care_advice,
            'aiExplanation': ml_data.get('ai_explanation', ''),
            'recommendedActions': [
                'Follow the care advice provided above',
                'Keep detailed notes of any symptom changes',
                'Contact your veterinarian if condition worsens'
            ]
        }
        
        # Create SOAP report with transaction
        with transaction.atomic():
            # Generate unique case ID
            case_id = generate_case_id()
            
            # Create SOAP report
            soap_report = SOAPReport.objects.create(
                case_id=case_id,
                pet=pet,
                chat_conversation=conversation,
                subjective=subjective_text,
                objective=objective_data,
                assessment=assessment,
                plan=plan_data,
                flag_level=flag_level,
                date_flagged=timezone.now() if flag_level in ['Emergency', 'Urgent'] else None
            )
        
        # Serialize response
        serializer = SOAPReportSerializer(soap_report)
        
        return Response({
            'success': True,
            'case_id': soap_report.case_id,
            'soap_report': serializer.data,
            'message': f'SOAP report generated successfully with case ID: {case_id}'
        }, status=status.HTTP_201_CREATED)
        
    except Pet.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Pet not found or does not belong to you',
            'code': 'PET_NOT_FOUND'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error generating diagnosis: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'An error occurred while generating the diagnosis',
            'code': 'INTERNAL_ERROR',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def get_soap_report_by_case_id(request, case_id):
    """
    GET /api/diagnosis/soap/:caseId
    (CONSOLIDATED: Replaces both /api/diagnosis/soap/:caseId and /api/admin/reports/:caseId)
    """
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    try:
        # Clean case_id (remove # prefix if missing)
        case_id_clean = case_id.strip()
        if not case_id_clean.startswith('#'):
            case_id_clean = f'#{case_id_clean}'
        
        # Try to get SOAP report with # prefix first
        try:
            soap_report = SOAPReport.objects.get(case_id=case_id_clean)
        except SOAPReport.DoesNotExist:
            # Try without # prefix (in case it was created without it)
            case_id_no_hash = case_id_clean.lstrip('#')
            try:
                soap_report = SOAPReport.objects.get(case_id=case_id_no_hash)
            except SOAPReport.DoesNotExist:
                return Response({
                    'success': False,
                    'error': f'SOAP report with case ID {case_id} not found',
                    'code': 'NOT_FOUND'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Role-based access check
        if user_type == 'admin':
            pass
        else:  # pet_owner
            if soap_report.pet.owner != user_obj:
                return Response({
                    'success': False,
                    'error': 'You do not have permission to view this report',
                    'code': 'FORBIDDEN'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # --- NEW CODE START: FIX CLINICAL SUMMARY AND PLAN ---
        # 1. Parse Plan (Handle if it's a string vs dict)
        plan_data = soap_report.plan
        if isinstance(plan_data, str):
            try:
                plan_data = json.loads(plan_data)
            except:
                # If parsing fails, keep it as is or empty dict
                plan_data = {}

        # 2. Extract Clinical Summary (Priority 1: Inside Plan)
        clinical_summary = ""
        if isinstance(plan_data, dict):
            clinical_summary = plan_data.get('clinical_summary_backup') or \
                               plan_data.get('clinical_summary') or \
                               plan_data.get('summary') or \
                               plan_data.get('clinicalSummary')

        # 3. Fallback: Fetch directly from AIDiagnosis Table (Priority 2)
        if not clinical_summary:
            try:
                # Look up the AI Diagnosis record using the clean case ID
                ai_diag = AIDiagnosis.objects.filter(case_id=soap_report.case_id).first()
                if ai_diag and ai_diag.ai_explanation:
                    clinical_summary = ai_diag.ai_explanation
            except Exception as e:
                print(f"Error fetching fallback AI diagnosis: {e}")
        # --- NEW CODE END ---

        # Format response matching CHUNK2 spec format (YOUR EXISTING FORMATTING LOGIC)
        pet = soap_report.pet
        owner = pet.owner
        
        # Initialize owner details with "N/A" defaults
        owner_city = "N/A"
        owner_contact = "N/A"
        
        # Get owner name with fallback chain
        owner_name = f"{owner.first_name} {owner.last_name}".strip()
        if not owner_name:
            owner_name = owner.username or owner.email or "N/A"
        
        # Get owner profile for contact_number and city with robust fallbacks
        if hasattr(owner, 'profile'):
            owner_profile = owner.profile
            if owner_profile:
                if hasattr(owner_profile, 'city') and owner_profile.city:
                    owner_city = owner_profile.city
                if hasattr(owner_profile, 'phone_number') and owner_profile.phone_number:
                    owner_contact = owner_profile.phone_number
        
        if owner_contact == "N/A" and owner.email:
            owner_contact = owner.email
        
        # Get animal_type display value
        animal_type = getattr(pet, 'animal_type', 'Unknown')
        if hasattr(pet, 'get_animal_type_display'):
            try:
                animal_type = pet.get_animal_type_display()
            except:
                animal_type = str(animal_type)
        
        # Get sex display value
        sex = getattr(pet, 'sex', 'Unknown')
        if hasattr(pet, 'get_sex_display'):
            try:
                sex = pet.get_sex_display()
            except:
                sex = str(sex)
        
        # Parse medical_notes
        blood_type = None
        spayed_neutered = None
        allergies = None
        chronic_disease = None
        
        if pet.medical_notes:
            medical_notes_lines = pet.medical_notes.split('\n')
            for line in medical_notes_lines:
                line = line.strip()
                if not line: continue
                if 'blood type' in line.lower() and ':' in line:
                    blood_type = line.split(':', 1)[1].strip()
                if ('spayed' in line.lower() or 'neutered' in line.lower()) and ':' in line:
                    spayed_neutered = line.split(':', 1)[1].strip()
                if 'allergies' in line.lower() and ':' in line:
                    allergies = line.split(':', 1)[1].strip()
                if 'chronic' in line.lower() and ':' in line:
                    chronic_disease = line.split(':', 1)[1].strip()
        
        return Response({
            'success': True,
            'case_id': soap_report.case_id,
            'soap_report': {
                'case_id': soap_report.case_id,
                'pet': {
                    'id': pet.id,
                    'name': pet.name,
                    'animal_type': animal_type,
                    'breed': getattr(pet, 'breed', 'Unknown') or 'Unknown',
                    'age': getattr(pet, 'age', 'Unknown'),
                    'sex': sex,
                    'weight': float(pet.weight) if pet.weight else None,
                    'blood_type': blood_type,
                    'spayed_neutered': spayed_neutered,
                    'allergies': allergies,
                    'chronic_disease': chronic_disease
                },
                'owner': {
                    'id': owner.id,
                    'name': owner_name,
                    'email': owner.email,
                    'contact_number': owner_contact,
                    'city': owner_city
                },
                'subjective': soap_report.subjective,
                'objective': soap_report.objective,
                'assessment': soap_report.assessment,
                
                'plan': plan_data, # UPDATED: Use the parsed plan_data
                
                # --- NEW FIELD ADDED HERE ---
                'clinical_summary': clinical_summary or "No summary available.",
                # ----------------------------

                'flag_level': soap_report.flag_level,
                'date_generated': soap_report.date_generated.isoformat(),
                'date_flagged': soap_report.date_flagged.isoformat() if soap_report.date_flagged else None,
                'chat_conversation_id': soap_report.chat_conversation.id if soap_report.chat_conversation else None
            },
            'message': f'SOAP report retrieved successfully with case ID: {soap_report.case_id}'
        }, status=status.HTTP_200_OK)
        
    except SOAPReport.DoesNotExist:
        return Response({
            'success': False,
            'error': f'SOAP report with case ID {case_id} not found',
            'code': 'NOT_FOUND'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error retrieving SOAP report: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'An error occurred while retrieving the report',
            'code': 'INTERNAL_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_user_or_admin
def get_pet_diagnoses(request, pet_id):
    """
    GET /api/diagnosis/:petId
    (CONSOLIDATED: Replaces both /api/diagnosis/:petId and /api/admin/pets/:petId/diagnoses)
    
    Get all diagnoses (SOAP reports) for a specific pet
    Supports both Pet Owners and Admins with role-based access
    
    Args:
        pet_id (int): Pet ID
    
    Query Parameters:
        - limit (int, optional): Limit number of results (default: 50)
        - offset (int, optional): Offset for pagination (default: 0)
    
    Returns:
        Array of SOAP reports for the pet
    
    Status Codes:
        - 200: Success
        - 403: Forbidden (pet owner trying to access another's pet)
        - 404: Pet not found
    
    Permissions:
        - Admins: Can view diagnoses for any pet
        - Pet Owners: Can only view diagnoses for their own pets
    """
    try:
        # Get pet
        pet = get_object_or_404(Pet, id=pet_id)
        
        # Role-based access check
        if request.user_type == 'admin':
            # Admins can view any pet's diagnoses
            pass
        else:  # pet_owner
            # Pet owners can only view their own pet's diagnoses
            if pet.owner != request.user:
                return Response({
                    'success': False,
                    'error': 'You do not have permission to view this pet\'s diagnoses',
                    'code': 'FORBIDDEN'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Get query parameters for pagination
        try:
            limit = int(request.query_params.get('limit', 50))
            offset = int(request.query_params.get('offset', 0))
        except ValueError:
            return Response({
                'success': False,
                'error': 'Invalid pagination parameters',
                'code': 'INVALID_PARAMETERS'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get SOAP reports for this pet
        soap_reports = pet.soap_reports.all().order_by('-date_generated')
        
        # Get total count
        total_count = soap_reports.count()
        
        # Apply pagination
        soap_reports = soap_reports[offset:offset + limit]
        
        # Format based on user type
        if request.user_type == 'admin':
            # Admin format: summary version similar to admin endpoint
            diagnoses = []
            for report in soap_reports:
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
            
            return Response({
                'success': True,
                'diagnoses': diagnoses,
                'total_count': total_count
            }, status=status.HTTP_200_OK)
        else:
            # Pet owner format (existing format)
            serializer = SOAPReportListSerializer(soap_reports, many=True)
            return Response({
                'success': True,
                'data': serializer.data,
                'pagination': {
                    'total': total_count,
                    'limit': limit,
                    'offset': offset,
                    'count': len(serializer.data)
                },
                'pet': {
                    'id': pet.id,
                    'name': pet.name,
                    'animal_type': pet.animal_type,
                    'breed': pet.breed or 'Mixed Breed'
                }
            }, status=status.HTTP_200_OK)
        
    except Pet.DoesNotExist:
        return Response({
            'success': False,
            'error': f'Pet with ID {pet_id} not found',
            'code': 'PET_NOT_FOUND'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error retrieving pet diagnoses: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'An error occurred while retrieving diagnoses',
            'code': 'INTERNAL_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_user_or_admin
def get_flagged_cases(request, pet_id=None):
    """
    GET /api/diagnosis/flagged/:petId? (pet_id optional for admins)
    (CONSOLIDATED: Replaces /api/diagnosis/flagged/:petId and /api/admin/reports/flagged)
    
    Get flagged SOAP reports
    Supports both Pet Owners and Admins with role-based access
    
    Args:
        pet_id (int, optional): Pet ID. Required for pet owners, optional for admins.
                                If omitted by admin, returns all flagged cases.
    
    Query Parameters:
        - flag_level (str, optional): Filter by specific flag level
          Options: 'Emergency', 'Urgent', 'Moderate'
          For pet owners: Default returns Emergency and Urgent
          For admins: Default returns all flagged levels
        - filter (str, optional): Admin-only alias for flag_level
          Options: 'all', 'emergency', 'urgent', 'moderate'
    
    Returns:
        Array of flagged SOAP reports
    
    Status Codes:
        - 200: Success
        - 403: Forbidden (pet owner trying to access another's pet)
        - 404: Pet not found
    
    Permissions:
        - Admins: Can view flagged cases for any pet, or all flagged cases if pet_id omitted
        - Pet Owners: Must provide pet_id for their own pet, sees only their flagged cases
    """
    try:
        # Get flag level filter (support both 'flag_level' and 'filter' for admin compatibility)
        flag_level_filter = request.query_params.get('flag_level', '').strip() or \
                           request.query_params.get('filter', '').strip()
        
        # Normalize filter value for admin format
        if flag_level_filter.lower() == 'all':
            flag_level_filter = ''
        
        if request.user_type == 'admin':
            # Admin: can view all flagged cases or filter by pet
            if pet_id:
                # Admin viewing specific pet's flagged cases
                pet = get_object_or_404(Pet, id=pet_id)
                if flag_level_filter and flag_level_filter.lower() in ['emergency', 'urgent', 'moderate']:
                    flag_level_filter = flag_level_filter.capitalize()
                    soap_reports = SOAPReport.objects.filter(
                        pet=pet,
                        flag_level=flag_level_filter
                    ).select_related('pet', 'pet__owner').order_by('-date_flagged', '-date_generated')
                else:
                    # All flagged for this pet
                    soap_reports = SOAPReport.objects.filter(
                        pet=pet,
                        flag_level__in=['Emergency', 'Urgent', 'Moderate']
                    ).select_related('pet', 'pet__owner').order_by('-date_flagged', '-date_generated')
            else:
                # Admin viewing all flagged cases across all pets
                if flag_level_filter and flag_level_filter.lower() in ['emergency', 'urgent', 'moderate']:
                    flag_level_filter = flag_level_filter.capitalize()
                    soap_reports = SOAPReport.objects.filter(
                        flag_level=flag_level_filter
                    ).select_related('pet', 'pet__owner')
                else:
                    # All flagged
                    soap_reports = SOAPReport.objects.filter(
                        flag_level__in=['Emergency', 'Urgent', 'Moderate']
                    ).select_related('pet', 'pet__owner')
                
                # Order by severity and date
                from django.db.models import Case, When, IntegerField
                soap_reports = soap_reports.annotate(
                    severity_order=Case(
                        When(flag_level='Emergency', then=1),
                        When(flag_level='Urgent', then=2),
                        When(flag_level='Moderate', then=3),
                        default=4,
                        output_field=IntegerField()
                    )
                ).order_by('severity_order', '-date_flagged')
            
            # Format for admin (similar to admin endpoint)
            reports = []
            for report in soap_reports:
                top_diagnosis = None
                if report.assessment and isinstance(report.assessment, list) and len(report.assessment) > 0:
                    top = report.assessment[0]
                    top_diagnosis = {
                        'condition': top.get('condition'),
                        'likelihood': top.get('likelihood'),
                        'urgency': top.get('urgency'),
                        'description': top.get('description')
                    }
                
                owner_name = f"{report.pet.owner.first_name} {report.pet.owner.last_name}".strip() or report.pet.owner.username
                
                reports.append({
                    'case_id': report.case_id,
                    'pet_info': {
                        'name': report.pet.name,
                        'species': report.pet.get_animal_type_display(),
                        'breed': report.pet.breed or 'Unknown',
                        'age': report.pet.age
                    },
                    'owner_info': {
                        'name': owner_name,
                        'email': report.pet.owner.email
                    },
                    'top_diagnosis': top_diagnosis,
                    'flag_level': report.flag_level,
                    'date_flagged': report.date_flagged.isoformat() if report.date_flagged else report.date_generated.isoformat(),
                    'subjective': report.subjective[:200] + '...' if len(report.subjective) > 200 else report.subjective
                })
            
            applied_filter = flag_level_filter.lower() if flag_level_filter else 'all'
            return Response({
                'success': True,
                'filter': applied_filter,
                'count': len(reports),
                'reports': reports
            }, status=status.HTTP_200_OK)
            
        else:  # pet_owner
            # Pet owner: must provide pet_id
            if not pet_id:
                return Response({
                    'success': False,
                    'error': 'Pet ID is required',
                    'code': 'PET_ID_REQUIRED'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get pet and verify ownership
            pet = get_object_or_404(Pet, id=pet_id)
            
            if pet.owner != request.user:
                return Response({
                    'success': False,
                    'error': 'You do not have permission to view this pet\'s diagnoses',
                    'code': 'FORBIDDEN'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Base query - get flagged cases for this pet
            if flag_level_filter and flag_level_filter in ['Emergency', 'Urgent', 'Moderate']:
                soap_reports = pet.soap_reports.filter(
                    flag_level=flag_level_filter
                ).order_by('-date_flagged', '-date_generated')
            else:
                # Default: Get Emergency and Urgent cases
                soap_reports = pet.soap_reports.filter(
                    flag_level__in=['Emergency', 'Urgent']
                ).order_by('-date_flagged', '-date_generated')
            
            # Serialize for pet owner
            serializer = SOAPReportListSerializer(soap_reports, many=True)
            
            return Response({
                'success': True,
                'data': serializer.data,
                'count': soap_reports.count(),
                'filter_applied': flag_level_filter if flag_level_filter else 'Emergency, Urgent',
                'pet': {
                    'id': pet.id,
                    'name': pet.name,
                    'animal_type': pet.animal_type,
                    'breed': pet.breed or 'Mixed Breed'
                }
            }, status=status.HTTP_200_OK)
        
    except Pet.DoesNotExist:
        return Response({
            'success': False,
            'error': f'Pet with ID {pet_id} not found',
            'code': 'PET_NOT_FOUND'
        }, status=status.HTTP_404_NOT_FOUND)
    
    except Exception as e:
        logger.error(f"Error retrieving flagged cases: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'An error occurred while retrieving flagged cases',
            'code': 'INTERNAL_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@require_user_or_admin
def get_all_reports(request):
    """
    GET /api/diagnosis/reports
    (CONSOLIDATED: Replaces /api/admin/reports - now supports both Pet Owners and Admins)
    
    Get paginated list of SOAP reports with advanced filtering and search
    Supports both Pet Owners and Admins with role-based access
    
    Query Parameters:
        - search: Search in pet name, owner name, case ID
        - dateRange: today | last_7_days | last_30_days | custom | all_time (default: all_time)
        - custom_start: Start date for custom range (YYYY-MM-DD)
        - custom_end: End date for custom range (YYYY-MM-DD)
        - species: all | dogs | cats | birds | rabbits | others (default: all)
        - flagLevel: all | emergency | urgent | moderate (default: all)
        - page: Page number (default: 1)
        - limit: Items per page (default: 10, max: 100)
    
    Returns:
        success: True/False
        results: Array of report summaries
        pagination: Pagination information
        filters: Applied filters for reference
    
    Permissions:
        - Admins: Can view all SOAP reports with full filtering
        - Pet Owners: Can only view their own reports (automatically filtered)
    """
    try:
        if not FILTER_UTILS_AVAILABLE:
            return Response({
                'success': False,
                'error': 'Filter utilities not available',
                'code': 'FEATURE_UNAVAILABLE'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Get query parameters
        params = {
            'search': request.query_params.get('search', ''),
            'dateRange': request.query_params.get('dateRange', 'all_time'),
            'custom_start': request.query_params.get('custom_start'),
            'custom_end': request.query_params.get('custom_end'),
            'species': request.query_params.get('species', 'all'),
            'flagLevel': request.query_params.get('flagLevel', 'all'),
            'page': request.query_params.get('page', 1),
            'limit': request.query_params.get('limit', 10)
        }
        
        # Validate parameters
        is_valid, error_message = validate_filter_params(params)
        if not is_valid:
            return Response({
                'success': False,
                'error': 'Invalid filter parameters',
                'details': error_message
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get base queryset with related data for optimization
        # Apply ownership filter for pet owners
        if request.user_type == 'admin':
            queryset = SOAPReport.objects.select_related(
                'pet',
                'pet__owner'
            ).all()
        else:  # pet_owner
            # Pet owners only see their own reports
            queryset = SOAPReport.objects.select_related(
                'pet',
                'pet__owner'
            ).filter(pet__owner=request.user)
        
        # Apply filters and pagination
        filtered_queryset, pagination_info, applied_filters = filter_reports(
            queryset,
            params
        )
        
        # Format results
        results = []
        for report in filtered_queryset:
            results.append({
                'case_id': report.case_id,
                'pet_name': report.pet.name,
                'species': report.pet.get_animal_type_display(),
                'breed': report.pet.breed or 'Unknown',
                'owner_name': f"{report.pet.owner.first_name} {report.pet.owner.last_name}".strip() or report.pet.owner.username,
                'date_generated': report.date_generated.isoformat(),
                'flag_level': report.flag_level
            })
        
        user_identifier = f"{request.admin.email}" if request.user_type == 'admin' else f"{request.user.email}"
        logger.info(
            f"{'Admin' if request.user_type == 'admin' else 'User'} {user_identifier} queried reports "
            f"(page {pagination_info['page']}, filters: {applied_filters})"
        )
        
        return Response({
            'success': True,
            'results': results,
            'pagination': pagination_info,
            'filters': applied_filters
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get reports error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch reports',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

