"""
Admin Dashboard Views (Chunk 4) - FIXED AUTHENTICATION
Implements 6 dashboard endpoints with role-based permissions
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta
import logging

from .permissions import require_any_admin
from .jwt_utils import verify_admin_jwt, extract_token_from_header
from .models import Admin, Announcement
from chatbot.models import User, Conversation, SOAPReport
from pets.models import Pet

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([AllowAny])  # Handle auth manually for debugging
def dashboard_stats(request):
    """
    GET /api/admin/dashboard/stats
    
    Return dashboard statistics with optional filters
    Permissions: MASTER, VET, DESK
    
    Query Parameters:
        - reports_filter: last_7_days | last_30_days | all_time (default: all_time)
        - conversations_filter: this_week | this_month | all_time (default: all_time)
    
    Returns:
        success: True/False
        data:
            total_users: Total registered users
            total_pets: Total registered pets
            total_reports: Total SOAP reports (with filter)
            total_conversations: Total conversations (with filter)
    """
    try:
        # FIXED: Manual authentication check for debugging
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = extract_token_from_header(auth_header)
        
        if not token:
            logger.error("No token provided in dashboard_stats")
            return Response({
                'success': False,
                'error': 'Authentication required',
                'code': 'AUTH_REQUIRED'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Verify token
        payload, error = verify_admin_jwt(token)
        
        if error or not payload:
            logger.error(f"Token verification failed in dashboard_stats: {error}")
            return Response({
                'success': False,
                'error': error or 'Invalid token',
                'code': 'INVALID_TOKEN'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check admin exists and is active
        try:
            admin = Admin.objects.get(id=payload['admin_id'], is_active=True)
        except Admin.DoesNotExist:
            logger.error(f"Admin not found: {payload.get('admin_id')}")
            return Response({
                'success': False,
                'error': 'Admin not found or inactive',
                'code': 'ADMIN_NOT_FOUND'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Attach admin to request
        request.admin = admin
        # Get filter parameters
        reports_filter = request.query_params.get('reports_filter', 'all_time')
        conversations_filter = request.query_params.get('conversations_filter', 'all_time')
        
        today = timezone.now().date()
        
        # Total users and pets (no filter)
        total_users = User.objects.count()
        total_pets = Pet.objects.count()
        
        # Total SOAP reports with filter
        reports_queryset = SOAPReport.objects.all()
        
        if reports_filter == 'last_7_days':
            seven_days_ago = today - timedelta(days=7)
            reports_queryset = reports_queryset.filter(
                date_generated__date__gte=seven_days_ago
            )
        elif reports_filter == 'last_30_days':
            thirty_days_ago = today - timedelta(days=30)
            reports_queryset = reports_queryset.filter(
                date_generated__date__gte=thirty_days_ago
            )
        # else: all_time (no filter)
        
        total_reports = reports_queryset.count()
        
        # Total conversations with filter
        conversations_queryset = Conversation.objects.all()
        
        if conversations_filter == 'this_week':
            week_start = today - timedelta(days=today.weekday())
            conversations_queryset = conversations_queryset.filter(
                created_at__date__gte=week_start
            )
        elif conversations_filter == 'this_month':
            month_start = today.replace(day=1)
            conversations_queryset = conversations_queryset.filter(
                created_at__date__gte=month_start
            )
        # else: all_time (no filter)
        
        total_conversations = conversations_queryset.count()
        
        data = {
            'total_users': total_users,
            'total_pets': total_pets,
            'total_reports': total_reports,
            'total_conversations': total_conversations,
            'filters_applied': {
                'reports_filter': reports_filter,
                'conversations_filter': conversations_filter
            }
        }
        
        logger.info(f"Admin {request.admin.email} accessed dashboard stats")
        
        return Response({
            'success': True,
            'data': data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch dashboard statistics',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # Handle auth manually
def recent_pets(request):
    """
    GET /api/admin/dashboard/recent-pets
    
    Return last 5 registered pets
    Permissions: MASTER, VET, DESK
    
    Returns:
        success: True/False
        data: Array of recent pets with:
            - pet_name
            - species (animal_type)
            - breed
            - owner_name
            - registration_date
    """
    try:
        # Manual authentication check
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = extract_token_from_header(auth_header)
        
        if not token:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        payload, error = verify_admin_jwt(token)
        if error or not payload:
            return Response({
                'success': False,
                'error': error or 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            admin = Admin.objects.get(id=payload['admin_id'], is_active=True)
            request.admin = admin
        except Admin.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Admin not found'
            }, status=status.HTTP_401_UNAUTHORIZED)
        # Get last 5 registered pets
        pets = Pet.objects.select_related('owner').order_by('-created_at')[:5]
        
        pets_data = []
        for pet in pets:
            pets_data.append({
                'pet_name': pet.name,
                'species': pet.get_animal_type_display(),  # Get display name
                'breed': pet.breed or 'Unknown',
                'owner_name': f"{pet.owner.first_name} {pet.owner.last_name}".strip() or pet.owner.username,
                'registration_date': pet.created_at.isoformat()
            })
        
        logger.info(f"Admin {request.admin.email} accessed recent pets")
        
        return Response({
            'success': True,
            'data': pets_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Recent pets error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch recent pets',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # Handle auth manually
def flagged_cases(request):
    """
    GET /api/admin/dashboard/flagged-cases?filter=all|emergency|urgent|moderate
    
    Get SOAP reports filtered by flag_level
    Permissions: MASTER, VET, DESK
    
    Query Parameters:
        - filter: all | emergency | urgent | moderate (default: all)
    
    Returns:
        success: True/False
        data: Array of flagged cases with:
            - case_id
            - pet_name
            - species
            - condition (top diagnosis)
            - likelihood
            - urgency
            - owner_name
            - date_flagged
            - flag_level
    
    Ordering: Emergency > Urgent > Moderate, then date_flagged DESC
    """
    try:
        # Manual authentication check
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = extract_token_from_header(auth_header)
        
        if not token:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        payload, error = verify_admin_jwt(token)
        if error or not payload:
            return Response({
                'success': False,
                'error': error or 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            admin = Admin.objects.get(id=payload['admin_id'], is_active=True)
            request.admin = admin
        except Admin.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Admin not found'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        filter_param = request.query_params.get('filter', 'all').lower()
        
        # Get SOAP reports
        queryset = SOAPReport.objects.select_related('pet', 'pet__owner').all()
        
        # Apply filter
        if filter_param in ['emergency', 'urgent', 'moderate']:
            queryset = queryset.filter(flag_level__iexact=filter_param)
        elif filter_param != 'all':
            return Response({
                'success': False,
                'error': 'Invalid filter parameter',
                'valid_filters': ['all', 'emergency', 'urgent', 'moderate']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Custom ordering: Emergency > Urgent > Moderate, then date_flagged DESC
        severity_order = {
            'Emergency': 0,
            'Urgent': 1,
            'Moderate': 2
        }
        
        cases_data = []
        for report in queryset:
            # Get top diagnosis from assessment
            top_diagnosis = None
            top_likelihood = None
            top_urgency = None
            
            if report.assessment and isinstance(report.assessment, list) and len(report.assessment) > 0:
                top_diagnosis = report.assessment[0].get('condition')
                top_likelihood = report.assessment[0].get('likelihood')
                top_urgency = report.assessment[0].get('urgency')
            
            cases_data.append({
                'case_id': report.case_id,
                'pet_name': report.pet.name,
                'species': report.pet.get_animal_type_display(),
                'condition': top_diagnosis,
                'likelihood': top_likelihood,
                'urgency': top_urgency,
                'owner_name': f"{report.pet.owner.first_name} {report.pet.owner.last_name}".strip() or report.pet.owner.username,
                'date_flagged': report.date_flagged.isoformat() if report.date_flagged else report.date_generated.isoformat(),
                'flag_level': report.flag_level,
                '_severity_order': severity_order.get(report.flag_level, 3)  # For sorting
            })
        
        # Sort by severity first, then date_flagged
        cases_data.sort(key=lambda x: (
            x['_severity_order'],
            -timezone.datetime.fromisoformat(x['date_flagged']).timestamp()
        ))
        
        # Remove temporary sorting field
        for case in cases_data:
            del case['_severity_order']
        
        logger.info(f"Admin {request.admin.email} accessed flagged cases (filter: {filter_param})")
        
        return Response({
            'success': True,
            'filter': filter_param,
            'count': len(cases_data),
            'data': cases_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Flagged cases error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch flagged cases',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # Handle auth manually
def dashboard_charts(request):
    """
    GET /api/admin/dashboard/charts
    
    Return chart data for dashboard visualizations
    Permissions: MASTER, VET, DESK
    
    Returns:
        success: True/False
        data:
            species_breakdown: Object with species counts
            common_symptoms: Array of top 10 symptoms with counts
            symptoms_by_species: Object with symptoms grouped by species
    """
    try:
        # Manual authentication check
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = extract_token_from_header(auth_header)
        
        if not token:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        payload, error = verify_admin_jwt(token)
        if error or not payload:
            return Response({
                'success': False,
                'error': error or 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            admin = Admin.objects.get(id=payload['admin_id'], is_active=True)
            request.admin = admin
        except Admin.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Admin not found'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Species Breakdown
        species_counts = Pet.objects.values('animal_type').annotate(
            count=Count('id')
        )
        
        species_breakdown = {
            'Dogs': 0,
            'Cats': 0,
            'Birds': 0,
            'Rabbits': 0,
            'Others': 0
        }
        
        for item in species_counts:
            animal_type = item['animal_type'].lower()
            count = item['count']
            
            if animal_type == 'dog':
                species_breakdown['Dogs'] = count
            elif animal_type == 'cat':
                species_breakdown['Cats'] = count
            elif animal_type == 'bird':
                species_breakdown['Birds'] = count
            elif animal_type == 'rabbit':
                species_breakdown['Rabbits'] = count
            else:
                species_breakdown['Others'] += count
        
        # Common Symptoms (from SOAP reports)
        symptom_counts = {}
        symptoms_by_species = {}
        
        # Get all SOAP reports with symptoms
        soap_reports = SOAPReport.objects.select_related('pet').all()
        
        for report in soap_reports:
            # Extract symptoms from objective field
            if report.objective and isinstance(report.objective, dict):
                symptoms = report.objective.get('symptoms', [])
                species = report.pet.get_animal_type_display()
                
                # Count symptoms globally
                for symptom in symptoms:
                    symptom = symptom.strip().title()
                    symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
                    
                    # Group symptoms by species
                    if species not in symptoms_by_species:
                        symptoms_by_species[species] = {}
                    
                    symptoms_by_species[species][symptom] = symptoms_by_species[species].get(symptom, 0) + 1
        
        # Get top 10 common symptoms
        common_symptoms = [
            {'symptom': symptom, 'count': count}
            for symptom, count in sorted(symptom_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Get top 5 symptoms per species
        symptoms_by_species_formatted = {}
        for species, symptoms in symptoms_by_species.items():
            top_symptoms = sorted(symptoms.items(), key=lambda x: x[1], reverse=True)[:5]
            symptoms_by_species_formatted[species] = [symptom for symptom, count in top_symptoms]
        
        data = {
            'species_breakdown': species_breakdown,
            'common_symptoms': common_symptoms,
            'symptoms_by_species': symptoms_by_species_formatted
        }
        
        logger.info(f"Admin {request.admin.email} accessed dashboard charts")
        
        return Response({
            'success': True,
            'data': data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Dashboard charts error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch chart data',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # Handle auth manually
def dashboard_faqs(request):
    """
    GET /api/admin/dashboard/faqs
    
    Return FAQ list for dashboard
    Permissions: MASTER, VET, DESK
    
    Returns:
        success: True/False
        data: Array of FAQ objects with question and answer
    
    Note: Currently hardcoded, can be moved to database later
    """
    try:
        # Manual authentication check
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = extract_token_from_header(auth_header)
        
        if not token:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        payload, error = verify_admin_jwt(token)
        if error or not payload:
            return Response({
                'success': False,
                'error': error or 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            admin = Admin.objects.get(id=payload['admin_id'], is_active=True)
            request.admin = admin
        except Admin.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Admin not found'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        faqs = [
            {
                "question": "What services do you offer?",
                "answer": "PawPal offers AI-powered pet symptom analysis, virtual health consultations, and comprehensive SOAP reports to help you understand your pet's health conditions better."
            },
            {
                "question": "How often should I bring my pet for check-ups?",
                "answer": "For healthy adult pets, annual check-ups are recommended. Puppies, kittens, and senior pets may need more frequent visits (every 6 months). Always consult your veterinarian for personalized advice."
            },
            {
                "question": "Is the AI diagnosis as accurate as a veterinarian?",
                "answer": "Our AI provides preliminary analysis based on symptoms, but it should NOT replace professional veterinary care. Always consult a licensed veterinarian for definitive diagnosis and treatment."
            },
            {
                "question": "What information do I need to provide for an accurate diagnosis?",
                "answer": "Provide detailed symptom descriptions, duration, severity, any changes in behavior, eating/drinking habits, and clear photos if visible symptoms exist. More details lead to better analysis."
            },
            {
                "question": "How quickly can I get a diagnosis?",
                "answer": "Our AI analyzes symptoms in real-time, typically within seconds. However, for emergency situations, please contact your veterinarian or emergency pet clinic immediately."
            },
            {
                "question": "Can I use PawPal for emergency situations?",
                "answer": "PawPal is designed for preliminary assessment. For emergencies (difficulty breathing, severe bleeding, seizures, unconsciousness), contact your veterinarian or emergency clinic immediately."
            },
            {
                "question": "How do I read a SOAP report?",
                "answer": "SOAP reports contain 4 sections: Subjective (your description), Objective (measured data), Assessment (AI diagnosis), and Plan (recommended actions). Each flagged case indicates urgency level."
            },
            {
                "question": "What should I do if my pet is flagged as 'Emergency'?",
                "answer": "Emergency flags indicate potentially life-threatening conditions. Seek immediate veterinary care. Do not delay - go to the nearest emergency animal hospital."
            },
            {
                "question": "Can I share SOAP reports with my veterinarian?",
                "answer": "Yes! SOAP reports are designed to be shared with veterinarians. You can download or email them directly from your dashboard for professional review."
            },
            {
                "question": "How is my pet's data protected?",
                "answer": "We use industry-standard encryption and security measures. Your pet's health data is confidential and never shared without your explicit consent. See our Privacy Policy for details."
            }
        ]
        
        logger.info(f"Admin {request.admin.email} accessed FAQs")
        
        return Response({
            'success': True,
            'count': len(faqs),
            'data': faqs
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Dashboard FAQs error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch FAQs',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # Handle auth manually
def dashboard_announcements(request):
    """
    GET /api/admin/dashboard/announcements
    
    Return 2-3 active announcements
    Permissions: MASTER, VET, DESK
    
    Returns:
        success: True/False
        data: Array of active announcements with:
            - title
            - validity (date range)
            - description (content)
    
    Only returns active announcements (is_active=True, not expired)
    Ordered by created_at DESC
    """
    try:
        # Manual authentication check
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        token = extract_token_from_header(auth_header)
        
        if not token:
            return Response({
                'success': False,
                'error': 'Authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        payload, error = verify_admin_jwt(token)
        if error or not payload:
            return Response({
                'success': False,
                'error': error or 'Invalid token'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            admin = Admin.objects.get(id=payload['admin_id'], is_active=True)
            request.admin = admin
        except Admin.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Admin not found'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        now = timezone.now().date()
        
        # Get active, non-expired announcements
        announcements = Announcement.objects.filter(
            is_active=True
        ).filter(
            Q(valid_until__isnull=True) | Q(valid_until__gte=now)
        ).order_by('-created_at')[:3]  # Get top 3
        
        announcements_data = []
        for announcement in announcements:
            # Format validity date range
            validity = f"From {announcement.created_at.strftime('%Y-%m-%d')}"
            if announcement.valid_until:
                validity += f" to {announcement.valid_until.strftime('%Y-%m-%d')}"
            else:
                validity += " (No expiration)"
            
            announcements_data.append({
                'title': announcement.title,
                'validity': validity,
                'description': announcement.description,
                'type': announcement.get_icon_type_display(),
                'target_audience': 'All Users'  # Since model doesn't have target_audience field
            })
        
        logger.info(f"Admin {request.admin.email} accessed announcements")
        
        return Response({
            'success': True,
            'count': len(announcements_data),
            'data': announcements_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Dashboard announcements error: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to fetch announcements',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

