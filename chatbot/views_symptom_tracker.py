"""
Symptom Tracker API Views
Endpoints for logging symptoms, tracking progression, and managing alerts
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Avg, Count, Q
from datetime import timedelta
import json
import logging

from .models import SymptomLog, SymptomAlert, PetHealthTrend
from pets.models import Pet
from .serializers import (
    SymptomLogSerializer,
    SymptomLogCreateSerializer,
    SymptomAlertSerializer
)
from utils.risk_calculator import calculate_risk_score, should_create_alert
from .utils import analyze_symptom_progression

logger = logging.getLogger(__name__)


class SymptomTrackerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for symptom logging and tracking
    
    Endpoints:
    - POST /api/symptom-tracker/log/ - Log symptoms
    - GET /api/symptom-tracker/timeline/ - Get symptom timeline
    - GET /api/symptom-tracker/progression/ - Analyze progression
    - GET /api/symptom-tracker/alerts/ - Get alerts
    - POST /api/symptom-tracker/{id}/acknowledge-alert/ - Acknowledge alert
    - GET /api/symptom-tracker/dashboard/ - Multi-pet dashboard
    - GET /api/symptom-tracker/canonical-symptoms/ - Get symptom list
    """
    
    serializer_class = SymptomLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get symptom logs for current user"""
        return SymptomLog.objects.filter(user=self.request.user).select_related('pet')
    
    def create(self, request):
        """
        Log new symptoms with automatic risk calculation
        
        POST /api/symptom-tracker/log/
        
        Body:
        {
            "pet_id": 1,
            "symptom_date": "2024-11-17",  // Optional, defaults to today
            "symptoms": ["vomiting", "diarrhea", "lethargy"],
            "overall_severity": "moderate",
            "symptom_details": {
                "vomiting": {"count": 3, "notes": "After eating"}
            },
            "compared_to_yesterday": "worse",  // Optional: worse|same|better|new
            "notes": "Started this morning"
        }
        """
        # Validate input
        serializer = SymptomLogCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        pet_id = validated_data['pet_id']
        
        # Get pet
        pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
        
        # Get previous logs for progression analysis (last 14 days)
        symptom_date = validated_data.get('symptom_date', timezone.now().date())
        previous_logs = SymptomLog.objects.filter(
            pet=pet,
            symptom_date__lt=symptom_date
        ).order_by('-symptom_date')[:14]
        
        # Create symptom log (without risk score initially)
        symptom_log = SymptomLog.objects.create(
            user=request.user,
            pet=pet,
            symptom_date=symptom_date,
            symptoms=validated_data['symptoms'],
            overall_severity=validated_data['overall_severity'],
            symptom_details=validated_data.get('symptom_details', {}),
            compared_to_yesterday=validated_data.get('compared_to_yesterday'),
            notes=validated_data.get('notes', '')
        )
        
        # Calculate risk score
        risk_result = calculate_risk_score(
            symptom_log=symptom_log,
            previous_logs=list(previous_logs),
            pet=pet
        )
        
        # Update symptom log with risk assessment
        symptom_log.risk_score = risk_result['risk_score']
        symptom_log.risk_level = risk_result['risk_level']
        symptom_log.save()
        
        # Check if alert should be created
        should_alert, alert_type, alert_message = should_create_alert(
            symptom_log=symptom_log,
            previous_logs=list(previous_logs),
            risk_result=risk_result
        )
        
        alert_created = None
        if should_alert:
            alert = SymptomAlert.objects.create(
                symptom_log=symptom_log,
                pet=pet,
                user=request.user,
                alert_type=alert_type,
                alert_message=alert_message
            )
            alert_created = SymptomAlertSerializer(alert).data
        
        # Return comprehensive response
        return Response({
            'success': True,
            'message': 'Symptom log created successfully',
            'symptom_log': SymptomLogSerializer(symptom_log).data,
            'risk_assessment': {
                'score': risk_result['risk_score'],
                'level': risk_result['risk_level'],
                'recommendation': risk_result['recommendation'],
                'risk_factors': risk_result['risk_factors'],
                'symptoms_evaluated': risk_result['symptoms_evaluated'],
                'total_symptoms_reported': risk_result['total_symptoms_reported']
            },
            'alert': alert_created
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='timeline')
    def timeline(self, request):
        """
        Get symptom timeline for a pet
        
        GET /api/symptom-tracker/timeline/?pet_id=1&days=30
        
        Query params:
        - pet_id (required): Pet ID
        - days (optional): Number of days to retrieve (default: 30)
        """
        pet_id = request.query_params.get('pet_id')
        
        if not pet_id:
            return Response(
                {'error': 'pet_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify pet ownership
        pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
        
        # Get date range
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        # Get logs
        logs = SymptomLog.objects.filter(
            pet=pet,
            symptom_date__gte=start_date
        ).order_by('symptom_date')
        
        # Calculate summary statistics
        if logs.exists():
            avg_risk = logs.aggregate(Avg('risk_score'))['risk_score__avg']
            latest_log = logs.last()
            
            summary = {
                'total_logs': logs.count(),
                'date_range': {
                    'start': start_date,
                    'end': timezone.now().date()
                },
                'current_risk_score': latest_log.risk_score,
                'current_risk_level': latest_log.risk_level,
                'average_risk_score': round(avg_risk, 1) if avg_risk else 0,
                'highest_risk_score': logs.order_by('-risk_score').first().risk_score,
                'days_with_symptoms': logs.count()
            }
        else:
            summary = {
                'total_logs': 0,
                'date_range': {
                    'start': start_date,
                    'end': timezone.now().date()
                },
                'message': 'No symptom logs found for this period'
            }
        
        return Response({
            'pet': {
                'id': pet.id,
                'name': pet.name,
                'animal_type': pet.animal_type,
                'age': pet.age
            },
            'timeline': SymptomLogSerializer(logs, many=True).data,
            'summary': summary
        })
    
    @action(detail=False, methods=['get'], url_path='progression')
    def progression(self, request):
        """
        Analyze symptom progression and trends
        
        GET /api/symptom-tracker/progression/?pet_id=1
        
        Query params:
        - pet_id (required): Pet ID
        """
        pet_id = request.query_params.get('pet_id')
        
        if not pet_id:
            return Response(
                {'error': 'pet_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify pet ownership
        pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
        
        # Get last 14 days of logs
        logs = SymptomLog.objects.filter(
            pet=pet
        ).order_by('-symptom_date')[:14]
        
        if not logs:
            return Response({
                'error': 'No symptom logs found',
                'message': 'Please log some symptoms first to see progression analysis'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Reverse to get chronological order for analysis
        logs_list = list(logs)
        logs_list.reverse()
        
        # Analyze trends
        risk_scores = [log.risk_score for log in logs_list]
        
        # Calculate trend
        if len(risk_scores) >= 3:
            # Compare recent 3 days vs earlier 3 days
            recent_avg = sum(risk_scores[-3:]) / min(3, len(risk_scores[-3:]))
            earlier_avg = sum(risk_scores[:3]) / min(3, len(risk_scores[:3]))
            
            if recent_avg > earlier_avg + 10:
                trend = 'worsening'
                trend_description = f"Symptoms are worsening (risk increased by {round(recent_avg - earlier_avg, 1)} points)"
            elif recent_avg < earlier_avg - 10:
                trend = 'improving'
                trend_description = f"Symptoms are improving (risk decreased by {round(earlier_avg - recent_avg, 1)} points)"
            else:
                trend = 'stable'
                trend_description = "Symptoms are relatively stable"
        else:
            trend = 'insufficient_data'
            trend_description = "Need more data points for accurate trend analysis (at least 3 logs)"
        
        # Identify recurring symptoms
        all_symptoms = []
        for log in logs_list:
            all_symptoms.extend(log.symptoms)
        
        from collections import Counter
        symptom_frequency = Counter(all_symptoms)
        recurring_symptoms = [
            {'symptom': symptom, 'frequency': count}
            for symptom, count in symptom_frequency.most_common(10)
        ]
        
        # Risk level distribution
        risk_level_counts = {}
        for log in logs_list:
            level = log.risk_level
            risk_level_counts[level] = risk_level_counts.get(level, 0) + 1
        
        return Response({
            'pet': {
                'id': pet.id,
                'name': pet.name,
                'animal_type': pet.animal_type
            },
            'analysis': {
                'trend': trend,
                'trend_description': trend_description,
                'latest_risk_score': logs_list[-1].risk_score,
                'latest_risk_level': logs_list[-1].risk_level,
                'average_risk_score': round(sum(risk_scores) / len(risk_scores), 1),
                'highest_risk_score': max(risk_scores),
                'lowest_risk_score': min(risk_scores),
                'days_analyzed': len(logs_list)
            },
            'recurring_symptoms': recurring_symptoms,
            'risk_level_distribution': risk_level_counts,
            'risk_score_timeline': [
                {
                    'date': log.symptom_date,
                    'risk_score': log.risk_score,
                    'risk_level': log.risk_level
                }
                for log in logs_list
            ],
            'detailed_logs': SymptomLogSerializer(logs, many=True).data
        })
    
    @action(detail=False, methods=['get'], url_path='alerts')
    def alerts(self, request):
        """
        Get alerts for a pet
        
        GET /api/symptom-tracker/alerts/?pet_id=1&acknowledged=false
        
        Query params:
        - pet_id (required): Pet ID
        - acknowledged (optional): Filter by acknowledgment status (true/false)
        """
        pet_id = request.query_params.get('pet_id')
        
        if not pet_id:
            return Response(
                {'error': 'pet_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify pet ownership
        pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
        
        # Base query
        alerts = SymptomAlert.objects.filter(pet=pet, user=request.user)
        
        # Filter by acknowledgment status
        acknowledged_param = request.query_params.get('acknowledged')
        if acknowledged_param is not None:
            acknowledged = acknowledged_param.lower() == 'true'
            alerts = alerts.filter(acknowledged=acknowledged)
        
        # Order by most recent first
        alerts = alerts.order_by('-created_at')
        
        serializer = SymptomAlertSerializer(alerts, many=True)
        
        return Response({
            'pet': {
                'id': pet.id,
                'name': pet.name
            },
            'alerts': serializer.data,
            'count': alerts.count(),
            'unacknowledged_count': alerts.filter(acknowledged=False).count()
        })
    
    @action(detail=True, methods=['post'], url_path='acknowledge-alert')
    def acknowledge_alert(self, request, pk=None):
        """
        Acknowledge a symptom alert
        
        POST /api/symptom-tracker/{alert_id}/acknowledge-alert/
        """
        # Get alert (pk is the alert ID in this case)
        alert = get_object_or_404(SymptomAlert, id=pk, user=request.user)
        
        if alert.acknowledged:
            return Response({
                'message': 'Alert was already acknowledged',
                'alert': SymptomAlertSerializer(alert).data
            })
        
        # Acknowledge the alert (uses model's acknowledge() method)
        alert.acknowledge()
        
        return Response({
            'success': True,
            'message': 'Alert acknowledged successfully',
            'alert': SymptomAlertSerializer(alert).data
        })
    
    @action(detail=False, methods=['post'], url_path='acknowledge-all-alerts')
    def acknowledge_all_alerts(self, request):
        """
        Acknowledge all alerts for a pet
        
        POST /api/symptom-tracker/acknowledge-all-alerts/
        
        Body:
        {
            "pet_id": 1
        }
        """
        pet_id = request.data.get('pet_id')
        
        if not pet_id:
            return Response(
                {'error': 'pet_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify pet ownership
        pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
        
        # Get unacknowledged alerts
        alerts = SymptomAlert.objects.filter(
            pet=pet,
            user=request.user,
            acknowledged=False
        )
        
        count = alerts.count()
        
        # Acknowledge all
        for alert in alerts:
            alert.acknowledge()
        
        return Response({
            'success': True,
            'message': f'Acknowledged {count} alert(s)',
            'acknowledged_count': count
        })
    
    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        """
        Get multi-pet symptom tracking dashboard
        
        GET /api/symptom-tracker/dashboard/
        
        Returns overview of all pets' current symptom status
        """
        # Get all user's pets
        pets = Pet.objects.filter(owner=request.user)
        
        dashboard_data = []
        
        for pet in pets:
            # Get latest symptom log
            latest_log = SymptomLog.objects.filter(pet=pet).order_by('-symptom_date').first()
            
            # Count active alerts
            active_alerts_count = SymptomAlert.objects.filter(
                pet=pet,
                acknowledged=False
            ).count()
            
            # Get logs from last 7 days
            week_ago = timezone.now().date() - timedelta(days=7)
            recent_logs_count = SymptomLog.objects.filter(
                pet=pet,
                symptom_date__gte=week_ago
            ).count()
            
            pet_data = {
                'pet_id': pet.id,
                'pet_name': pet.name,
                'animal_type': pet.animal_type,
                'age': pet.age,
                'has_recent_activity': latest_log is not None,
                'active_alerts': active_alerts_count,
                'logs_last_7_days': recent_logs_count
            }
            
            if latest_log:
                pet_data.update({
                    'last_logged_date': latest_log.symptom_date,
                    'days_since_last_log': (timezone.now().date() - latest_log.symptom_date).days,
                    'current_risk_score': latest_log.risk_score,
                    'current_risk_level': latest_log.risk_level,
                    'current_symptoms': latest_log.symptoms,
                    'severity': latest_log.overall_severity
                })
            
            dashboard_data.append(pet_data)
        
        # Sort by risk score (highest first), then by alerts
        dashboard_data.sort(
            key=lambda x: (
                -(x.get('current_risk_score', 0)),
                -x['active_alerts']
            )
        )
        
        # Calculate summary statistics
        pets_with_logs = len([p for p in dashboard_data if p['has_recent_activity']])
        total_active_alerts = sum(p['active_alerts'] for p in dashboard_data)
        critical_pets = len([p for p in dashboard_data if p.get('current_risk_level') == 'critical'])
        high_risk_pets = len([p for p in dashboard_data if p.get('current_risk_level') == 'high'])
        
        return Response({
            'pets': dashboard_data,
            'summary': {
                'total_pets': pets.count(),
                'pets_with_symptom_logs': pets_with_logs,
                'total_active_alerts': total_active_alerts,
                'critical_risk_pets': critical_pets,
                'high_risk_pets': high_risk_pets,
                'needs_attention': critical_pets + high_risk_pets
            }
        })
    
    @action(detail=False, methods=['get'], url_path='canonical-symptoms')
    def canonical_symptoms(self, request):
        """
        Get list of canonical symptoms for validation
        
        GET /api/symptom-tracker/canonical-symptoms/
        
        Returns the 81 canonical symptoms organized by category
        """
        from utils.risk_calculator import CANONICAL_SYMPTOMS
        
        # Organize by category
        categories = {
            'General': [
                "vomiting", "diarrhea", "lethargy", "loss_of_appetite", "weight_loss",
                "fever", "dehydration", "weakness", "seizures"
            ],
            'Respiratory': [
                "coughing", "sneezing", "wheezing", "labored_breathing", "difficulty_breathing",
                "nasal_discharge", "nasal_congestion", "respiratory_distress"
            ],
            'Skin & Coat': [
                "scratching", "itching", "hair_loss", "bald_patches", "red_skin",
                "irritated_skin", "skin_lesions", "rash", "scabs", "dandruff"
            ],
            'Eyes & Ears': [
                "watery_eyes", "eye_discharge", "red_eyes", "squinting",
                "ear_discharge", "ear_scratching", "head_shaking"
            ],
            'Digestive': [
                "constipation", "bloating", "gas", "not_eating", "excessive_eating"
            ],
            'Urinary': [
                "blood_in_urine", "frequent_urination", "straining_to_urinate",
                "dark_urine", "cloudy_urine"
            ],
            'Oral/Dental': [
                "bad_breath", "drooling", "difficulty_eating", "swollen_gums",
                "red_gums", "mouth_pain"
            ],
            'Behavioral': [
                "aggression", "hiding", "restlessness", "confusion", "circling"
            ],
            'Mobility': [
                "limping", "lameness", "difficulty_walking", "stiffness",
                "reluctance_to_move", "paralysis"
            ],
            'Bird-Specific': [
                "drooping_wing", "feather_loss", "wing_droop", "fluffed_feathers",
                "tail_bobbing"
            ],
            'Fish-Specific': [
                "white_spots", "fin_rot", "swimming_upside_down", "gasping_at_surface",
                "clamped_fins", "rubbing_against_objects", "cloudy_eyes"
            ],
            'Rabbit-Specific': [
                "head_tilt", "rolling", "loss_of_balance", "dental_issues"
            ],
            'Small Mammal': [
                "wet_tail", "lumps", "bumps", "overgrown_teeth"
            ]
        }
        
        return Response({
            'total_symptoms': len(CANONICAL_SYMPTOMS),
            'symptoms_by_category': categories,
            'all_symptoms': sorted(CANONICAL_SYMPTOMS)
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_daily_symptoms(request):
    """
    Log daily symptoms and trigger AI analysis.
    
    POST /api/symptom-tracker/log-daily/
    
    Body:
    {
        "pet_id": 1,
        "symptoms": ["vomiting", "lethargy"],
        "severity_map": {"vomiting": 7, "lethargy": 4},  // 1-10 scale
        "notes": "Started this morning"
    }
    
    Returns:
    {
        "success": true,
        "log": {...},
        "analysis": {...}  // PetHealthTrend data
    }
    """
    
    pet_id = request.data.get('pet_id')
    symptoms = request.data.get('symptoms', [])
    severity_map = request.data.get('severity_map', {})
    notes = request.data.get('notes', '')
    
    # Validate required fields
    if not pet_id:
        return Response(
            {'error': 'pet_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not symptoms or not isinstance(symptoms, list):
        return Response(
            {'error': 'symptoms must be a non-empty list'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get pet and verify ownership
    try:
        pet = Pet.objects.get(id=pet_id, owner=request.user)
    except Pet.DoesNotExist:
        return Response(
            {'error': 'Pet not found or access denied'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Determine overall severity from severity_map
    if severity_map:
        avg_severity = sum(severity_map.values()) / len(severity_map)
        if avg_severity >= 7:
            overall_severity = 'severe'
        elif avg_severity >= 4:
            overall_severity = 'moderate'
        else:
            overall_severity = 'mild'
    else:
        overall_severity = 'moderate'  # Default
    
    # Create symptom log
    try:
        symptom_log = SymptomLog.objects.create(
            user=request.user,
            pet=pet,
            symptom_date=timezone.now().date(),
            symptoms=symptoms,
            overall_severity=overall_severity,
            symptom_details=severity_map,  # Store severity_map in symptom_details
            notes=notes
        )
        
        # Trigger AI analysis (can be async in production)
        analysis_result = analyze_symptom_progression(pet_id)
        
        # Create PetHealthTrend from analysis
        # Use trend_analysis from result if available, otherwise construct from trend
        trend_analysis_text = analysis_result.get('trend_analysis') or f"Trend: {analysis_result['trend']}"
        
        health_trend = PetHealthTrend.objects.create(
            pet=pet,
            risk_score=analysis_result['risk_score'],
            urgency_level=analysis_result['urgency'],
            trend_analysis=trend_analysis_text,
            prediction=analysis_result['prediction'],
            alert_needed=analysis_result['alert_needed']
        )
        
        return Response({
            'success': True,
            'message': 'Symptoms logged and analyzed successfully',
            'log': {
                'id': symptom_log.id,
                'pet_id': pet.id,
                'log_date': symptom_log.symptom_date,
                'symptoms': symptom_log.symptoms,
                'severity_scores': symptom_log.symptom_details,
                'notes': symptom_log.notes,
                'created_at': symptom_log.logged_date
            },
            'analysis': {
                'id': health_trend.id,
                'analysis_date': health_trend.analysis_date,
                'risk_score': health_trend.risk_score,
                'urgency_level': health_trend.urgency_level,
                'trend_analysis': health_trend.trend_analysis,
                'prediction': health_trend.prediction,
                'alert_needed': health_trend.alert_needed
            }
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        logger.error(f"Error logging symptoms: {e}")
        return Response(
            {'error': f'Failed to log symptoms: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pet_health_timeline(request):
    """
    Get pet health timeline with logs and latest trend analysis.
    
    GET /api/symptom-tracker/health-timeline/?pet_id=1
    
    Query params:
    - pet_id (required): Pet ID
    
    Returns:
    {
        "logs": [...],  // Last 14 logs
        "latest_trend": {...}  // Most recent PetHealthTrend
    }
    """
    
    pet_id = request.query_params.get('pet_id')
    
    if not pet_id:
        return Response(
            {'error': 'pet_id parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get pet and verify ownership
    try:
        pet = Pet.objects.get(id=pet_id, owner=request.user)
    except Pet.DoesNotExist:
        return Response(
            {'error': 'Pet not found or access denied'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get last 14 logs
    logs = SymptomLog.objects.filter(
        pet=pet
    ).order_by('-symptom_date')[:14]
    
    # Format logs
    logs_data = []
    for log in logs:
        logs_data.append({
            'id': log.id,
            'log_date': log.symptom_date,
            'symptoms': log.symptoms if isinstance(log.symptoms, list) else [],
            'severity_scores': log.symptom_details if hasattr(log, 'symptom_details') else {},
            'notes': log.notes or '',
            'created_at': log.logged_date
        })
    
    # Get latest trend
    latest_trend = PetHealthTrend.objects.filter(
        pet=pet
    ).order_by('-analysis_date').first()
    
    trend_data = None
    if latest_trend:
        trend_data = {
            'id': latest_trend.id,
            'analysis_date': latest_trend.analysis_date,
            'risk_score': latest_trend.risk_score,
            'urgency_level': latest_trend.urgency_level,
            'trend_analysis': latest_trend.trend_analysis,
            'prediction': latest_trend.prediction,
            'alert_needed': latest_trend.alert_needed
        }
    
    return Response({
        'pet': {
            'id': pet.id,
            'name': pet.name,
            'animal_type': pet.animal_type
        },
        'logs': logs_data,
        'latest_trend': trend_data
    })
