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
from django.db.models.functions import Lower, Length
from datetime import timedelta
import logging

from .permissions import require_any_admin
from .jwt_utils import verify_admin_jwt, extract_token_from_header
from .models import Admin, Announcement
from chatbot.models import User, Conversation, SOAPReport, Message
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
        - reports_filter: last_24_hours | last_7_days | last_30_days | all_time (default: all_time)
        - conversations_filter: last_24_hours | last_7_days | last_30_days | this_week | this_month | all_time (default: all_time)
    
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
        
        # Total users - only count pet owners (exclude vet admins)
        # Vet admins are managed separately in admin roles page
        # Use 'profile' as related_name (defined in UserProfile model)
        total_users = User.objects.filter(
            profile__is_vet_admin=False
        ).count()
        
        # Total pets - only count pets owned by regular pet owners
        total_pets = Pet.objects.filter(
            owner__profile__is_vet_admin=False
        ).count()
        
        # Total SOAP reports with filter
        reports_queryset = SOAPReport.objects.all()
        
        if reports_filter == 'last_24_hours':
            twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
            reports_queryset = reports_queryset.filter(
                date_generated__gte=twenty_four_hours_ago
            )
        elif reports_filter == 'last_7_days':
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
        
        if conversations_filter == 'last_24_hours':
            twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
            conversations_queryset = conversations_queryset.filter(
                created_at__gte=twenty_four_hours_ago
            )
        elif conversations_filter == 'last_7_days':
            seven_days_ago = today - timedelta(days=7)
            conversations_queryset = conversations_queryset.filter(
                created_at__date__gte=seven_days_ago
            )
        elif conversations_filter == 'last_30_days':
            thirty_days_ago = today - timedelta(days=30)
            conversations_queryset = conversations_queryset.filter(
                created_at__date__gte=thirty_days_ago
            )
        elif conversations_filter == 'this_week':
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
    GET /api/admin/dashboard/charts?date_filter=last_24_hours|last_7_days|last_30_days|all_time
    
    Return chart data for dashboard visualizations
    Permissions: MASTER, VET, DESK
    
    Query Parameters:
        - date_filter: last_24_hours | last_7_days | last_30_days | all_time (default: all_time)
    
    Returns:
        success: True/False
        data:
            species_breakdown: Object with species counts (filtered by date)
            common_symptoms: Array of top 10 symptoms with counts (filtered by date)
            symptoms_by_species: Object with symptoms grouped by species (filtered by date)
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
        
        # Get date filter parameter
        date_filter = request.query_params.get('date_filter', 'all_time')
        filter_date = timezone.now().date()
        
        # Species Breakdown with date filter
        pet_queryset = Pet.objects.filter(
            owner__profile__is_vet_admin=False
        ).exclude(
            owner__profile__isnull=True
        )
        
        if date_filter == 'last_24_hours':
            filter_datetime = timezone.now() - timedelta(hours=24)
            pet_queryset = pet_queryset.filter(created_at__gte=filter_datetime)
        elif date_filter == 'last_7_days':
            filter_date = filter_date - timedelta(days=7)
            pet_queryset = pet_queryset.filter(created_at__date__gte=filter_date)
        elif date_filter == 'last_30_days':
            filter_date = filter_date - timedelta(days=30)
            pet_queryset = pet_queryset.filter(created_at__date__gte=filter_date)
        # else: all_time (no filter)
        
        species_counts = pet_queryset.values('animal_type').annotate(
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
        
        # Common Symptoms (from Chatbot Symptom Checker only)
        symptom_counts = {}
        symptoms_by_species = {}
        
        # KEY CHANGE: Filter for SOAP Reports that have a linked chat_conversation
        # This ensures we are getting data from the "Symptom Checker" flow
        soap_reports_queryset = SOAPReport.objects.filter(
            chat_conversation__isnull=False
        ).select_related('pet')
        
        if date_filter == 'last_24_hours':
            filter_datetime = timezone.now() - timedelta(hours=24)
            soap_reports_queryset = soap_reports_queryset.filter(date_generated__gte=filter_datetime)
        elif date_filter == 'last_7_days':
            filter_date = timezone.now().date() - timedelta(days=7)
            soap_reports_queryset = soap_reports_queryset.filter(date_generated__date__gte=filter_date)
        elif date_filter == 'last_30_days':
            filter_date = timezone.now().date() - timedelta(days=30)
            soap_reports_queryset = soap_reports_queryset.filter(date_generated__date__gte=filter_date)
        # else: all_time (no filter)
        
        for report in soap_reports_queryset:
            # Extract symptoms from objective field (populated by symptom checker)
            if report.objective and isinstance(report.objective, dict):
                symptoms = report.objective.get('symptoms', [])
                species = report.pet.get_animal_type_display()
                
                for symptom in symptoms:
                    symptom = symptom.strip().title()
                    
                    # Skip generic placeholder text if present
                    if "Symptoms Noted In Clinical Text" in symptom:
                        continue

                    symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
                    
                    # Group symptoms by species
                    if species not in symptoms_by_species:
                        symptoms_by_species[species] = {}
                    
                    symptoms_by_species[species][symptom] = symptoms_by_species[species].get(symptom, 0) + 1
        
        # APPLY THRESHOLD: Only show symptoms clicked/selected >= 5 times
        final_symptom_counts = {k: v for k, v in symptom_counts.items() if v >= 5}
        
        # Top 10 common symptoms (filtered)
        common_symptoms = [
            {'symptom': symptom, 'count': count}
            for symptom, count in sorted(final_symptom_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Top 5 per species (also applying threshold for consistency)
        symptoms_by_species_formatted = {}
        for species, s_counts in symptoms_by_species.items():
            # Apply same threshold to species-specific views to ensure "common" definition is consistent
            filtered_species_counts = {k: v for k, v in s_counts.items() if v >= 5}
            
            if filtered_species_counts:
                top_symptoms = sorted(filtered_species_counts.items(), key=lambda x: x[1], reverse=True)[:5]
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
    
    Return FAQ list generated from real chatbot interactions
    Only includes questions asked >= 5 times.
    
    Permissions: MASTER, VET, DESK
    
    Returns:
        success: True/False
        data: Array of FAQ objects with:
            - question
            - count
            - answer_summary
            - full_answer
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
        
        # 1. Fetch user messages that are reasonably long (> 4 chars) to avoid garbage
        user_msgs = Message.objects.filter(is_user=True).annotate(
            text_len=Length('content')
        ).filter(text_len__gt=4)

        # 2. Group by case-insensitive content
        stats = user_msgs.annotate(
            lower_content=Lower('content')
        ).values('lower_content').annotate(
            frequency=Count('id')
        ).filter(
            frequency__gte=5
        ).order_by('-frequency')

        faqs_data = []
        
        # Heuristic keywords to identify questions if no '?' is present
        q_words = ('what', 'how', 'why', 'can', 'does', 'do', 'is', 'are', 'where', 'when', 'who', 'help', 'my dog', 'my cat')
        
        for item in stats:
            text = item['lower_content']
            count = item['frequency']
            
            # 3. Filter: Must look like a question or pet query
            if '?' not in text and not text.strip().startswith(q_words):
                continue
            
            # Exclude obvious testing/greetings
            if 'test' in text or text.strip() in ['hello', 'hi', 'hey']:
                continue

            # 4. Get the latest instance of this question to preserve original casing/context
            latest_instance = Message.objects.filter(
                content__iexact=text, 
                is_user=True
            ).order_by('-created_at').first()
            
            if not latest_instance:
                continue
                
            # 5. Find the immediate AI response (next message in conversation)
            ai_response = Message.objects.filter(
                conversation=latest_instance.conversation,
                id__gt=latest_instance.id,
                is_user=False
            ).order_by('id').first()
            
            full_ans = ai_response.content if ai_response else "No response recorded."
            summary = full_ans[:150] + "..." if len(full_ans) > 150 else full_ans
            
            # Use original casing for display
            display_question = latest_instance.content
            
            faqs_data.append({
                "question": display_question,
                "count": count,
                "answer_summary": summary,
                "full_answer": full_ans
            })
            
            # Limit to top 10 FAQs to prevent overload
            if len(faqs_data) >= 10:
                break
        
        logger.info(f"Admin {request.admin.email} accessed FAQs")
        
        return Response({
            'success': True,
            'count': len(faqs_data),
            'data': faqs_data
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

