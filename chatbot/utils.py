"""
Utility functions for chatbot/diagnosis functionality
Implements flagging logic, case ID generation, and helper functions
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from django.utils import timezone
from django.conf import settings
import google.generativeai as genai
import logging

logger = logging.getLogger(__name__)


def calculate_flag_level(assessment: List[Dict[str, Any]], symptoms: List[str]) -> str:
    """
    Calculate flag level based on assessment and symptoms
    
    Args:
        assessment: List of diagnosis assessments with likelihood and urgency
        symptoms: List of symptom strings
    
    Returns:
        str: Flag level - 'Emergency', 'Urgent', or 'Moderate'
    
    Business Rules:
        - Emergency: likelihood >= 0.90 AND urgency == 'severe'
        - Emergency: Any critical symptoms (seizure, difficulty breathing, severe bleeding)
        - Urgent: likelihood >= 0.75 AND urgency in ['moderate', 'severe']
        - Moderate: likelihood >= 0.60 (default)
    """
    if not assessment:
        return 'Moderate'
    
    # Get top diagnosis by likelihood
    top_diagnosis = max(assessment, key=lambda x: x.get('likelihood', 0))
    likelihood = top_diagnosis.get('likelihood', 0)
    urgency = str(top_diagnosis.get('urgency', '')).lower()
    
    # Normalize symptoms to lowercase for comparison
    symptoms_lower = [str(s).lower().strip() for s in symptoms if s]
    
    # EMERGENCY criteria
    # 1. High likelihood + severe urgency
    if likelihood >= 0.90 and urgency == 'severe':
        return 'Emergency'
    
    # 2. Critical symptoms present
    critical_symptoms = [
        'seizure', 'seizures',
        'difficulty breathing', 'labored breathing', 'gasping', 
        'severe bleeding', 'heavy bleeding', 'hemorrhage',
        'collapse', 'collapsed', 'unconscious',
        'toxin ingestion', 'poisoning', 'toxic',
        'bloat', 'gastric dilatation'
    ]
    
    for symptom in symptoms_lower:
        if any(critical in symptom for critical in critical_symptoms):
            return 'Emergency'
    
    # URGENT criteria
    if likelihood >= 0.75 and urgency in ['moderate', 'severe', 'urgent']:
        return 'Urgent'
    
    # Additional urgent symptoms
    urgent_symptoms = [
        'vomiting blood', 'blood in stool', 'blood in urine',
        'not eating', 'refusing food', 'anorexia',
        'extreme lethargy', 'weakness',
        'high fever', 'very hot'
    ]
    
    if likelihood >= 0.60:
        for symptom in symptoms_lower:
            if any(urgent in symptom for urgent in urgent_symptoms):
                return 'Urgent'
    
    # MODERATE (default)
    if likelihood >= 0.60:
        return 'Moderate'
    
    return 'Moderate'


def generate_case_id() -> str:
    """
    Generate unique case ID in format: #PDX-YYYY-MMDD-XXX
    
    Returns:
        str: Unique case ID
    
    Example:
        #PDX-2025-1101-001
    """
    from chatbot.models import SOAPReport
    
    # Get current date in format YYYY-MMDD
    today = datetime.now().strftime('%Y-%m%d')
    
    # Count existing cases for today
    today_prefix = f'#PDX-{today}'
    count = SOAPReport.objects.filter(
        case_id__startswith=today_prefix
    ).count()
    
    # Generate case ID with zero-padded sequence number
    sequence = str(count + 1).zfill(3)
    case_id = f'{today_prefix}-{sequence}'
    
    return case_id


def parse_duration_to_days(duration_str: str) -> Optional[int]:
    """
    Parse duration string to number of days
    
    Args:
        duration_str: Duration string like "3 days", "1 week", "2 hours"
    
    Returns:
        int or None: Number of days, or None if cannot parse
    
    Examples:
        "3 days" -> 3
        "1 week" -> 7
        "2 hours" -> 0
        "2 weeks" -> 14
    """
    if not duration_str or not isinstance(duration_str, str):
        return None
    
    duration_str = duration_str.lower().strip()
    
    try:
        # Extract number
        parts = duration_str.split()
        if not parts:
            return None
        
        # Get first number found
        number = None
        for part in parts:
            try:
                number = int(part)
                break
            except ValueError:
                continue
        
        if number is None:
            return None
        
        # Determine unit
        if any(unit in duration_str for unit in ['hour', 'hr']):
            return 0 if number < 24 else number // 24
        elif any(unit in duration_str for unit in ['day', 'dy']):
            return number
        elif any(unit in duration_str for unit in ['week', 'wk']):
            return number * 7
        elif any(unit in duration_str for unit in ['month', 'mo']):
            return number * 30
        else:
            # Default to days if no unit specified
            return number
    
    except Exception:
        return None


def format_soap_report_response(soap_report) -> Dict[str, Any]:
    """
    Format SOAPReport model instance to API response structure
    
    Args:
        soap_report: SOAPReport model instance
    
    Returns:
        dict: Formatted response data
    """
    return {
        'case_id': soap_report.case_id,
        'pet': {
            'id': soap_report.pet.id,
            'name': soap_report.pet.name,
            'animal_type': soap_report.pet.animal_type,
            'breed': soap_report.pet.breed or 'Mixed Breed',
            'age': soap_report.pet.age,
            'sex': soap_report.pet.sex,
            'weight': float(soap_report.pet.weight) if soap_report.pet.weight else None,
        },
        'owner': {
            'id': soap_report.pet.owner.id,
            'name': soap_report.pet.owner.get_full_name() or soap_report.pet.owner.username,
            'email': soap_report.pet.owner.email,
        },
        'subjective': soap_report.subjective,
        'objective': soap_report.objective,
        'assessment': soap_report.assessment,
        'plan': soap_report.plan,
        'flag_level': soap_report.flag_level,
        'date_generated': soap_report.date_generated.isoformat(),
        'date_flagged': soap_report.date_flagged.isoformat() if soap_report.date_flagged else None,
        'chat_conversation_id': soap_report.chat_conversation.id if soap_report.chat_conversation else None,
    }


def validate_symptoms_input(symptoms: Any) -> tuple[bool, Optional[str]]:
    """
    Validate symptoms input
    
    Args:
        symptoms: Symptoms input to validate
    
    Returns:
        tuple: (is_valid: bool, error_message: str or None)
    """
    if not symptoms:
        return False, "Symptoms are required"
    
    if not isinstance(symptoms, list):
        return False, "Symptoms must be a list"
    
    if len(symptoms) == 0:
        return False, "At least one symptom is required"
    
    # Check if all symptoms are strings and not empty
    for symptom in symptoms:
        if not isinstance(symptom, str):
            return False, "All symptoms must be strings"
        if not symptom.strip():
            return False, "Symptoms cannot be empty strings"
    
    return True, None


def generate_care_advice(severity_level: str, assessment: List[Dict[str, Any]]) -> List[str]:
    """
    Generate care advice based on severity level and assessment
    
    Args:
        severity_level: Severity level (Emergency, Urgent, Moderate)
        assessment: List of diagnosis assessments
    
    Returns:
        list: List of care advice strings
    """
    base_advice = [
        "Monitor your pet closely for any changes in symptoms",
        "Ensure your pet has access to fresh water at all times",
        "Provide a quiet, comfortable resting area",
        "Keep track of eating and drinking habits",
        "Note any changes in behavior or symptom severity"
    ]
    
    if severity_level == 'Emergency':
        return [
            "🚨 SEEK IMMEDIATE VETERINARY CARE - This is an emergency situation",
            "Do NOT wait - contact your nearest emergency veterinary clinic now",
            "Keep your pet calm and comfortable during transport",
            "Have someone call ahead to the emergency clinic if possible",
            "Bring all relevant medical records and medications",
            "Note the time symptoms started and any changes",
        ]
    
    elif severity_level == 'Urgent':
        return [
            "⚠️ Schedule a veterinary appointment within 24-48 hours",
            "Monitor symptoms closely and call your vet if they worsen",
            "Keep your pet comfortable and limit physical activity",
            "Document all symptoms with photos/videos if applicable",
            "Ensure your pet is eating and drinking (contact vet if not)",
            "Keep your pet away from other animals to prevent spread if contagious",
        ]
    
    else:  # Moderate
        return [
            "Schedule a routine veterinary check-up in the next few days",
            "Monitor symptoms and note any changes",
            "Maintain normal feeding and exercise routines unless otherwise advised",
            "Keep your pet comfortable and provide plenty of rest",
            "Contact your vet if symptoms persist or worsen",
            "Take photos/videos of symptoms to show your veterinarian",
        ]


def determine_severity_level_from_urgency(urgency: str) -> str:
    """
    Map urgency level to severity level
    
    Args:
        urgency: Urgency level from ML model
    
    Returns:
        str: Severity level (Emergency, Urgent, Moderate)
    """
    urgency_lower = str(urgency).lower().strip()
    
    severity_map = {
        'emergency': 'Emergency',
        'immediate': 'Emergency',
        'severe': 'Emergency',
        'critical': 'Emergency',
        'urgent': 'Urgent',
        'soon': 'Urgent',
        'moderate': 'Moderate',
        'mild': 'Moderate',
        'routine': 'Moderate',
        'low': 'Moderate',
    }
    
    return severity_map.get(urgency_lower, 'Moderate')


def get_gemini_client():
    """
    Configure and return Gemini model
    
    Returns:
        GenerativeModel: Configured Gemini model instance
    
    Raises:
        Exception: If API key is invalid or all models fail
    
    Notes:
        - Tries multiple models with fallbacks
        - Handles quota limits gracefully
        - Tests each model before returning
    """
    try:
        # Check if API key is set
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            raise Exception("GEMINI_API_KEY is not set in your .env file. Please add GEMINI_API_KEY=your-key-here to your .env file.")
        
        # Strip whitespace in case there are spaces
        api_key = api_key.strip()
        if not api_key:
            raise Exception("GEMINI_API_KEY is empty in your .env file. Please check your .env file and add a valid API key.")
        
        logger.info(f"🔑 Using Gemini API key (length: {len(api_key)})")
        genai.configure(api_key=api_key)
        
        print("=== CHECKING GEMINI API CONNECTION ===")
        try:
            available_models = list(genai.list_models())
            print(f"Found {len(available_models)} available models:")
            
            # Use the first available model that supports generateContent
            for model in available_models:
                if 'generateContent' in model.supported_generation_methods:
                    model_name = model.name  # This already includes 'models/' prefix
                    print(f"✅ Using model: {model_name}")
                    
                    # Create the model using the exact name from the API
                    test_model = genai.GenerativeModel(model_name)
                    
                    # Test with a very simple prompt to avoid quota issues
                    try:
                        test_response = test_model.generate_content("Hi")
                        if test_response and hasattr(test_response, 'text') and test_response.text:
                            print(f"✅ Model {model_name} working successfully!")
                            return test_model
                    except Exception as quota_error:
                        if "quota" in str(quota_error).lower():
                            print(f"⚠️ Quota exceeded for {model_name}, trying next model...")
                            continue
                        else:
                            raise quota_error
                        
        except Exception as list_error:
            error_str = str(list_error)
            print(f"❌ Could not use models: {list_error}")
            
            # Check for API key issues
            if "403" in error_str or "leaked" in error_str.lower() or "invalid" in error_str.lower() or "permission" in error_str.lower():
                raise Exception("Gemini API key is invalid or has been revoked. Please get a new API key from https://aistudio.google.com/app/apikey and update your .env file.")
        
        # If quota exceeded, try the free tier models specifically
        print("\n=== TRYING FREE TIER MODELS ===")
        free_tier_models = [
            'models/gemini-1.5-flash',  # Most likely to work on free tier
            'models/gemini-1.5-pro',
            'models/gemini-pro',
            'gemini-1.5-flash',  # Try without 'models/' prefix
            'gemini-pro'
        ]
        
        api_key_error = False
        for model_name in free_tier_models:
            try:
                print(f"Trying free tier model: {model_name}")
                model = genai.GenerativeModel(model_name)
                
                # Test with minimal prompt
                test_response = model.generate_content("Hi")
                if test_response and hasattr(test_response, 'text') and test_response.text:
                    print(f"✅ Free tier model {model_name} works!")
                    return model
                    
            except Exception as e:
                error_str = str(e)
                if "403" in error_str or "leaked" in error_str.lower() or "invalid" in error_str.lower() or "permission" in error_str.lower():
                    api_key_error = True
                    print(f"❌ API key error for {model_name}: {e}")
                    break  # No point trying other models if API key is invalid
                elif "quota" in error_str.lower():
                    print(f"⚠️ Quota exceeded for {model_name}")
                    continue
                else:
                    print(f"❌ Free tier {model_name} failed: {e}")
                    continue
        
        if api_key_error:
            raise Exception("Gemini API key is invalid or has been revoked. Please get a new API key from https://aistudio.google.com/app/apikey and update your .env file.")
        
        raise Exception("All models quota exceeded. Please upgrade your Gemini API plan or wait for quota reset.")
        
    except Exception as e:
        print(f"❌ Gemini configuration error: {e}")
        raise e

