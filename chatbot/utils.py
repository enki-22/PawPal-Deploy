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
import json
import hashlib
import os

logger = logging.getLogger(__name__)

# Cache for Gemini model name to avoid re-scanning on every call
CACHED_GEMINI_MODEL_NAME = None

# Persistent response cache file path
CACHE_FILE = os.path.join(settings.BASE_DIR, 'gemini_response_cache.json')


def get_cached_response(prompt_text: str) -> Optional[str]:
    """
    Check if a cached response exists for the given prompt.
    
    Args:
        prompt_text: The full prompt text to look up
        
    Returns:
        Cached response text if found, None otherwise
    """
    try:
        if not os.path.exists(CACHE_FILE):
            return None
        
        # Create hash of prompt for lookup
        prompt_hash = hashlib.md5(prompt_text.encode('utf-8')).hexdigest()
        
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            cache = json.load(f)
        
        if prompt_hash in cache:
            logger.info(f"💾 Cache HIT for prompt hash: {prompt_hash[:8]}...")
            return cache[prompt_hash]
        
        return None
        
    except Exception as e:
        logger.warning(f"⚠️ Error reading cache: {e}")
        return None


def save_response_to_cache(prompt_text: str, response_text: str) -> bool:
    """
    Save a response to the persistent cache.
    
    Args:
        prompt_text: The full prompt text (used to generate hash key)
        response_text: The response text to cache
        
    Returns:
        True if saved successfully, False otherwise
    """
    try:
        # Create hash of prompt
        prompt_hash = hashlib.md5(prompt_text.encode('utf-8')).hexdigest()
        
        # Load existing cache or create new
        cache = {}
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                    cache = json.load(f)
            except (json.JSONDecodeError, IOError):
                cache = {}
        
        # Add new entry
        cache[prompt_hash] = response_text
        
        # Save cache
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
        
        logger.info(f"💾 Cache SAVED for prompt hash: {prompt_hash[:8]}...")
        return True
        
    except Exception as e:
        logger.warning(f"⚠️ Error saving to cache: {e}")
        return False


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
    Configure and return Gemini model with caching for performance
    
    Returns:
        GenerativeModel: Configured Gemini model instance
    
    Raises:
        Exception: If API key is invalid or all models fail
    
    Notes:
        - Uses cached model name to avoid re-scanning on every call
        - Tries multiple models with fallbacks
        - Handles quota limits gracefully
        - Tests each model before returning
    """
    global CACHED_GEMINI_MODEL_NAME
    
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
        
        # Step 1: Try cached model first (if available)
        if CACHED_GEMINI_MODEL_NAME:
            try:
                print(f"=== USING CACHED MODEL: {CACHED_GEMINI_MODEL_NAME} ===")
                cached_model = genai.GenerativeModel(CACHED_GEMINI_MODEL_NAME)
                
                # Quick test to ensure it still works
                test_response = cached_model.generate_content("Hi")
                if test_response and hasattr(test_response, 'text') and test_response.text:
                    logger.info(f"✅ Using cached Gemini model: {CACHED_GEMINI_MODEL_NAME}")
                    return cached_model
                else:
                    print(f"⚠️ Cached model {CACHED_GEMINI_MODEL_NAME} returned empty response, re-scanning...")
                    CACHED_GEMINI_MODEL_NAME = None  # Clear cache if it fails
            except Exception as e:
                error_str = str(e).lower()
                # If it's an API key error, don't try other models
                if "403" in str(e) or "leaked" in error_str or "invalid" in error_str or "permission" in error_str:
                    print(f"❌ API key error with cached model: {e}")
                    raise Exception("Gemini API key is invalid or has been revoked. Please get a new API key from https://aistudio.google.com/app/apikey and update your .env file.")
                # For other errors (quota, 404, etc.), clear cache and continue to dynamic search
                print(f"⚠️ Cached model {CACHED_GEMINI_MODEL_NAME} failed: {type(e).__name__}: {e}, re-scanning...")
                CACHED_GEMINI_MODEL_NAME = None
        
        # Step 2: Dynamic search (only if cache is empty or failed)
        print("=== CHECKING GEMINI API CONNECTION (DYNAMIC SEARCH) ===")
        
        # Get all available models
        try:
            available_models = list(genai.list_models())
            print(f"Found {len(available_models)} available models")
        except Exception as list_error:
            error_str = str(list_error)
            print(f"❌ Could not list models: {list_error}")
            
            # Check for API key issues
            if "403" in error_str or "leaked" in error_str.lower() or "invalid" in error_str.lower() or "permission" in error_str.lower():
                raise Exception("Gemini API key is invalid or has been revoked. Please get a new API key from https://aistudio.google.com/app/apikey and update your .env file.")
            raise Exception(f"Failed to list Gemini models: {list_error}")
        
        # Filter models that support generateContent
        supported_models = []
        for model in available_models:
            if 'generateContent' in model.supported_generation_methods:
                supported_models.append(model.name)  # model.name already includes 'models/' prefix
        
        if not supported_models:
            raise Exception("No Gemini models found that support generateContent")
        
        print(f"Found {len(supported_models)} models supporting generateContent")
        
        # Sort models: prioritize those containing "1.5" and "flash" (case-insensitive)
        def get_priority_score(model_name):
            """Higher score = higher priority"""
            name_lower = model_name.lower()
            score = 0
            if "1.5" in name_lower:
                score += 10
            if "flash" in name_lower:
                score += 5
            if "1.5" in name_lower and "flash" in name_lower:
                score += 5  # Bonus for both
            return score
        
        # Sort by priority (highest first), then alphabetically
        sorted_models = sorted(supported_models, key=lambda x: (-get_priority_score(x), x))
        
        print(f"\n=== TRYING MODELS (PRIORITIZING HIGH-QUOTA MODELS) ===")
        for i, model_name in enumerate(sorted_models, 1):
            priority_info = ""
            if "1.5" in model_name.lower() and "flash" in model_name.lower():
                priority_info = " [HIGH-QUOTA PRIORITY]"
            
            print(f"[{i}/{len(sorted_models)}] Trying model: {model_name}{priority_info}")
            
            try:
                # Create the model
                test_model = genai.GenerativeModel(model_name)
                
                # Test with a very simple prompt
                test_response = test_model.generate_content("Hi")
                
                if test_response and hasattr(test_response, 'text') and test_response.text:
                    print(f"✅ Found high-quota model: {model_name}")
                    logger.info(f"✅ Selected Gemini model: {model_name}")
                    
                    # Step 3: Cache the successful model name
                    CACHED_GEMINI_MODEL_NAME = model_name
                    print(f"💾 Cached model name for future requests: {CACHED_GEMINI_MODEL_NAME}")
                    
                    return test_model
                else:
                    print(f"⚠️ Model {model_name} returned empty response, trying next...")
                    continue
                    
            except Exception as e:
                # Handle ALL errors gracefully - continue to next model
                error_str = str(e).lower()
                
                # Check for API key issues (these should stop the loop)
                if "403" in str(e) or "leaked" in error_str or "invalid" in error_str or "permission" in error_str:
                    print(f"❌ API key error for {model_name}: {e}")
                    raise Exception("Gemini API key is invalid or has been revoked. Please get a new API key from https://aistudio.google.com/app/apikey and update your .env file.")
                
                # For all other errors (quota, 404, 400, etc.), just continue
                print(f"⚠️ Model {model_name} failed: {type(e).__name__}: {e}")
                continue
        
        # If we get here, all models failed
        raise Exception("All Gemini models failed. Please check your API quota or try again later.")
        
    except Exception as e:
        print(f"❌ Gemini configuration error: {e}")
        raise e


def analyze_symptom_progression(pet_id: int) -> Dict[str, Any]:
    """
    Analyze symptom progression using Gemini AI.
    
    Fetches the last 7 days of SymptomLog for the pet and uses Gemini
    to analyze trends, calculate risk score, and predict next 24h.
    
    Args:
        pet_id: ID of the pet to analyze
    
    Returns:
        dict: Analysis result with structure:
        {
            "risk_score": int (0-100),
            "urgency": str ("Low" | "Medium" | "High" | "Critical"),
            "trend": str ("Worsening" | "Improving" | "Stable"),
            "prediction": str (AI forecast),
            "alert_needed": bool
        }
    """
    from datetime import timedelta
    from django.utils import timezone
    from pets.models import Pet
    from .models import SymptomLog
    
    try:
        # Get pet
        try:
            pet = Pet.objects.get(id=pet_id)
        except Pet.DoesNotExist:
            logger.error(f"Pet with id {pet_id} not found")
            return {
                "risk_score": 0,
                "urgency": "Low",
                "trend": "No data",
                "prediction": "No symptom logs available for analysis.",
                "alert_needed": False
            }
        
        # Fetch last 7 days of logs
        seven_days_ago = timezone.now().date() - timedelta(days=7)
        logs = SymptomLog.objects.filter(
            pet=pet,
            symptom_date__gte=seven_days_ago
        ).order_by('symptom_date')
        
        # If no logs, return default structure
        if not logs.exists():
            logger.info(f"No symptom logs found for pet {pet_id} in last 7 days")
            return {
                "risk_score": 0,
                "urgency": "Low",
                "trend": "No data",
                "prediction": "No symptom logs available for analysis. Please log symptoms to get AI insights.",
                "alert_needed": False
            }
        
        # Format logs for Gemini and calculate deterministic score
        logs_data = []
        all_severity_scores = []  # Collect all severity scores for deterministic calculation
        
        for log in logs:
            log_entry = {
                "date": log.symptom_date.strftime("%Y-%m-%d"),
                "symptoms": log.symptoms if isinstance(log.symptoms, list) else [],
                "severity": log.overall_severity if hasattr(log, 'overall_severity') else "moderate",
                "notes": log.notes or ""
            }
            
            # Add severity scores if available (from symptom_details or create from symptoms)
            if hasattr(log, 'symptom_details') and log.symptom_details:
                log_entry["severity_scores"] = log.symptom_details
                # Collect severity scores for deterministic calculation
                severity_values = [v for v in log.symptom_details.values() if isinstance(v, (int, float))]
                all_severity_scores.extend(severity_values)
            else:
                # Create default severity scores (5/10) for each symptom
                log_entry["severity_scores"] = {
                    symptom: 5 for symptom in log_entry["symptoms"]
                }
                # Add default scores to collection
                all_severity_scores.extend([5] * len(log_entry["symptoms"]))
            
            logs_data.append(log_entry)
        
        # Calculate deterministic score: Average Severity * 10
        deterministic_score = 0
        if all_severity_scores:
            avg_severity = sum(all_severity_scores) / len(all_severity_scores)
            deterministic_score = int(avg_severity * 10)
            deterministic_score = max(0, min(100, deterministic_score))  # Clamp to 0-100
        else:
            # Fallback if no severity scores
            deterministic_score = 50
        
        # Build Gemini prompt
        species = pet.animal_type or "Unknown"
        pet_name = pet.name or "Pet"
        
        logs_text = "\n".join([
            f"Date: {log['date']}\n"
            f"Symptoms: {', '.join(log['symptoms'])}\n"
            f"Severity Scores: {log['severity_scores']}\n"
            f"Notes: {log['notes']}\n"
            for log in logs_data
        ])
        
        prompt = f"""You are a Veterinary Data Analyst. Review this 7-day symptom log for a {species} named {pet_name}.

SYMPTOM LOG DATA:
{logs_text}

TASK:
1. Calculate a Risk Score (0-100) based on symptom severity, frequency, and progression.
2. Identify Trend: Is the pet's condition Worsening, Improving, or Stable?
3. Predict next 24h: What is likely to happen based on current patterns?
4. Determine if an alert is needed (true if risk_score >= 70 or trend is Worsening significantly).

OUTPUT JSON ONLY (no markdown, no explanation outside JSON):
{{
    "risk_score": integer (0-100),
    "urgency": "Low" | "Medium" | "High" | "Critical",
    "trend": "Worsening" | "Improving" | "Stable",
    "prediction": "Brief forecast for next 24 hours",
    "alert_needed": boolean
}}

JSON Response:"""
        
        # Call Gemini (with caching)
        try:
            # Check cache first
            cached_response = get_cached_response(prompt)
            if cached_response:
                logger.info(f"💾 Using cached response for pet {pet_id} symptom analysis")
                response_text = cached_response
            else:
                # No cache hit - call Gemini
                model = get_gemini_client()
                logger.info(f"🤖 Analyzing symptom progression for pet {pet_id} using Gemini...")
                
                response = model.generate_content(prompt)
                
                if not response or not hasattr(response, 'text') or not response.text:
                    logger.warning("⚠️ Gemini returned empty response for symptom analysis")
                    return _fallback_to_deterministic(deterministic_score, logs_data)
                
                response_text = response.text.strip()
                
                # Save to cache for future requests
                save_response_to_cache(prompt, response_text)
            
            # Extract JSON from response
            logger.info(f"📋 Gemini analysis response: {response_text[:200]}...")
            
            # Try to extract JSON (handle markdown code blocks)
            json_text = _extract_json_from_text(response_text)
            
            try:
                analysis_result = json.loads(json_text)
                logger.info("✓ Successfully parsed Gemini analysis response")
                
                # Validate and normalize with safety guardrails
                return _normalize_health_analysis(analysis_result, deterministic_score, logs_data)
                
            except json.JSONDecodeError as e:
                logger.error(f"✗ Failed to parse Gemini JSON response: {e}")
                logger.error(f"   Response text: {response_text}")
                # Fallback to deterministic score
                return _fallback_to_deterministic(deterministic_score, logs_data)
        
        except Exception as e:
            logger.error(f"✗ Gemini analysis failed: {e}")
            logger.exception(e)
            # Fallback to deterministic score
            return _fallback_to_deterministic(deterministic_score, logs_data)
    
    except Exception as e:
        logger.error(f"✗ Symptom progression analysis failed: {e}")
        logger.exception(e)
        return _default_health_analysis()


def _extract_json_from_text(text: str) -> str:
    """Extract JSON from text (handle markdown code blocks)."""
    
    # Remove markdown code blocks if present
    if "```json" in text:
        start = text.find("```json") + 7
        end = text.find("```", start)
        if end != -1:
            return text[start:end].strip()
    elif "```" in text:
        start = text.find("```") + 3
        end = text.find("```", start)
        if end != -1:
            return text[start:end].strip()
    
    # Try to find JSON object boundaries
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end+1]
    
    return text


def _normalize_health_analysis(result: Dict[str, Any], deterministic_score: int, logs_data: List[Dict]) -> Dict[str, Any]:
    """
    Normalize and validate the health analysis result with safety guardrails.
    
    Args:
        result: Raw AI analysis result
        deterministic_score: Calculated score based on average severity
        logs_data: Log data used for analysis
    """
    # Extract and clamp risk_score
    ai_risk_score = int(result.get("risk_score", 0))
    ai_risk_score = max(0, min(100, ai_risk_score))  # Clamp to 0-100
    
    # Validate urgency and normalize
    ai_urgency = result.get("urgency", "Low")
    valid_urgencies = ["Low", "Medium", "High", "Critical"]
    if ai_urgency not in valid_urgencies:
        # Calculate urgency based on score if invalid
        if ai_risk_score < 30:
            ai_urgency = "Low"
        elif ai_risk_score < 50:
            ai_urgency = "Medium"
        elif ai_risk_score < 80:
            ai_urgency = "High"
        else:
            ai_urgency = "Critical"
        logger.warning(f"⚠️ Invalid urgency '{result.get('urgency')}' normalized to '{ai_urgency}' based on score")
    
    # Validate trend
    ai_trend = result.get("trend", "Stable")
    valid_trends = ["Worsening", "Improving", "Stable"]
    if ai_trend not in valid_trends:
        ai_trend = "Stable"
        logger.warning(f"⚠️ Invalid trend '{result.get('trend')}' normalized to 'Stable'")
    
    # === SANITY CHECK: Compare AI score with deterministic score ===
    score_variance = abs(ai_risk_score - deterministic_score)
    ai_variance_detected = False
    final_risk_score = ai_risk_score
    trend_analysis = result.get("trend_analysis", result.get("prediction", "Unable to generate analysis."))
    
    if score_variance > 50:
        # Large variance detected - flag it
        ai_variance_detected = True
        logger.warning(f"🚨 AI Variance Detected: AI score={ai_risk_score}, Deterministic={deterministic_score}, Variance={score_variance}")
        
        # Use the higher score (more conservative/safe)
        final_risk_score = max(ai_risk_score, deterministic_score)
        
        # Append variance flag to trend analysis
        trend_analysis = f"{trend_analysis} [AI Variance: AI={ai_risk_score}, Math={deterministic_score}, Using={final_risk_score}]"
        
        # Recalculate urgency based on final score
        if final_risk_score < 30:
            ai_urgency = "Low"
        elif final_risk_score < 50:
            ai_urgency = "Medium"
        elif final_risk_score < 80:
            ai_urgency = "High"
        else:
            ai_urgency = "Critical"
    
    normalized = {
        "risk_score": final_risk_score,
        "urgency": ai_urgency,
        "trend": ai_trend,
        "prediction": result.get("prediction", "Unable to generate prediction."),
        "alert_needed": bool(result.get("alert_needed", False)),
        "trend_analysis": trend_analysis
    }
    
    # Log final normalized result
    if ai_variance_detected:
        logger.warning(f"✅ Final normalized result (with variance correction): {normalized}")
    else:
        logger.info(f"✅ Final normalized result: {normalized}")
    
    return normalized


def _fallback_to_deterministic(deterministic_score: int, logs_data: List[Dict]) -> Dict[str, Any]:
    """
    Fallback to deterministic calculation when AI fails.
    
    Args:
        deterministic_score: Calculated score based on average severity
        logs_data: Log data used for analysis (can be empty list)
    """
    # Ensure deterministic_score is valid
    deterministic_score = max(0, min(100, deterministic_score))
    
    # Calculate urgency from deterministic score
    if deterministic_score < 30:
        urgency = "Low"
    elif deterministic_score < 50:
        urgency = "Medium"
    elif deterministic_score < 80:
        urgency = "High"
    else:
        urgency = "Critical"
    
    # Determine trend from logs (simple heuristic: compare first and last severity)
    trend = "Stable"
    if logs_data and len(logs_data) >= 2:
        first_scores = list(logs_data[0].get("severity_scores", {}).values())
        last_scores = list(logs_data[-1].get("severity_scores", {}).values())
        
        if first_scores and last_scores:
            first_avg = sum(first_scores) / len(first_scores)
            last_avg = sum(last_scores) / len(last_scores)
            
            if last_avg > first_avg + 2:
                trend = "Worsening"
            elif last_avg < first_avg - 2:
                trend = "Improving"
    
    logger.info(f"📊 Using deterministic fallback: score={deterministic_score}, urgency={urgency}, trend={trend}")
    
    return {
        "risk_score": deterministic_score,
        "urgency": urgency,
        "trend": trend,
        "prediction": "AI unavailable. Risk calculated based on severity average. Please consult with a veterinarian for detailed analysis.",
        "alert_needed": deterministic_score >= 70,
        "trend_analysis": "AI unavailable. Risk calculated based on severity average."
    }


def _default_health_analysis() -> Dict[str, Any]:
    """Return default health analysis when AI fails and no logs available."""
    return {
        "risk_score": 0,
        "urgency": "Low",
        "trend": "Stable",
        "prediction": "Analysis unavailable. Please consult with a veterinarian.",
        "alert_needed": False,
        "trend_analysis": "No data available for analysis."
    }

