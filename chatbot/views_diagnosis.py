"""
Diagnosis and SOAP Report API Views
Implements Chunk 2: SOAP Report & Diagnosis Endpoints
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone

from .models import SOAPReport, Conversation
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
@permission_classes([IsAuthenticated])
def get_soap_report_by_case_id(request, case_id):
    """
    GET /api/diagnosis/soap/:caseId
    
    Retrieve complete SOAP report by case ID
    Includes pet info, owner info, and all SOAP sections
    
    Args:
        case_id (str): Case ID in format #PDX-YYYY-MMDD-XXX
    
    Returns:
        Complete SOAP report object
    
    Status Codes:
        - 200: Success
        - 403: Forbidden (not owner)
        - 404: Not found
    """
    try:
        # Get SOAP report
        soap_report = get_object_or_404(SOAPReport, case_id=case_id)
        
        # Check ownership
        if soap_report.pet.owner != request.user:
            return Response({
                'success': False,
                'error': 'You do not have permission to view this report',
                'code': 'FORBIDDEN'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Serialize and return
        serializer = SOAPReportSerializer(soap_report)
        
        return Response({
            'success': True,
            'data': serializer.data
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
@permission_classes([IsAuthenticated])
def get_pet_diagnoses(request, pet_id):
    """
    GET /api/diagnosis/:petId
    
    Get all diagnoses (SOAP reports) for a specific pet
    Ordered by date_generated DESC (most recent first)
    
    Args:
        pet_id (int): Pet ID
    
    Query Parameters:
        - limit (int, optional): Limit number of results (default: 50)
        - offset (int, optional): Offset for pagination (default: 0)
    
    Returns:
        Array of SOAP reports for the pet
    
    Status Codes:
        - 200: Success
        - 403: Forbidden (not owner)
        - 404: Pet not found
    """
    try:
        # Get pet and verify ownership
        pet = get_object_or_404(Pet, id=pet_id)
        
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
        
        # Serialize
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
@permission_classes([IsAuthenticated])
def get_flagged_cases_for_pet(request, pet_id):
    """
    GET /api/diagnosis/flagged/:petId
    
    Get only flagged cases for a specific pet
    Filters by flag_level (Emergency, Urgent, Moderate)
    
    Args:
        pet_id (int): Pet ID
    
    Query Parameters:
        - flag_level (str, optional): Filter by specific flag level
          Options: 'Emergency', 'Urgent', 'Moderate'
          Default: Returns all flagged (Emergency and Urgent)
    
    Returns:
        Array of flagged SOAP reports
    
    Status Codes:
        - 200: Success
        - 403: Forbidden (not owner)
        - 404: Pet not found
    """
    try:
        # Get pet and verify ownership
        pet = get_object_or_404(Pet, id=pet_id)
        
        if pet.owner != request.user:
            return Response({
                'success': False,
                'error': 'You do not have permission to view this pet\'s diagnoses',
                'code': 'FORBIDDEN'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get flag level filter
        flag_level_filter = request.query_params.get('flag_level', '').strip()
        
        # Base query - get flagged cases
        if flag_level_filter and flag_level_filter in ['Emergency', 'Urgent', 'Moderate']:
            # Filter by specific flag level
            soap_reports = pet.soap_reports.filter(
                flag_level=flag_level_filter
            ).order_by('-date_flagged', '-date_generated')
        else:
            # Default: Get Emergency and Urgent cases
            soap_reports = pet.soap_reports.filter(
                flag_level__in=['Emergency', 'Urgent']
            ).order_by('-date_flagged', '-date_generated')
        
        # Serialize
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

