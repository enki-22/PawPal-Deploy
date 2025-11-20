"""
Integration Example: Risk Calculator with Django Views
Shows how to integrate the risk scoring system with SymptomLog creation/updates
"""

from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime

from chatbot.models import SymptomLog, SymptomAlert
from pets.models import Pet
from utils.risk_calculator import calculate_risk_score, should_create_alert


@api_view(['POST'])
def create_symptom_log(request):
    """
    Create a new symptom log with automatic risk scoring and alert generation
    
    Expected payload:
    {
        "pet_id": 1,
        "symptom_date": "2024-11-17",
        "symptoms": ["vomiting", "diarrhea", "lethargy"],
        "overall_severity": "moderate",
        "symptom_details": {
            "vomiting": {"count": 3, "notes": "After eating"}
        },
        "compared_to_yesterday": "worse",
        "notes": "Started this morning"
    }
    """
    try:
        # Extract data
        pet_id = request.data.get('pet_id')
        symptom_date = request.data.get('symptom_date')
        symptoms = request.data.get('symptoms', [])
        overall_severity = request.data.get('overall_severity')
        symptom_details = request.data.get('symptom_details', {})
        compared_to_yesterday = request.data.get('compared_to_yesterday')
        notes = request.data.get('notes', '')
        
        # Validate required fields
        if not all([pet_id, symptom_date, symptoms, overall_severity]):
            return Response(
                {'error': 'Missing required fields'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get pet
        pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
        
        # Create symptom log (without risk score initially)
        symptom_log = SymptomLog.objects.create(
            user=request.user,
            pet=pet,
            symptom_date=symptom_date,
            symptoms=symptoms,
            overall_severity=overall_severity,
            symptom_details=symptom_details,
            compared_to_yesterday=compared_to_yesterday,
            notes=notes
        )
        
        # Get previous logs for progression analysis (last 14 days)
        previous_logs = SymptomLog.objects.filter(
            pet=pet,
            symptom_date__lt=symptom_date
        ).order_by('-symptom_date')[:14]
        
        # Calculate risk score
        risk_result = calculate_risk_score(
            symptom_log=symptom_log,
            previous_logs=previous_logs,
            pet=pet
        )
        
        # Update symptom log with risk assessment
        symptom_log.risk_score = risk_result['risk_score']
        symptom_log.risk_level = risk_result['risk_level']
        symptom_log.save()
        
        # Check if alert should be created
        should_alert, alert_type, alert_message = should_create_alert(
            symptom_log=symptom_log,
            previous_logs=previous_logs,
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
            alert_created = {
                'id': alert.id,
                'type': alert.alert_type,
                'message': alert.alert_message
            }
        
        # Return comprehensive response
        return Response({
            'success': True,
            'symptom_log': {
                'id': symptom_log.id,
                'pet': pet.name,
                'symptom_date': symptom_log.symptom_date,
                'symptoms': symptom_log.symptoms,
                'severity': symptom_log.overall_severity,
                'logged_date': symptom_log.logged_date
            },
            'risk_assessment': {
                'score': risk_result['risk_score'],
                'level': risk_result['risk_level'],
                'recommendation': risk_result['recommendation'],
                'risk_factors': risk_result['risk_factors'],
                'symptoms_evaluated': risk_result['symptoms_evaluated']
            },
            'alert': alert_created
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_symptom_progression(request, pet_id):
    """
    Get symptom progression history for a pet with risk trends
    
    Returns the last 30 days of symptom logs with risk scores
    """
    try:
        pet = get_object_or_404(Pet, id=pet_id, owner=request.user)
        
        # Get last 30 days of logs
        logs = SymptomLog.objects.filter(pet=pet).order_by('-symptom_date')[:30]
        
        progression_data = []
        for log in logs:
            progression_data.append({
                'date': log.symptom_date,
                'symptoms': log.symptoms,
                'severity': log.overall_severity,
                'risk_score': log.risk_score,
                'risk_level': log.risk_level,
                'compared_to_yesterday': log.compared_to_yesterday,
                'notes': log.notes
            })
        
        # Calculate trends
        if len(progression_data) >= 2:
            latest_score = progression_data[0]['risk_score']
            previous_score = progression_data[1]['risk_score']
            trend = 'improving' if latest_score < previous_score else 'worsening' if latest_score > previous_score else 'stable'
        else:
            trend = 'insufficient_data'
        
        # Get active alerts
        active_alerts = SymptomAlert.objects.filter(
            pet=pet,
            acknowledged=False
        ).order_by('-created_at')
        
        alerts_data = [{
            'id': alert.id,
            'type': alert.alert_type,
            'message': alert.alert_message,
            'created_at': alert.created_at
        } for alert in active_alerts]
        
        return Response({
            'pet': {
                'id': pet.id,
                'name': pet.name,
                'animal_type': pet.animal_type,
                'age': pet.age
            },
            'progression': progression_data,
            'trend': trend,
            'active_alerts': alerts_data,
            'summary': {
                'total_logs': len(progression_data),
                'average_risk_score': sum(log['risk_score'] for log in progression_data) / len(progression_data) if progression_data else 0,
                'current_risk_level': progression_data[0]['risk_level'] if progression_data else None
            }
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def acknowledge_alert(request, alert_id):
    """
    Acknowledge a symptom alert
    """
    try:
        alert = get_object_or_404(SymptomAlert, id=alert_id, user=request.user)
        
        if not alert.acknowledged:
            alert.acknowledge()  # Uses the model's acknowledge() method
            
        return Response({
            'success': True,
            'message': 'Alert acknowledged',
            'alert': {
                'id': alert.id,
                'acknowledged': alert.acknowledged,
                'acknowledged_at': alert.acknowledged_at
            }
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def get_risk_dashboard(request):
    """
    Get dashboard view of all pets with current risk levels
    """
    try:
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
            
            if latest_log:
                dashboard_data.append({
                    'pet_id': pet.id,
                    'pet_name': pet.name,
                    'animal_type': pet.animal_type,
                    'age': pet.age,
                    'last_logged': latest_log.symptom_date,
                    'current_risk_score': latest_log.risk_score,
                    'current_risk_level': latest_log.risk_level,
                    'active_alerts': active_alerts_count,
                    'symptoms': latest_log.symptoms
                })
        
        # Sort by risk score (highest first)
        dashboard_data.sort(key=lambda x: x['current_risk_score'], reverse=True)
        
        return Response({
            'pets': dashboard_data,
            'summary': {
                'total_pets': len(pets),
                'pets_with_logs': len(dashboard_data),
                'critical_pets': len([p for p in dashboard_data if p['current_risk_level'] == 'critical']),
                'high_risk_pets': len([p for p in dashboard_data if p['current_risk_level'] == 'high']),
                'total_active_alerts': sum(p['active_alerts'] for p in dashboard_data)
            }
        })
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# URL patterns to add to chatbot/urls.py:
"""
from utils.symptom_log_integration_example import (
    create_symptom_log,
    get_symptom_progression,
    acknowledge_alert,
    get_risk_dashboard
)

urlpatterns = [
    # ... existing patterns ...
    
    # Symptom logging endpoints
    path('symptom-logs/create/', create_symptom_log, name='create-symptom-log'),
    path('symptom-logs/pet/<int:pet_id>/progression/', get_symptom_progression, name='symptom-progression'),
    path('symptom-logs/alerts/<int:alert_id>/acknowledge/', acknowledge_alert, name='acknowledge-alert'),
    path('symptom-logs/dashboard/', get_risk_dashboard, name='risk-dashboard'),
]
"""
