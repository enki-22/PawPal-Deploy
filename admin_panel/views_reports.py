"""
Admin Reports Views (Chunk 5)
Implements 3 comprehensive report management endpoints
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
import logging

from .permissions import require_any_admin
from .filters import filter_reports, validate_filter_params
from chatbot.models import SOAPReport
from pets.models import Pet

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_any_admin
def get_reports(request):
    """
    GET /api/admin/reports
    
    Get paginated list of SOAP reports with advanced filtering and search
    Permissions: MASTER, VET, DESK
    
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
    """
    try:
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
        queryset = SOAPReport.objects.select_related(
            'pet',
            'pet__owner'
        ).all()
        
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
        
        logger.info(
            f"Admin {request.admin.email} queried reports "
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


@api_view(['GET'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_any_admin
def get_report_by_case_id(request, case_id):
    """
    GET /api/admin/reports/:caseId
    
    Get specific SOAP report by case_id with complete details
    Permissions: MASTER, VET, DESK
    
    URL Parameters:
        case_id: Case ID (e.g., #PDX-2025-1101-001)
    
    Returns:
        success: True/False
        report: Complete SOAP report object with:
            - case_id
            - pet_info (id, name, species, breed, age, sex, weight, image)
            - owner_info (id, name, email, contact)
            - subjective (owner's description)
            - objective (symptoms, duration, image analysis)
            - assessment (AI diagnoses with likelihood, urgency)
            - plan (severity level, care advice)
            - flag_level
            - date_generated
            - date_flagged
    """
    try:
        # Remove # prefix if present for consistent lookup
        case_id_clean = case_id.strip()
        if not case_id_clean.startswith('#'):
            case_id_clean = f'#{case_id_clean}'
        
        # Get SOAP report with related data
        try:
            report = SOAPReport.objects.select_related(
                'pet',
                'pet__owner'
            ).get(case_id=case_id_clean)
        except SOAPReport.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Report not found',
                'case_id': case_id_clean
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Format pet info
        pet_info = {
            'id': report.pet.id,
            'name': report.pet.name,
            'species': report.pet.get_animal_type_display(),
            'breed': report.pet.breed or 'Unknown',
            'age': report.pet.age,
            'sex': report.pet.get_sex_display(),
            'weight': float(report.pet.weight) if report.pet.weight else None,
            'image': request.build_absolute_uri(report.pet.image.url) if report.pet.image else None,
            'medical_notes': report.pet.medical_notes
        }
        
        # Format owner info
        owner = report.pet.owner
        owner_info = {
            'id': owner.id,
            'name': f"{owner.first_name} {owner.last_name}".strip() or owner.username,
            'email': owner.email,
            'username': owner.username
        }
        
        # Build complete report response
        report_data = {
            'case_id': report.case_id,
            'pet_info': pet_info,
            'owner_info': owner_info,
            'subjective': report.subjective,
            'objective': report.objective,
            'assessment': report.assessment,
            'plan': report.plan,
            'flag_level': report.flag_level,
            'date_generated': report.date_generated.isoformat(),
            'date_flagged': report.date_flagged.isoformat() if report.date_flagged else None
        }
        
        logger.info(f"Admin {request.admin.email} viewed report {case_id_clean}")
        
        return Response({
            'success': True,
            'report': report_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get report by case_id error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch report',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_any_admin
def get_flagged_reports(request):
    """
    GET /api/admin/reports/flagged
    
    Get all flagged cases filtered by severity level
    Permissions: MASTER, VET, DESK
    
    Query Parameters:
        - filter: all | emergency | urgent | moderate (default: all)
    
    Returns:
        success: True/False
        filter: Applied filter
        count: Number of results
        reports: Array of flagged SOAP reports with full details
    
    Reports include:
        - case_id
        - pet_info (name, species, breed, age)
        - owner_info (name, email)
        - top_diagnosis (condition, likelihood, urgency)
        - flag_level
        - date_flagged
        - subjective (brief)
    """
    try:
        # Get filter parameter
        filter_param = request.query_params.get('filter', 'all').lower()
        
        # Validate filter
        valid_filters = ['all', 'emergency', 'urgent', 'moderate']
        if filter_param not in valid_filters:
            return Response({
                'success': False,
                'error': 'Invalid filter parameter',
                'valid_filters': valid_filters
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get queryset with related data
        queryset = SOAPReport.objects.select_related(
            'pet',
            'pet__owner'
        ).all()
        
        # Apply flag level filter
        if filter_param != 'all':
            queryset = queryset.filter(flag_level__iexact=filter_param)
        
        # Order by severity and date
        severity_order_case = """
            CASE flag_level
                WHEN 'Emergency' THEN 1
                WHEN 'Urgent' THEN 2
                WHEN 'Moderate' THEN 3
                ELSE 4
            END
        """
        queryset = queryset.extra(select={'severity_order': severity_order_case})
        queryset = queryset.order_by('severity_order', '-date_flagged')
        
        # Format results
        reports = []
        for report in queryset:
            # Get top diagnosis from assessment
            top_diagnosis = None
            if report.assessment and isinstance(report.assessment, list) and len(report.assessment) > 0:
                top = report.assessment[0]
                top_diagnosis = {
                    'condition': top.get('condition'),
                    'likelihood': top.get('likelihood'),
                    'urgency': top.get('urgency'),
                    'description': top.get('description')
                }
            
            reports.append({
                'case_id': report.case_id,
                'pet_info': {
                    'name': report.pet.name,
                    'species': report.pet.get_animal_type_display(),
                    'breed': report.pet.breed or 'Unknown',
                    'age': report.pet.age
                },
                'owner_info': {
                    'name': f"{report.pet.owner.first_name} {report.pet.owner.last_name}".strip() or report.pet.owner.username,
                    'email': report.pet.owner.email
                },
                'top_diagnosis': top_diagnosis,
                'flag_level': report.flag_level,
                'date_flagged': report.date_flagged.isoformat() if report.date_flagged else report.date_generated.isoformat(),
                'subjective': report.subjective[:200] + '...' if len(report.subjective) > 200 else report.subjective
            })
        
        logger.info(
            f"Admin {request.admin.email} queried flagged reports "
            f"(filter: {filter_param}, count: {len(reports)})"
        )
        
        return Response({
            'success': True,
            'filter': filter_param,
            'count': len(reports),
            'reports': reports
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Get flagged reports error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch flagged reports',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

