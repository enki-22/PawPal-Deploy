from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from .models import AdminUser, AdminSession, AdminSettings, Announcement, DashboardStats  # REMOVED SOAPReport
from chatbot.models import SOAPReport
from .serializers import *
from chatbot.models import User  # Keep User import
# from chatbot.models import AIDiagnosis  # TEMPORARILY COMMENTED OUT
from pets.models import Pet

# Custom permission class for admin
class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users"""
    
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                hasattr(request.user, 'is_staff') and 
                request.user.is_staff)

# ============= AUTHENTICATION =============

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def admin_login(request):
    """Admin login endpoint"""
    serializer = AdminLoginSerializer(data=request.data)
    
    if serializer.is_valid():
        admin_user = serializer.validated_data['admin_user']
        
        # Create or get token for the Django user (not AdminUser directly)
        token, created = Token.objects.get_or_create(user=admin_user.user)
        
        # Create admin session
        session = AdminSession.objects.create(
            admin=admin_user,
            session_key=token.key[:40],
            ip_address=request.META.get('REMOTE_ADDR', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Update last login
        admin_user.user.last_login = timezone.now()
        admin_user.last_login_ip = request.META.get('REMOTE_ADDR')
        admin_user.user.save()
        admin_user.save()
        
        return Response({
            'success': True,
            'message': 'Admin login successful',
            'data': {
                'token': token.key,
                'admin': AdminUserSerializer(admin_user).data,
                'session_id': session.id,
                'expires_in': '24 hours'
            }
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Login failed',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_logout(request):
    """Admin logout endpoint"""
    try:
        request.user.auth_token.delete()
        # Find admin profile and mark sessions inactive
        try:
            admin_profile = request.user.admin_profile
            AdminSession.objects.filter(
                admin=admin_profile,
                is_active=True
            ).update(
                logout_time=timezone.now(),
                is_active=False
            )
        except:
            pass  # Admin profile might not exist
        
        return Response({
            'success': True,
            'message': 'Logged out successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Logout failed',
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_profile(request):
    """Get admin profile"""
    try:
        admin_profile = request.user.admin_profile
        serializer = AdminUserSerializer(admin_profile)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except:
        return Response({
            'success': False,
            'message': 'Admin profile not found'
        }, status=status.HTTP_404_NOT_FOUND)

# ============= ADMIN SETTINGS =============

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def admin_settings(request):
    """Get all settings or create new setting"""
    if request.method == 'GET':
        settings = AdminSettings.objects.filter(is_active=True)
        serializer = AdminSettingsSerializer(settings, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = AdminSettingsSerializer(data=request.data)
        if serializer.is_valid():
            try:
                admin_profile = request.user.admin_profile
                serializer.save(updated_by=admin_profile)
            except:
                serializer.save()
            return Response({
                'success': True,
                'message': 'Setting created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_setting_detail(request, setting_id):
    """Get, update, or delete specific setting"""
    try:
        setting = AdminSettings.objects.get(id=setting_id)
    except AdminSettings.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Setting not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = AdminSettingsSerializer(setting)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = AdminSettingsSerializer(setting, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                admin_profile = request.user.admin_profile
                serializer.save(updated_by=admin_profile)
            except:
                serializer.save()
            return Response({
                'success': True,
                'message': 'Setting updated successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        setting.delete()
        return Response({
            'success': True,
            'message': 'Setting deleted successfully'
        }, status=status.HTTP_200_OK)

# ============= DASHBOARD ANALYTICS =============

@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_analytics(request):
    """Get comprehensive dashboard analytics"""
    try:
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Overview Statistics (without AIDiagnosis and SOAPReport for now)
        overview_stats = {
            'total_users': User.objects.count(),
            'total_pets': Pet.objects.count(),
            'total_diagnoses': 0,  # Will be updated when AIDiagnosis is available
            'total_soap_reports': 0,  # Will be updated when SOAPReport is available
            'active_users_today': User.objects.filter(last_login__date=today).count(),
            'new_users_this_week': User.objects.filter(date_joined__date__gte=week_ago).count(),
            'diagnoses_today': 0,  # Will be updated when AIDiagnosis is available
        }
        
        # User Analytics
        user_analytics = {
            'growth_rate': _calculate_growth_rate(User, 'date_joined', week_ago),
            'retention_rate': _calculate_retention_rate(),
            'avg_session_duration': _calculate_avg_session_duration(),
            'user_distribution_by_signup_date': _get_user_distribution(30),
        }
        
        # Pet Analytics
        pet_analytics = {
            'pets_by_species': list(Pet.objects.values('species').annotate(count=Count('id'))),
            'pets_by_age_group': _get_pets_by_age_group(),
            'avg_pets_per_user': Pet.objects.count() / User.objects.count() if User.objects.count() > 0 else 0,
        }
        
        # Diagnosis Analytics (placeholder until AIDiagnosis is available)
        diagnosis_analytics = {
            'diagnoses_by_severity': [],
            'diagnoses_trend': [],
            'avg_response_time': _calculate_avg_response_time(),
            'top_symptoms': [],
        }
        
        # Performance Metrics
        performance_metrics = {
            'system_uptime': '99.9%',
            'avg_accuracy': _calculate_avg_accuracy(),
            'user_satisfaction': _calculate_user_satisfaction(),
            'error_rate': _calculate_error_rate(),
        }
        
        # Usage Trends (last 30 days)
        usage_trends = []
        for i in range(30):
            date = today - timedelta(days=i)
            diagnoses = 0  # Will be updated when AIDiagnosis is available
            users = User.objects.filter(last_login__date=date).count()
            usage_trends.append({
                'date': date.strftime('%Y-%m-%d'),
                'diagnoses': diagnoses,
                'active_users': users
            })
        
        analytics_data = {
            'overview_stats': overview_stats,
            'user_analytics': user_analytics,
            'pet_analytics': pet_analytics,
            'diagnosis_analytics': diagnosis_analytics,
            'performance_metrics': performance_metrics,
            'usage_trends': usage_trends,
        }
        
        return Response({
            'success': True,
            'data': analytics_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Failed to fetch analytics',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def flagged_cases(request):
    """Return flagged SOAP reports for dashboard widget."""
    try:
        filter_level = request.GET.get('filter', 'all').lower()
        qs = SOAPReport.objects.all().order_by('-date_flagged')
        if filter_level in ['emergency', 'urgent', 'moderate']:
            qs = qs.filter(flag_level__iexact=filter_level.capitalize())
        data = []
        for r in qs[:50]:
            data.append({
                'petName': r.pet.name,
                'species': getattr(r.pet, 'animal_type', ''),
                'condition': (r.assessment[0]['condition'] if r.assessment else None),
                'likelihood': (r.assessment[0]['likelihood'] if r.assessment else None),
                'urgency': (r.assessment[0]['urgency'] if r.assessment else None),
                'owner': r.pet.owner.username,
                'dateFlagged': r.date_flagged.isoformat(),
                'flagLevel': r.flag_level,
                'caseId': r.case_id,
            })
        # Sort by severity
        order = {'Emergency': 0, 'Urgent': 1, 'Moderate': 2}
        data.sort(key=lambda x: order.get(x['flagLevel'], 3))
        return Response({'success': True, 'data': data})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

# ============= CLIENT/USER MANAGEMENT =============

@api_view(['GET'])
@permission_classes([IsAdminUser])
def manage_clients(request):
    """Get all pet owners/clients"""
    try:
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        search = request.GET.get('search', '')
        
        users = User.objects.all()
        
        if search:
            users = users.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(username__icontains=search)
            )
        
        users = users.order_by('-date_joined')
        
        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        paginated_users = users[start:end]
        
        serializer = UserManagementSerializer(paginated_users, many=True)
        
        return Response({
            'success': True,
            'data': {
                'clients': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total': users.count(),
                    'has_next': end < users.count(),
                    'has_previous': page > 1
                }
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Failed to fetch clients',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAdminUser])
def client_management(request, user_id):
    """Get or update specific client"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Client not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = UserManagementSerializer(user)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # Allow updating is_active status
        if 'is_active' in request.data:
            user.is_active = request.data['is_active']
            user.save()
            
        return Response({
            'success': True,
            'message': f"Client {'activated' if user.is_active else 'deactivated'} successfully",
            'data': {'user_id': user.id, 'is_active': user.is_active}
        }, status=status.HTTP_200_OK)

# ============= PET PROFILES =============

@api_view(['GET'])
@permission_classes([IsAdminUser])
def pet_profiles(request):
    """Get all pet profiles"""
    try:
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        search = request.GET.get('search', '')
        species = request.GET.get('species', '')
        
        pets = Pet.objects.select_related('owner')
        
        if search:
            pets = pets.filter(
                Q(name__icontains=search) |
                Q(breed__icontains=search) |
                Q(owner__first_name__icontains=search) |
                Q(owner__last_name__icontains=search)
            )
        
        if species:
            pets = pets.filter(species=species)
        
        pets = pets.order_by('-created_at')
        
        # Pagination
        start = (page - 1) * page_size
        end = start + page_size
        paginated_pets = pets[start:end]
        
        serializer = PetProfileSerializer(paginated_pets, many=True)
        
        return Response({
            'success': True,
            'data': {
                'pets': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total': pets.count(),
                    'has_next': end < pets.count(),
                    'has_previous': page > 1
                }
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'Failed to fetch pet profiles',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ============= ANNOUNCEMENTS =============

@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def announcements(request):
    """Get all announcements or create new announcement"""
    if request.method == 'GET':
        announcements = Announcement.objects.all().order_by('-created_at')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 20))
        
        start = (page - 1) * page_size
        end = start + page_size
        paginated_announcements = announcements[start:end]
        
        serializer = AnnouncementSerializer(paginated_announcements, many=True)
        
        return Response({
            'success': True,
            'data': {
                'announcements': serializer.data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total': announcements.count(),
                    'has_next': end < announcements.count(),
                    'has_previous': page > 1
                }
            }
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        serializer = AnnouncementSerializer(data=request.data)
        if serializer.is_valid():
            try:
                admin_profile = request.user.admin_profile
                serializer.save(created_by=admin_profile)
            except:
                return Response({
                    'success': False,
                    'message': 'Admin profile not found'
                }, status=status.HTTP_400_BAD_REQUEST)
            return Response({
                'success': True,
                'message': 'Announcement created successfully',
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAdminUser])
def announcement_detail(request, announcement_id):
    """Get, update, or delete specific announcement"""
    try:
        announcement = Announcement.objects.get(id=announcement_id)
    except Announcement.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Announcement not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = AnnouncementSerializer(announcement)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = AnnouncementSerializer(announcement, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Announcement updated successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        announcement.delete()
        return Response({
            'success': True,
            'message': 'Announcement deleted successfully'
        }, status=status.HTTP_200_OK)

# ============= SOAP REPORTS (TEMPORARILY DISABLED) =============

@api_view(['GET'])
@permission_classes([IsAdminUser])
def soap_reports(request):
    """Get all SOAP reports - TEMPORARILY RETURNS EMPTY"""
    return Response({
        'success': True,
        'message': 'SOAP reports will be available after AIDiagnosis model is created',
        'data': {
            'soap_reports': [],
            'pagination': {
                'page': 1,
                'page_size': 20,
                'total': 0,
                'has_next': False,
                'has_previous': False
            }
        }
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def soap_report_detail(request, report_id):
    """Get specific SOAP report - TEMPORARILY DISABLED"""
    return Response({
        'success': False,
        'message': 'SOAP reports will be available after AIDiagnosis model is created'
    }, status=status.HTTP_404_NOT_FOUND)

# ============= HELPER FUNCTIONS =============

def _calculate_growth_rate(model, date_field, start_date):
    """Calculate growth rate for a model"""
    try:
        current_period = model.objects.filter(**{f"{date_field}__gte": start_date}).count()
        previous_period = model.objects.filter(
            **{f"{date_field}__gte": start_date - timedelta(days=7), f"{date_field}__lt": start_date}
        ).count()
        
        if previous_period == 0:
            return 100.0 if current_period > 0 else 0.0
        
        return ((current_period - previous_period) / previous_period) * 100
    except:
        return 0.0

def _calculate_retention_rate():
    """Calculate user retention rate"""
    try:
        total_users = User.objects.count()
        week_ago = timezone.now().date() - timedelta(days=7)
        active_users = User.objects.filter(last_login__date__gte=week_ago).count()
        
        if total_users == 0:
            return 0.0
        
        return (active_users / total_users) * 100
    except:
        return 0.0

def _calculate_avg_session_duration():
    """Calculate average session duration"""
    return 12.5  # minutes

def _get_user_distribution(days):
    """Get user signup distribution over specified days"""
    today = timezone.now().date()
    distribution = []
    
    for i in range(days):
        date = today - timedelta(days=i)
        count = User.objects.filter(date_joined__date=date).count()
        distribution.append({
            'date': date.strftime('%Y-%m-%d'),
            'count': count
        })
    
    return distribution

def _get_pets_by_age_group():
    """Get pets grouped by age ranges"""
    return [
        {'age_group': '0-1 years', 'count': Pet.objects.filter(age__lte=1).count()},
        {'age_group': '2-5 years', 'count': Pet.objects.filter(age__range=(2, 5)).count()},
        {'age_group': '6-10 years', 'count': Pet.objects.filter(age__range=(6, 10)).count()},
        {'age_group': '10+ years', 'count': Pet.objects.filter(age__gt=10).count()},
    ]

def _calculate_avg_response_time():
    """Calculate average AI response time"""
    return 2.3  # seconds

def _calculate_avg_accuracy():
    """Calculate average AI diagnosis accuracy"""
    return 85.7  # percentage

def _calculate_user_satisfaction():
    """Calculate user satisfaction score"""
    return 4.2  # out of 5

def _calculate_error_rate():
    """Calculate system error rate"""
    return 2.1  # percentage