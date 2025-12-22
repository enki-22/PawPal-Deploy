from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Conversation, Message
from django.core.paginator import Paginator
from django.db.models import Q
from django.utils import timezone
import json
import google.generativeai as genai
from django.conf import settings
import uuid
from datetime import datetime, timedelta
import os
import pickle
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from django.conf import settings
from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.cache import cache
from pets.models import Pet
from .models import Conversation, Message, AIDiagnosis, SOAPReport, DiagnosisSuggestion
# Note: image_classifier is now lazily loaded via analyze_pet_image when needed
import logging
from .utils import get_gemini_client, get_cached_response, save_response_to_cache
logger = logging.getLogger(__name__)

PAWPAL_MODEL = None
PAWPAL_PREPROCESSOR = None
PAWPAL_LABEL_ENCODER = None
PAWPAL_DISEASE_METADATA = None
PAWPAL_MODEL_LOADED = False
PAWPAL_MODEL_ERROR = None

ALLOWED_SPECIES = ["Dog", "Cat", "Rabbit", "Bird", "Fish", "Turtle", "Hamster", "Pet", "Unknown"]

# Import shared model utilities for deserialization
try:
    from model_utils import _ravel_column
except ImportError:
    # Fallback if model_utils not available
    def _ravel_column(x):
        """Helper to flatten a single column for TF-IDF - needed for model loading."""
        return np.ravel(x)
    logger.warning("Could not import _ravel_column from model_utils")

try:
    from train_model import CANONICAL_SYMPTOMS, extract_symptoms_from_text
except Exception:
    CANONICAL_SYMPTOMS = []

    def extract_symptoms_from_text(text: str) -> list:  # type: ignore[no-redef]
        return []

    logger.warning("Could not import CANONICAL_SYMPTOMS from train_model.py; symptom checker validation will be limited.")


def load_pawpal_lightgbm():
    global PAWPAL_MODEL, PAWPAL_PREPROCESSOR, PAWPAL_LABEL_ENCODER, PAWPAL_DISEASE_METADATA, PAWPAL_MODEL_LOADED, PAWPAL_MODEL_ERROR

    if (
        PAWPAL_MODEL_LOADED
        and PAWPAL_MODEL is not None
        and PAWPAL_PREPROCESSOR is not None
        and PAWPAL_LABEL_ENCODER is not None
    ):
        return PAWPAL_MODEL, PAWPAL_PREPROCESSOR, PAWPAL_LABEL_ENCODER, PAWPAL_DISEASE_METADATA

    base_dir = getattr(settings, "BASE_DIR", None)
    if base_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    model_path = os.path.join(str(base_dir), "pawpal_model.pkl")
    label_path = os.path.join(str(base_dir), "pawpal_label_encoder.pkl")
    metadata_path = os.path.join(str(base_dir), "pawpal_disease_metadata.json")

    try:
        # Try joblib first (better for sklearn models)
        try:
            artifacts = joblib.load(model_path)
        except Exception:
            # Fallback to pickle
            with open(model_path, "rb") as f:
                artifacts = pickle.load(f)

        model = artifacts.get("model")
        preprocessor = artifacts.get("preprocessor")

        # Try joblib first for label encoder
        try:
            label_encoder = joblib.load(label_path)
        except Exception:
            with open(label_path, "rb") as f:
                label_encoder = pickle.load(f)

        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                disease_metadata = json.load(f)
        else:
            disease_metadata = {}

        if model is None or preprocessor is None or label_encoder is None:
            raise RuntimeError("Loaded PawPal artifacts are incomplete.")

        PAWPAL_MODEL = model
        PAWPAL_PREPROCESSOR = preprocessor
        PAWPAL_LABEL_ENCODER = label_encoder
        PAWPAL_DISEASE_METADATA = disease_metadata
        PAWPAL_MODEL_LOADED = True
        PAWPAL_MODEL_ERROR = None

        logger.info("PawPal LightGBM model loaded successfully for symptom checker.")
        return PAWPAL_MODEL, PAWPAL_PREPROCESSOR, PAWPAL_LABEL_ENCODER, PAWPAL_DISEASE_METADATA
    except Exception as e:
        PAWPAL_MODEL = None
        PAWPAL_PREPROCESSOR = None
        PAWPAL_LABEL_ENCODER = None
        PAWPAL_DISEASE_METADATA = None
        PAWPAL_MODEL_LOADED = False
        error_msg = str(e)
        PAWPAL_MODEL_ERROR = error_msg
        
        # Provide helpful error message for common serialization issue
        if "_ravel_column" in error_msg or "Can't get attribute" in error_msg:
            logger.error(
                "Model loading failed due to pickle serialization issue. "
                "The model needs to be retrained. Run: python train_model.py"
            )
            raise RuntimeError(
                "Disease prediction model needs to be retrained. "
                "Please run 'python train_model.py' to regenerate the model with proper serialization."
            )
        
        logger.exception("Failed to load PawPal LightGBM model: %s", e)
        raise

def _rate_limit_symptom_checker(user_id: int, max_requests: int = 10, window_seconds: int = 60) -> bool:
    """Simple per-user rate limit: returns True if user is over limit."""
    if not user_id:
        return False
    cache_key = f"symptom_checker_rl_{user_id}"
    now_ts = datetime.now().timestamp()
    attempts = cache.get(cache_key, [])
    # keep attempts within window
    threshold = now_ts - window_seconds
    attempts = [ts for ts in attempts if ts >= threshold]
    if len(attempts) >= max_requests:
        cache.set(cache_key, attempts, timeout=window_seconds + 5)
        return True
    attempts.append(now_ts)
    cache.set(cache_key, attempts, timeout=window_seconds + 5)
    return False


def _build_feature_row_from_payload(payload: dict) -> dict:
    """Build a single feature row matching train_model engineer_features structure."""
    species_raw = (payload.get("species") or "").strip().capitalize()
    species = species_raw or "Dog"

    urgency = (payload.get("urgency") or "moderate").strip().lower()
    if urgency not in {"mild", "moderate", "severe"}:
        urgency = "moderate"

    symptoms_list = list(payload.get("symptoms_list") or [])
    # normalize to canonical tokens
    normalized = []
    for s in symptoms_list:
        if not s:
            continue
        token = str(s).strip().lower()
        if token in CANONICAL_SYMPTOMS:
            normalized.append(token)
        else:
            # allow non-canonical but they will not map to has_* flags
            normalized.append(token)

    symptom_count = len(normalized)
    symptoms_text = payload.get("symptoms_text") or ", ".join(normalized)

    # urgency encoding consistent with engineer_features
    urgency_map = {"mild": 1, "moderate": 2, "severe": 3}
    urgency_encoded = urgency_map.get(urgency, 2)

    contagious_flag = 0

    # category counts
    respiratory_symptoms = ['coughing', 'sneezing', 'wheezing', 'labored_breathing', 'nasal_discharge', 'difficulty_breathing']
    digestive_symptoms = ['vomiting', 'diarrhea', 'constipation', 'loss_of_appetite']
    skin_symptoms = ['scratching', 'itching', 'hair_loss', 'red_skin', 'skin_lesions']

    respiratory_count = sum(1 for s in normalized if s in respiratory_symptoms)
    digestive_count = sum(1 for s in normalized if s in digestive_symptoms)
    skin_count = sum(1 for s in normalized if s in skin_symptoms)

    # severity_score formula from engineer_features
    severity_score = urgency_encoded + (symptom_count / 3.0) + contagious_flag * 2

    duration_days = payload.get("duration_days")
    try:
        duration_days_val = float(duration_days) if duration_days is not None else 3.0
    except Exception:
        duration_days_val = 3.0

    row = {
        "species": species,
        "symptoms_text": symptoms_text,
        "symptoms_list": normalized,
        "symptom_count": symptom_count,
        "urgency": urgency,
        "contagious_flag": contagious_flag,
        "urgency_encoded": urgency_encoded,
        "respiratory_count": respiratory_count,
        "digestive_count": digestive_count,
        "skin_count": skin_count,
        "severity_score": severity_score,
        "duration_days": duration_days_val,
    }

    # add has_* flags for all canonical symptoms
    for symptom in CANONICAL_SYMPTOMS:
        row[f"has_{symptom}"] = 1 if symptom in normalized else 0

    return row


def _validate_symptom_checker_payload(data: dict) -> tuple[bool, dict | None, Response | None]:
    # Check if species is exotic (handled dynamically by AI)
    species_raw = str(data.get("species") or "").strip().capitalize()
    EXOTIC_SPECIES = ['Bird', 'Fish', 'Reptile', 'Turtle', 'Amphibian']
    is_exotic = species_raw in EXOTIC_SPECIES
    
    # For exotic species, only require minimal fields (AI handles the rest dynamically)
    if is_exotic:
        required_fields = [
            "pet_name",
            "pet_id",
            "species",
            "user_notes",
        ]
    else:
        # Standard species require full questionnaire fields
        required_fields = [
            "pet_name",
            "pet_id",
            "species",
            "urgency",
            "duration_days",
            "symptoms_list",
            "symptoms_text",
            "symptom_count",
            "main_concern",
            "severity",
        ]
    
    missing = [f for f in required_fields if f not in data]
    if missing:
        logger.error(f"Validation failed - Missing required fields: {missing}. Received data: {data}")
        return False, None, Response(
            {
                "success": False,
                "error": f"Missing required fields: {', '.join(missing)}",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    # Validate optional emergency_data structure if provided
    emergency_data = data.get('emergency_data')
    if emergency_data and isinstance(emergency_data, dict):
        emergency_screen = emergency_data.get('emergencyScreen', {})
        # Validate that if emergency_data exists, it has the right structure
        if not isinstance(emergency_screen, dict):
            logger.warning(f"Invalid emergency_data structure: {emergency_data}")
            data['emergency_data'] = None  # Clear invalid data
    
    # Validate progression if provided
    progression = data.get('progression')
    if progression:
        valid_progression = ['getting_worse', 'staying_same', 'getting_better', 'intermittent']
        if progression not in valid_progression:
            logger.warning(f"Invalid progression value: {progression}. Must be one of: {valid_progression}")
            data['progression'] = None  # Clear invalid data
    
    # HYBRID TRIAGE: Validate and sanitize user_notes
    user_notes = data.get('user_notes', '')
    if user_notes and isinstance(user_notes, str):
        # Sanitize: trim whitespace and limit length to prevent abuse
        user_notes = user_notes.strip()[:1000]  # Max 1000 characters
        data['user_notes'] = user_notes
        if user_notes:
            logger.info(f"🔍 HYBRID TRIAGE: user_notes received ({len(user_notes)} chars): '{user_notes[:100]}...'")
    else:
        data['user_notes'] = ''

    species = species_raw  # Use the species we already determined above
    if species not in ALLOWED_SPECIES:
        logger.error(f"Validation failed - Invalid species: {species}. Allowed: {ALLOWED_SPECIES}")
        return False, None, Response(
            {
                "success": False,
                "error": f"Invalid species '{species}'. Allowed: {', '.join(ALLOWED_SPECIES)}",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Skip urgency, severity, and duration_days validation for exotic species (handled by AI)
    if not is_exotic:
        urgency = str(data.get("urgency") or "").strip().lower()
        if urgency not in {"mild", "moderate", "severe"}:
            logger.error(f"Validation failed - Invalid urgency: {urgency}. Must be one of: mild, moderate, severe")
            return False, None, Response(
                {
                    "success": False,
                    "error": "Invalid urgency. Must be one of: mild, moderate, severe.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Skip symptoms_list validation for exotic species (symptoms extracted from user_notes by AI)
    if not is_exotic:
        provided_symptoms = list(data.get("symptoms_list") or [])
        if CANONICAL_SYMPTOMS:
            invalid_symptoms = [s for s in provided_symptoms if s not in CANONICAL_SYMPTOMS]
            if invalid_symptoms:
                logger.warning(f"Some symptoms are not in CANONICAL_SYMPTOMS: {invalid_symptoms}. Filtering them out.")
                # Filter out invalid symptoms instead of rejecting
                provided_symptoms = [s for s in provided_symptoms if s in CANONICAL_SYMPTOMS]
                data["symptoms_list"] = provided_symptoms
                data["symptoms_text"] = ", ".join(provided_symptoms)
                data["symptom_count"] = len(provided_symptoms)

    # Skip duration_days validation for exotic species (handled by AI)
    if not is_exotic:
        try:
            duration_days = data.get("duration_days")
            if duration_days is not None:
                duration_days = float(duration_days)
        except Exception:
            return False, None, Response(
                {
                    "success": False,
                    "error": "duration_days must be a number.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    return True, data, None


# Note: get_gemini_client() is now imported from chatbot.utils


def get_gemini_response(user_message, conversation_history=None, chat_mode='general'):
    """Generate AI response using Google Gemini with different modes"""
    try:

        CLINIC_CONTEXT = """
        IMPORTANT CONTEXT:
        You are the official AI assistant for 'SouthValley Veterinary Clinic'.
        
        Clinic Address:
        A. Gomez, National Highway, Balibago, Sta. Rosa, Laguna, Sta. Rosa, Philippines.
        
        If you recommend seeing a vet:
        1. ALWAYS refer them to SouthValley Veterinary Clinic first.
        2. Remind them the clinic is OPEN 24/7.
        3. Contact: 0928 960 7250.
        """
        # Different system prompts based on mode
        if chat_mode == 'symptom_checker':
            system_prompt = """You are PawPal's Symptom Checker, an AI veterinary diagnostic assistant for SouthValley Veterinary Clinic located in A. Gomez, National Highway, Balibago, Sta. Rosa, Laguna, Sta. Rosa, Philippines. Open 24/7 and the Contact number is: 0928 960 7250
            You help pet owners understand possible causes of their pet's symptoms and guide them on urgency levels.
            
           
            Guidelines:
            - Focus on symptom analysis and potential conditions
            - Always recommend veterinary care for serious symptoms
            - Provide urgency levels (immediate, soon, routine check-up)
            - Ask specific follow-up questions about symptoms
            - Be thorough but not alarming
            - Mention that this is preliminary guidance, not a diagnosis
           
            Format responses with:
            1. Symptom assessment
            2. Possible causes (if appropriate)
            3. Recommended action level
            4. When to see a vet
            """
        else:  # general mode
            system_prompt = """You are PawPal, a friendly AI veterinary assistant for SouthValley Veterinary Clinic located in A. Gomez, National Highway, Balibago, Sta. Rosa, Laguna, Sta. Rosa, Philippines. Open 24/7 and the Contact number is: 0928 960 7250 focused on general pet health education.
            You help pet owners understand normal pet behaviors, proper care, and maintenance.
           
            Guidelines:
            - Focus on general pet health, normal behaviors, and preventive care
            - Provide educational information about what's typical for different pets
            - Cover topics like diet, exercise, grooming, behavior, and routine care
            - Be encouraging and supportive for pet parents
            - Always recommend professional care when appropriate
            - Keep responses informative but friendly
            """
       
        # Build conversation context
        conversation_text = system_prompt + "\n\n"
       
        # Add mode context
        if chat_mode == 'symptom_checker':
            conversation_text += "Mode: Symptom Analysis\n"
        else:
            conversation_text += "Mode: General Pet Health Education\n"
       
        # Add conversation history if provided
        if conversation_history and conversation_history.exists():
            conversation_text += "Previous conversation:\n"
            recent_messages = list(conversation_history)[-6:]
           
            for msg in recent_messages:
                role = "User" if msg.is_user else "PawPal"
                conversation_text += f"{role}: {msg.content}\n"
       
        # Add current user message
        conversation_text += f"\nUser: {user_message}\nPawPal:"
       
        print(f"Using chat mode: {chat_mode}")
       
        # Check cache first
        cached_response = get_cached_response(conversation_text)
        if cached_response:
            logger.info("💾 Using cached response for chat")
            return cached_response
       
        # No cache hit - call Gemini
        model = get_gemini_client()
        response = model.generate_content(conversation_text)
       
        if response and hasattr(response, 'text') and response.text:
            response_text = response.text.strip()
            # Save to cache
            save_response_to_cache(conversation_text, response_text)
            return response_text
        else:
            return "I'm having trouble responding right now. Could you please try again?"
       
    except Exception as e:
        error_str = str(e)
        error_type = type(e).__name__
        logger.error(f"Gemini Error ({error_type}): {error_str}")
        print(f"❌ Gemini Error ({error_type}): {error_str}")
        
        # Provide more specific error messages
        if "GEMINI_API_KEY is not set" in error_str or "GEMINI_API_KEY is empty" in error_str:
            logger.error("API key configuration issue detected")
            return f"I'm currently unavailable due to API configuration issues. {error_str} For immediate pet health concerns, please consult with a veterinarian."
        elif "API key" in error_str or "invalid" in error_str.lower() or "revoked" in error_str.lower() or "403" in error_str:
            logger.error("API key validation failed")
            return f"I'm currently unavailable due to API configuration issues. {error_str} Please check your .env file and ensure GEMINI_API_KEY is set correctly. For immediate pet health concerns, please consult with a veterinarian."
        elif "quota" in error_str.lower():
            logger.warning("API quota exceeded")
            return "I'm experiencing high demand right now. Please try again in a few minutes or consult with a veterinarian for immediate concerns."
        else:
            logger.error(f"Unexpected Gemini error: {error_str}")
            return f"I'm experiencing technical difficulties: {error_str}. Please try again or consult with a veterinarian for immediate concerns."

def get_gemini_response_with_pet_context(user_message, conversation_history=None, chat_mode='general', pet_context=None, assessment_context=None):
    """Generate AI response using Google Gemini with pet context"""
    try:
        CLINIC_CONTEXT = """
        IMPORTANT CONTEXT:
        You are the official AI assistant for 'SouthValley Veterinary Clinic'.
        
        Clinic Address:
        A. Gomez, National Highway, Balibago, Sta. Rosa, Laguna, Sta. Rosa, Philippines.
        
        If you recommend seeing a vet:
        1. ALWAYS refer them to SouthValley Veterinary Clinic first.
        2. Remind them the clinic is OPEN 24/7.
        3. Contact: 0928 960 7250.
        """
        # Different system prompts based on mode
        if chat_mode == 'symptom_checker':
            system_prompt = """You are PawPal's Symptom Checker, an AI veterinary diagnostic assistant for SouthValley Veterinary Clinic located in A. Gomez, National Highway, Balibago, Sta. Rosa, Laguna, Sta. Rosa, Philippines.
            Open 24/7 and the Contact number is: 0928 960 7250
            You help pet owners understand possible causes of their pet's symptoms and guide them on urgency levels.
            
            You can analyze both text descriptions and image analysis results from our computer vision system.
        
            Guidelines:
            - Focus on symptom analysis and potential conditions
            - When image analysis is provided, incorporate those findings into your assessment
            - Always recommend veterinary care for serious symptoms
            - Provide urgency levels (immediate, soon, routine check-up)
            - Ask specific follow-up questions about symptoms
            - Be thorough but not alarming
            - Keep responses under 500 words
            - Mention that this is preliminary guidance, not a diagnosis
            - If image analysis detected specific conditions, reference them in your response
        
            Format responses with:
            1. Symptom assessment (including image findings if available)
            2. Possible causes (if appropriate)
            3. Recommended action level
            4. When to see a vet
            
            **DATA LOGGING TRIGGER:**
            If the user explicitly asks to log symptoms, OR if they describe a change in the pet's condition (e.g., 'He is worse today', 'Vomiting stopped'), do NOT try to log it yourself.
            
            Instead, respond empathetically and end your message with this exact tag: `[[TRIGGER_LOG_UI]]`.
            """
        else:  # general mode
            system_prompt = """You are PawPal, a friendly AI veterinary assistant for SouthValley Veterinary Clinic located in A. Gomez, National Highway, Balibago, Sta. Rosa, Laguna, Sta. Rosa, Philippines.
            Open 24/7 and the Contact number is: 0928 960 7250 focused on general pet health education.
            You help pet owners understand normal pet behaviors, proper care, and maintenance.
           
            Guidelines:
            - Focus on general pet health, normal behaviors, and preventive care
            - Provide educational information about what's typical for different pets
            - Cover topics like diet, exercise, grooming, behavior, and routine care
            - Be encouraging and supportive for pet parents
            - Always recommend professional care when appropriate
            - Keep responses informative but friendly
            
            **DATA LOGGING TRIGGER:**
            If the user explicitly asks to log symptoms, OR if they describe a change in the pet's condition (e.g., 'He is worse today', 'Vomiting stopped'), do NOT try to log it yourself.
            
            Instead, respond empathetically and end your message with this exact tag: `[[TRIGGER_LOG_UI]]`.
            """
       
        # Build conversation context
        conversation_text = system_prompt + "\n\n"
       
        # Add pet context if available
        if pet_context:
            conversation_text += f"""Pet Information:
Name: {pet_context['name']}
Species: {pet_context['species']}
Breed: {pet_context['breed']}
Age: {pet_context['age']} years old
Sex: {pet_context['sex']}
Weight: {pet_context['weight']}
Medical Notes: {pet_context['medical_notes']}
Known Allergies: {pet_context['allergies']}
Chronic Conditions: {pet_context['chronic_diseases']}

You already know about {pet_context['name']}, so don't ask for basic information again. Provide advice specific to this {pet_context['species']}.

"""
       
        # Add mode context
        if chat_mode == 'symptom_checker':
            conversation_text += "Mode: Symptom Analysis\n"
        else:
            conversation_text += "Mode: General Pet Health Education\n"
       
        # Add assessment context if available (for follow-up questions)
        if assessment_context and isinstance(assessment_context, dict):
            conversation_text += "\nPrevious Assessment Context:\n"
            if assessment_context.get('pet_name'):
                conversation_text += f"Pet: {assessment_context['pet_name']}\n"
            if assessment_context.get('predictions'):
                conversation_text += "Recent diagnosis predictions:\n"
                for i, pred in enumerate(assessment_context['predictions'][:3], 1):
                    disease = pred.get('disease') or pred.get('label', 'Unknown')
                    confidence = pred.get('confidence') or pred.get('likelihood', 0)
                    conversation_text += f"{i}. {disease} ({confidence*100:.0f}% confidence)\n"
            if assessment_context.get('overall_recommendation'):
                conversation_text += f"Recommendation: {assessment_context['overall_recommendation']}\n"
            conversation_text += "Use this context to answer follow-up questions about the assessment.\n\n"
       
        # Add conversation history if provided
        if conversation_history and conversation_history.exists():
            conversation_text += "Previous conversation:\n"
            recent_messages = list(conversation_history)[-6:]
           
            for msg in recent_messages:
                role = "User" if msg.is_user else "PawPal"
                conversation_text += f"{role}: {msg.content}\n"
       
        # Add current user message
        conversation_text += f"\nUser: {user_message}\nPawPal:"
       
        print(f"Using chat mode: {chat_mode}")
        if pet_context:
            print(f"Pet context: {pet_context['name']} ({pet_context['species']})")
       
        # Check cache first
        cached_response = get_cached_response(conversation_text)
        if cached_response:
            logger.info("💾 Using cached response for chat with pet context")
            return cached_response
       
        # No cache hit - call Gemini
        model = get_gemini_client()
        response = model.generate_content(conversation_text)
       
        if response and hasattr(response, 'text') and response.text:
            response_text = response.text.strip()
            # Save to cache
            save_response_to_cache(conversation_text, response_text)
            return response_text
        else:
            return "I'm having trouble responding right now. Could you please try again?"
       
    except Exception as e:
        error_str = str(e)
        error_type = type(e).__name__
        logger.error(f"Gemini Error ({error_type}): {error_str}")
        print(f"❌ Gemini Error ({error_type}): {error_str}")
        
        # Provide more specific error messages
        if "GEMINI_API_KEY is not set" in error_str or "GEMINI_API_KEY is empty" in error_str:
            logger.error("API key configuration issue detected")
            return f"I'm currently unavailable due to API configuration issues. {error_str} For immediate pet health concerns, please consult with a veterinarian."
        elif "API key" in error_str or "invalid" in error_str.lower() or "revoked" in error_str.lower() or "403" in error_str:
            logger.error("API key validation failed")
            return f"I'm currently unavailable due to API configuration issues. {error_str} Please check your .env file and ensure GEMINI_API_KEY is set correctly. For immediate pet health concerns, please consult with a veterinarian."
        elif "quota" in error_str.lower():
            logger.warning("API quota exceeded")
            return "I'm experiencing high demand right now. Please try again in a few minutes or consult with a veterinarian for immediate concerns."
        else:
            logger.error(f"Unexpected Gemini error: {error_str}")
            return f"I'm experiencing technical difficulties: {error_str}. Please try again or consult with a veterinarian for immediate concerns."


def generate_conversation_title(first_message, ai_response=None, pet_name=None):
    """Generate a conversation title using Gemini"""
    try:
        model = get_gemini_client()
        
        context_str = f"User: {first_message}\n"
        if ai_response:
            context_str += f"AI: {ai_response}\n"
        if pet_name:
            context_str += f"Subject: {pet_name}\n"

        prompt = f"""Based on this pet health conversation, generate a short, descriptive title (max 5-6 words).

{context_str}

Guidelines:
- If a specific symptom or topic is mentioned, use it (e.g., "{pet_name if pet_name else 'Pet'}'s Itchy Skin", "Vomiting Issues", "Diet Questions").
- Do NOT use generic titles like "Symptom Checker" or "Pet Care" unless the topic is unclear.
- Do NOT include dates or IDs.

Title:"""
       
        response = model.generate_content(prompt)
        title = response.text.strip().replace('"', '').replace("Title:", "").strip()
       
        # Fallback if title is too long or empty
        if len(title) > 50 or not title:
            words = first_message.split()[:4]
            title = " ".join(words).title()
       
        return title
       
    except Exception as e:
        print(f"Error generating title: {e}")
        words = first_message.split()[:4]
        return " ".join(words).title()


# Replace the OpenAI function with Gemini (keeping name for compatibility)
def get_openai_response(user_message, conversation_history=None, chat_mode='general'):
    """Use Gemini instead of OpenAI (keeping same function name for compatibility)"""
    return get_gemini_response(user_message, conversation_history, chat_mode)


@login_required
def chat_view(request):
    """Web interface for chatbot"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_message = data.get('message')
            chat_mode = data.get('chat_mode', 'general')
           
            if user_message:
                # Get or create conversation
                conversation, created = Conversation.objects.get_or_create(
                    user=request.user,
                    defaults={'user': request.user}
                )
               
                # Save user message
                Message.objects.create(
                    conversation=conversation,
                    content=user_message,
                    is_user=True
                )
               
                # Get conversation history for context
                conversation_history = Message.objects.filter(
                    conversation=conversation
                ).order_by('created_at')
               
                # Generate AI response using Gemini
                ai_response = get_openai_response(user_message, conversation_history, chat_mode)
               
                # Save AI response
                Message.objects.create(
                    conversation=conversation,
                    content=ai_response,
                    is_user=False
                )
               
                return JsonResponse({'response': ai_response})
               
        except Exception as e:
            print(f"Chat view error: {e}")
            return JsonResponse({'error': str(e)}, status=500)
   
    return render(request, 'chatbot/chat.html')


@api_view(['POST'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def chat(request):
    """API endpoint for chatbot (React frontend)"""
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can use the chat
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can use the chat'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user_message = request.data.get('message')
        conversation_id = request.data.get('conversation_id')
        chat_mode = request.data.get('chat_mode', 'general')
        assessment_context = request.data.get('assessment_context')
       
        if not user_message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
       
        print(f"Received message: {user_message} (Mode: {chat_mode})")
       
        # Get or create conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, user=user_obj)  # Changed from request.user
            except Conversation.DoesNotExist:
                conversation = Conversation.objects.create(user=user_obj, title="New Conversation")  # Changed from request.user
        else:
            conversation = Conversation.objects.create(user=user_obj, title="New Conversation")  # Changed from request.user
        
        # Link pet to conversation if pet_id is provided and conversation doesn't have one
        pet_id = request.data.get('pet_id')
        # Also check pet_context if pet_id is not provided
        if not pet_id:
            pet_context = request.data.get('pet_context')
            if pet_context and isinstance(pet_context, dict):
                pet_id = pet_context.get('id')
        
        if pet_id and not conversation.pet:
            try:
                pet = Pet.objects.get(id=pet_id, owner=user_obj)
                conversation.pet = pet
                conversation.save()
                print(f"✅ Linked pet {pet.name} (ID: {pet.id}) to conversation {conversation.id}")
            except Pet.DoesNotExist:
                print(f"⚠️ Pet with ID {pet_id} not found or not owned by user")
            except Exception as e:
                print(f"⚠️ Error linking pet to conversation: {str(e)}")
        
        # Debug: Check if conversation has pet
        print(f"[CHAT] Conversation {conversation.id} - Has pet: {conversation.pet is not None}, Pet ID: {conversation.pet.id if conversation.pet else None}, Chat mode: {chat_mode}")
        
        # Save user message
        user_msg = Message.objects.create(
            conversation=conversation,
            content=user_message,
            is_user=True
        )
       
        # Get conversation history for context
        conversation_history = conversation.messages.all().order_by('created_at')
       
        # Get pet context if this conversation is linked to a pet
        pet_context = None
        if hasattr(conversation, 'pet') and conversation.pet:
            pet = conversation.pet
            pet_context = {
                'name': pet.name,
                'species': getattr(pet, 'animal_type', 'Unknown'),
                'breed': getattr(pet, 'breed', 'Unknown'),
                'age': getattr(pet, 'age', 'Unknown'),
                'sex': getattr(pet, 'sex', 'Unknown'),
                'weight': getattr(pet, 'weight', 'Unknown'),
                'medical_notes': getattr(pet, 'medical_notes', ''),
                'allergies': getattr(pet, 'allergies', ''),
                'chronic_diseases': getattr(pet, 'chronic_diseases', ''),
            }
       
        # Generate AI response using Gemini with pet context
        ai_response = get_gemini_response_with_pet_context(
            user_message, 
            conversation_history, 
            chat_mode, 
            pet_context,
            assessment_context
        )
        print(f"AI response: {ai_response}")
        
        # Note: Symptom logging is now handled via the frontend widget ([[TRIGGER_LOG_UI]] tag)
        # The backend just returns the AI response with the tag, and the frontend opens the form
        
        # Automatically create SOAP report for symptom checker mode if pet is linked
        soap_report = None
        ai_diagnosis = None
        case_id = None
        print(f"[SOAP_CHECK] chat_mode={chat_mode}, has_pet={hasattr(conversation, 'pet') and conversation.pet is not None}")
        # REMOVED: Automatic SOAP report and AI Diagnosis creation from chat flow
        # Formal assessments should only be created via the create_ai_diagnosis endpoint
        # (called by the frontend questionnaire), not from casual chat messages
        soap_report = None
        case_id = None
        
        # COMMENTED OUT: Automatic assessment creation from chat messages
        # This was polluting the formal Assessment list with casual symptom chats
        # if chat_mode == 'symptom_checker' and hasattr(conversation, 'pet') and conversation.pet:
            # COMMENTED OUT: Entire automatic SOAP/AI Diagnosis creation block
            # try:
            #     pet = conversation.pet
            #     print(f"[SOAP_CREATION] Starting SOAP report creation for pet {pet.name} (ID: {pet.id})")
            #     ... (entire block removed to prevent casual chats from polluting formal assessments)
            # except Exception as e:
            #     ...
        # else:
        #     ...
        
        # Save AI response
        ai_msg = Message.objects.create(
            conversation=conversation,
            content=ai_response,
            is_user=False
        )
       
        # Generate title if this is the first exchange
        # Generate title if this is the first exchange
        if conversation.messages.count() <= 3:
            # Determine pet name for the prompt
            pet_name = None
            if pet_context:
                pet_name = pet_context.get('name')
            
            # Generate dynamic title using AI (Always use AI now)
            dynamic_title = generate_conversation_title(user_message, ai_response, pet_name)
            
            # Add a small prefix for categorization, but keep the rest dynamic
            # Result: "Symptom Check: Max's Upset Stomach" instead of "Symptom Check: Max"
            prefix = "Symptom Check: " if chat_mode == 'symptom_checker' else "Pet Care: "
            
            conversation.title = f"{prefix}{dynamic_title}"
            conversation.save()
       
        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save()
       
        response_data = {
            'response': ai_response,
            'conversation_id': conversation.id,
            'conversation_title': conversation.title,
            'message_id': ai_msg.id,
            'chat_mode': chat_mode,
            'pet_context': pet_context
        }
        
        # Include full SOAP report if created (matching CHUNK2 spec format)
        if case_id and soap_report:
            pet = soap_report.pet
            owner = pet.owner
            owner_name = f"{owner.first_name} {owner.last_name}".strip() or owner.username or owner.email
            
            response_data['soap_report'] = {
                'success': True,
                'case_id': case_id,
                'soap_report': {
                    'case_id': case_id,
                    'pet': {
                        'id': pet.id,
                        'name': pet.name,
                        'animal_type': getattr(pet, 'animal_type', 'Unknown'),
                        'breed': getattr(pet, 'breed', 'Unknown'),
                        'age': getattr(pet, 'age', 'Unknown'),
                        'sex': getattr(pet, 'sex', 'Unknown'),
                        'weight': float(pet.weight) if pet.weight else None
                    },
                    'owner': {
                        'id': owner.id,
                        'name': owner_name,
                        'email': owner.email
                    },
                    'subjective': soap_report.subjective,
                    'objective': soap_report.objective,
                    'assessment': soap_report.assessment,
                    'plan': soap_report.plan,
                    'flag_level': soap_report.flag_level,
                    'date_generated': soap_report.date_generated.isoformat(),
                    'date_flagged': soap_report.date_flagged.isoformat() if soap_report.date_flagged else None,
                    'chat_conversation_id': conversation.id if conversation else None
                },
                'message': f'SOAP report generated successfully with case ID: {case_id}'
            }
        
        return Response(response_data, status=status.HTTP_200_OK)
       
    except Exception as e:
        print(f"Chat API error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def get_conversations(request):
    """
    GET /api/chatbot/conversations/
    (CONSOLIDATED: Enhanced to replace /api/admin/pets/:petId/chat-history)
    
    Get conversation list with optional pet filter
    Supports both Pet Owners and Admins with role-based access
    
    Query Parameters:
        - pet_id (int, optional): Filter conversations by pet
          Pet Owners: Must be their own pet
          Admins: Can filter by any pet, or omit for all
    
    Permissions:
        - Admins: Can view conversations for any pet or all conversations
        - Pet Owners: Can view only their own conversations (optionally filtered by their pet)
    """
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    request.user_type = user_type
    if user_type == 'admin':
        request.admin = user_obj
    else:
        request.user = user_obj
    
    try:
        pet_id = request.query_params.get('pet_id')
        
        # Build base queryset
        if request.user_type == 'admin':
            if pet_id:
                # Admin filtering by specific pet
                from pets.models import Pet
                try:
                    pet = Pet.objects.get(id=pet_id)
                    conversations = Conversation.objects.filter(pet=pet).prefetch_related('messages', 'soap_reports')
                except Pet.DoesNotExist:
                    return Response({
                        'success': False,
                        'error': 'Pet not found',
                        'pet_id': pet_id
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                # Admin viewing all conversations
                conversations = Conversation.objects.all().prefetch_related('messages', 'soap_reports', 'pet', 'user')
        else:  # pet_owner
            # Pet owners see only their conversations
            conversations = Conversation.objects.filter(user=request.user)
            
            if pet_id:
                # Filter by pet (must be their own)
                from pets.models import Pet
                try:
                    pet = Pet.objects.get(id=pet_id, owner=request.user)
                    conversations = conversations.filter(pet=pet)
                except Pet.DoesNotExist:
                    return Response({
                        'success': False,
                        'error': 'Pet not found or does not belong to you'
                    }, status=status.HTTP_404_NOT_FOUND)
        
        # Format based on user type
        if request.user_type == 'admin' and pet_id:
            # Admin format for specific pet (similar to admin endpoint)
            chats = []
            for conv in conversations.order_by('-created_at'):
                preview = ""
                first_message = conv.messages.filter(is_user=True).first()
                if first_message:
                    preview = first_message.content[:100]
                
                has_diagnosis = conv.soap_reports.exists()
                
                chats.append({
                    'chat_id': str(conv.id),
                    'title': conv.title,
                    'date': conv.created_at.isoformat(),
                    'preview': preview,
                    'has_diagnosis': has_diagnosis
                })
            
            return Response({
                'success': True,
                'chats': chats,
                'total_count': len(chats)
            }, status=status.HTTP_200_OK)
        else:
            # Pet owner format or admin without pet filter
            conversation_data = []
            for conv in conversations.order_by('-updated_at', '-created_at'):
                last_message = conv.messages.last()
                conversation_data.append({
                    'id': conv.id,
                    'title': conv.title,
                    'created_at': conv.created_at.isoformat(),
                    'updated_at': conv.updated_at.isoformat(),
                    'is_pinned': conv.is_pinned,
                    'message_count': conv.messages.count(),
                    'last_message': last_message.content[:50] + "..." if last_message else "",
                    'last_message_time': last_message.created_at.isoformat() if last_message else conv.created_at.isoformat(),
                    'pet_id': conv.pet.id if conv.pet else None,
                    'pet_name': conv.pet.name if conv.pet else None
                })
           
            return Response({
                'conversations': conversation_data,
                'total': len(conversation_data)
            }, status=status.HTTP_200_OK)
       
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def toggle_pin_conversation(request, conversation_id):
    """Pin/unpin a conversation"""
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can pin/unpin conversations
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can pin/unpin conversations'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=user_obj)
        conversation.is_pinned = not conversation.is_pinned
        conversation.save()
        
        return Response({
            'id': conversation.id,
            'is_pinned': conversation.is_pinned
        })
        
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)

# Add diagnosis-related views from your code
@api_view(['GET'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def get_conversation_messages(request, conversation_id):
    """
    GET /api/chatbot/conversations/:conversationId/
    (CONSOLIDATED: Enhanced to replace /api/admin/pets/:petId/chat/:chatId)
    
    Get messages for a specific conversation
    Supports both Pet Owners and Admins with role-based access
    
    Query Parameters (Admin only):
        - pet_id (int, optional): Verify conversation belongs to this pet
    
    Permissions:
        - Admins: Can view any conversation
        - Pet Owners: Can only view their own conversations
    """
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    request.user_type = user_type
    if user_type == 'admin':
        request.admin = user_obj
    else:
        request.user = user_obj  # Set for compatibility
    
    try:
        # Get conversation
        try:
            conversation = Conversation.objects.prefetch_related('messages', 'soap_reports', 'pet', 'user').get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Conversation not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions
        if request.user_type == 'admin':
            # Admins can view any conversation
            # Optional: verify pet_id matches if provided
            pet_id = request.query_params.get('pet_id')
            if pet_id and conversation.pet and str(conversation.pet.id) != str(pet_id):
                return Response({
                    'success': False,
                    'error': 'Conversation does not belong to the specified pet'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:  # pet_owner
            # Pet owners can only view their own conversations
            if conversation.user != user_obj:  # Changed from request.user
                return Response({
                    'success': False,
                    'error': 'You do not have permission to view this conversation'
                }, status=status.HTTP_403_FORBIDDEN)
        
        # Format messages
        messages = []
        for msg in conversation.messages.all():
            messages.append({
                'id': msg.id,
                'content': msg.content,
                'isUser': msg.is_user,
                'sender': 'user' if msg.is_user else 'bot',
                'message': msg.content,
                'timestamp': msg.created_at.isoformat()
            })
        
        # Get ALL assessment data from SOAP reports (not just first)
        # CRITICAL FIX: Retrieve all SOAP reports to prevent assessments from "disappearing"
        assessment_data = None
        assessments_history = []
        soap_reports = conversation.soap_reports.all().order_by('-date_generated')
        
        # NOTE: Each conversation shows only its own assessment data
        
        if soap_reports.exists():
            # Get associated AIDiagnosis to build assessment data for each report
            from .models import AIDiagnosis
            
            for soap_report in soap_reports:
                try:
                    # Try exact match first (SOAP report might have # prefix)
                    try:
                        ai_diagnosis = AIDiagnosis.objects.get(case_id=soap_report.case_id)
                    except AIDiagnosis.DoesNotExist:
                        # Try without # prefix (AIDiagnosis doesn't have # prefix)
                        case_id_clean = soap_report.case_id.lstrip('#')
                        try:
                            ai_diagnosis = AIDiagnosis.objects.get(case_id=case_id_clean)
                        except AIDiagnosis.DoesNotExist:
                            # Try with # prefix (in case SOAP was created without it but AIDiagnosis has it)
                            case_id_with_hash = f'#{case_id_clean}'
                            ai_diagnosis = AIDiagnosis.objects.get(case_id=case_id_with_hash)

                            # === FIX: Retrieve Triage Assessment ===
                    # Check if ml_predictions has our new wrapper format
                    stored_ml = ai_diagnosis.ml_predictions
                    saved_triage_assessment = {}
                    
                    if isinstance(stored_ml, dict) and 'triage_assessment' in stored_ml:
                        saved_triage_assessment = stored_ml.get('triage_assessment', {})
                    # =======================================
                    
                    # Transform suggested_diagnoses to predictions format expected by frontend
                    predictions = []
                    if isinstance(ai_diagnosis.suggested_diagnoses, list):
                        for diag in ai_diagnosis.suggested_diagnoses:
                            # Transform from AIDiagnosis format to frontend format
                            prediction = {
                            'disease': diag.get('condition_name', diag.get('condition', 'Unknown')),
                            'label': diag.get('condition_name', diag.get('condition', 'Unknown')),
                            'confidence': diag.get('likelihood_percentage', 0) / 100.0 if diag.get('likelihood_percentage') else (diag.get('likelihood', 0) if isinstance(diag.get('likelihood'), (int, float)) and diag.get('likelihood') <= 1 else diag.get('likelihood', 0) / 100.0),
                            'likelihood': diag.get('likelihood_percentage', 0) / 100.0 if diag.get('likelihood_percentage') else (diag.get('likelihood', 0) if isinstance(diag.get('likelihood'), (int, float)) and diag.get('likelihood') <= 1 else diag.get('likelihood', 0) / 100.0),
                            'urgency': diag.get('urgency_level', diag.get('urgency', 'moderate')),
                            'description': diag.get('description', ''),
                            'contagious': diag.get('contagious', False),
                            'red_flags': diag.get('red_flags', []),
                            'timeline': diag.get('timeline', ''),

                            'recommendation': diag.get('recommendation', ''),
                            'care_guidelines': diag.get('care_guidelines', ''),
                            'when_to_see_vet': diag.get('when_to_see_vet', ''),
                            'match_explanation': diag.get('match_explanation', '')
                            }
                            predictions.append(prediction)
                    
                    # Build assessment data in the format expected by frontend
                    current_assessment = {
                        'pet_name': conversation.pet.name if conversation.pet else 'Pet',
                        'predictions': predictions,
                        'overall_recommendation': ai_diagnosis.ai_explanation,
                        'urgency_level': ai_diagnosis.urgency_level,
                        'symptoms_text': ai_diagnosis.symptoms_text,
                        'case_id': ai_diagnosis.case_id,
                        'date_generated': soap_report.date_generated.isoformat(),

                        'triage_assessment': saved_triage_assessment
                    }
                    
                    # Add to history
                    assessments_history.append(current_assessment)
                    
                    # Use the first (most recent) assessment as the main assessment_data
                    if assessment_data is None:
                        assessment_data = current_assessment
                        
                except AIDiagnosis.DoesNotExist:
                    # Fallback: use SOAP report assessment if AIDiagnosis doesn't exist
                    if soap_report.assessment and isinstance(soap_report.assessment, list):
                        predictions = []
                        for diag in soap_report.assessment:
                            # Transform from SOAP report format to frontend format
                            prediction = {
                                'disease': diag.get('condition', diag.get('condition_name', 'Unknown')),
                                'label': diag.get('condition', diag.get('condition_name', 'Unknown')),
                                'confidence': diag.get('likelihood', 0) if isinstance(diag.get('likelihood'), (int, float)) and diag.get('likelihood') <= 1 else (diag.get('likelihood', 0) / 100.0),
                                'likelihood': diag.get('likelihood', 0) if isinstance(diag.get('likelihood'), (int, float)) and diag.get('likelihood') <= 1 else (diag.get('likelihood', 0) / 100.0),
                                'urgency': diag.get('urgency', 'moderate'),
                                'description': diag.get('description', ''),
                                'contagious': diag.get('contagious', False),
                                'red_flags': diag.get('red_flags', []),
                                'timeline': diag.get('timeline', ''),
                            }
                            predictions.append(prediction)
                        
                        fallback_assessment = {
                            'pet_name': conversation.pet.name if conversation.pet else 'Pet',
                            'predictions': predictions,
                            'overall_recommendation': soap_report.plan.get('aiExplanation', '') if isinstance(soap_report.plan, dict) else '',
                            'urgency_level': soap_report.plan.get('severityLevel', 'moderate').lower() if isinstance(soap_report.plan, dict) else 'moderate',
                            'symptoms_text': soap_report.subjective,
                            'case_id': soap_report.case_id,
                            'date_generated': soap_report.date_generated.isoformat(),
                        }
                        
                        # Add to history
                        assessments_history.append(fallback_assessment)
                        
                        # Use as main assessment_data if none set yet
                        if assessment_data is None:
                            assessment_data = fallback_assessment
        
        # Format response based on user type
        if request.user_type == 'admin':
            # Admin format (similar to admin endpoint)
            diagnosis_case_id = None
            if soap_reports.exists():
                diagnosis_case_id = soap_reports.first().case_id
            
            owner_name = ""
            if conversation.pet:
                owner_name = f"{conversation.pet.owner.first_name} {conversation.pet.owner.last_name}".strip() or conversation.pet.owner.username
            
            return Response({
                'success': True,
                'chat': {
                    'chat_id': str(conversation.id),
                    'pet_id': f"RP-{str(conversation.pet.id).zfill(6)}" if conversation.pet else None,
                    'owner_name': owner_name,
                    'date': conversation.created_at.isoformat(),
                    'messages': messages,
                    'diagnosis_case_id': diagnosis_case_id
                }
            }, status=status.HTTP_200_OK)
        else:
# Pet owner format (existing format)
            response_data = {
                'conversation': {
                    'id': conversation.id,
                    'title': conversation.title,
                    'created_at': conversation.created_at.isoformat(),
                },
                'messages': messages
            }

            # === FIX: Include Pet Context in Load ===
            if conversation.pet:
                response_data['pet_context'] = {
                    'id': conversation.pet.id,
                    'name': conversation.pet.name,
                    'species': getattr(conversation.pet, 'species', getattr(conversation.pet, 'animal_type', 'Unknown')),
                    'breed': getattr(conversation.pet, 'breed', 'Unknown'),
                    'age': getattr(conversation.pet, 'age', 0)
                }
            else:
                # Provide dummy context for "Continue Without Details" symptom checker conversations
                # This allows the symptom checker to work without a linked pet profile
                response_data['pet_context'] = {
                    'id': 0,
                    'name': 'Your Pet',
                    'species': 'Pet',
                    'breed': 'Unknown',
                    'age': 0
                }
            # ========================================

            # Include assessment data if available (most recent for backward compatibility)
            if assessment_data:
                response_data['assessment_data'] = assessment_data
            
            # Include full assessment history (for showing all past assessments)
            if assessments_history:
                response_data['assessments_history'] = assessments_history
            
            return Response(response_data, status=status.HTTP_200_OK)
       
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def create_new_conversation(request):
    """Create a new conversation"""
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can create conversations
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can create conversations'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        conversation = Conversation.objects.create(
            user=user_obj,
            title="New Conversation"
        )
       
        return Response({
            'conversation': {
                'id': conversation.id,
                'title': conversation.title,
                'created_at': conversation.created_at.isoformat(),
            }
        })
       
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def toggle_pin_conversation(request, conversation_id):
    """Pin/unpin a conversation"""
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can pin/unpin conversations
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can pin/unpin conversations'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=user_obj)
        conversation.is_pinned = not conversation.is_pinned
        conversation.save()
       
        return Response({
            'id': conversation.id,
            'is_pinned': conversation.is_pinned
        })
       
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)


# Add diagnosis-related views from your code
@api_view(['GET'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def get_diagnoses(request):
    """Get paginated diagnoses with filtering"""
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can view diagnoses
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can view diagnoses'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Query AIDiagnosis instead of Diagnosis
        from .models import AIDiagnosis
       
        # Get query parameters
        search = request.GET.get('search', '')
        severity = request.GET.get('severity', '')
        species = request.GET.get('species', '')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
       
        # Build query - filter by user
        diagnoses = AIDiagnosis.objects.filter(user=user_obj).select_related('pet')
       
        if search:
            diagnoses = diagnoses.filter(
                Q(symptoms_text__icontains=search) |
                Q(case_id__icontains=search) |
                Q(pet__name__icontains=search) |
                Q(ai_explanation__icontains=search)
            )
       
        if severity:
            diagnoses = diagnoses.filter(overall_severity=severity)
           
        if species:
            diagnoses = diagnoses.filter(pet__animal_type__iexact=species)
       
        # Date range filtering: supports frontend params `dateRange`, `date_range`, or `date`.
        # Expected values mapped from frontend: ''/None -> all_time, 'last_24_hours'|'today' -> last 24 hours,
        # 'last_7_days' -> last 7 days, 'last_30_days' -> last 30 days.
        date_range = request.GET.get('dateRange') or request.GET.get('date_range') or request.GET.get('date')
        if date_range:
            try:
                now = timezone.now()
                if date_range in ('today', 'last_24_hours'):
                    since = now - timedelta(days=1)
                    diagnoses = diagnoses.filter(generated_at__gte=since)
                elif date_range in ('last_7_days', 'last_7'):
                    since = now - timedelta(days=7)
                    diagnoses = diagnoses.filter(generated_at__gte=since)
                elif date_range in ('last_30_days', 'last_30'):
                    since = now - timedelta(days=30)
                    diagnoses = diagnoses.filter(generated_at__gte=since)
                elif date_range in ('all_time', 'all'):
                    # no-op, include all
                    pass
            except Exception:
                # If anything goes wrong parsing date range, ignore and continue without filtering
                logger.exception('Failed to apply date_range filter for diagnoses')
        # Paginate
        paginator = Paginator(diagnoses, page_size)
        page_obj = paginator.get_page(page)
       
        # Serialize data
        diagnoses_data = []
        for diagnosis in page_obj:
            diagnoses_data.append({
                'id': diagnosis.id,
                'pet_name': diagnosis.pet.name if diagnosis.pet else 'Unknown Pet',
                'animal_type': diagnosis.pet.animal_type if diagnosis.pet else 'Unknown',
                'breed': (diagnosis.pet.breed if diagnosis.pet else None) or 'Mixed Breed',
                'severity': diagnosis.overall_severity,
                'case_id': diagnosis.case_id,
                'created_at': diagnosis.generated_at.strftime('%B %d, %Y'),
                'diagnosis': diagnosis.ai_explanation[:200] + '...' if len(diagnosis.ai_explanation) > 200 else diagnosis.ai_explanation,
                'symptoms': diagnosis.symptoms_text,
                'suggested_diagnoses': diagnosis.suggested_diagnoses,  # Include assessment data
            })
       
        return Response({
            'diagnoses': diagnoses_data,
            'total_pages': paginator.num_pages,
            'current_page': page,
            'total_count': paginator.count,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        })
       
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def create_diagnosis(request):
    """Create a new diagnosis from chat conversation"""
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can create diagnoses
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can create diagnoses'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Import here to avoid circular imports if Diagnosis model doesn't exist yet
        try:
            from .models import Diagnosis
        except ImportError:
            return Response({'error': 'Diagnosis model not implemented yet'}, status=status.HTTP_501_NOT_IMPLEMENTED)
       
        data = request.data
       
        # Generate unique case ID with better uniqueness (12 chars for maximum uniqueness)
        case_id = f"PDX-{datetime.now().strftime('%Y-%m%d')}-{str(uuid.uuid4())[:12].upper()}"
       
        diagnosis = Diagnosis.objects.create(
            user=user_obj,
            pet_name=data.get('pet_name', 'Unknown Pet'),
            animal_type=data.get('animal_type', 'dog'),
            breed=data.get('breed', ''),
            symptoms=data.get('symptoms', ''),
            diagnosis=data.get('diagnosis', ''),
            severity=data.get('severity', 'moderate'),
            case_id=case_id
        )
       
        return Response({
            'message': 'Diagnosis created successfully',
            'diagnosis_id': diagnosis.id,
            'case_id': diagnosis.case_id
        }, status=status.HTTP_201_CREATED)
       
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PATCH'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def update_conversation(request, conversation_id):
    """Update conversation details (like title)"""
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can update conversations
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can update conversations'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=user_obj)
        
        if 'title' in request.data:
            new_title = request.data['title'].strip()
            if new_title:  # Only update if title is not empty
                conversation.title = new_title
                conversation.save()
        
        return Response({
            'id': conversation.id,
            'title': conversation.title,
            'updated_at': conversation.updated_at.isoformat(),
        })
        
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def delete_conversation(request, conversation_id):
    """Delete a conversation"""
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can delete conversations
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can delete conversations'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=user_obj)
        conversation.delete()
        
        return Response({'message': 'Conversation deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_gemini(request):
    """Debug Gemini configuration"""
    api_key = getattr(settings, 'GEMINI_API_KEY', 'NOT SET')
    masked_key = f"{api_key[:10]}...{api_key[-10:]}" if api_key and len(api_key) > 20 else api_key
   
    return Response({
        'api_key_preview': masked_key,
        'api_key_length': len(api_key) if api_key else 0,
        'gemini_available': True,
        'test_message': 'Gemini debug endpoint working'
    })


# Keep OpenAI debug for compatibility (but using Gemini under the hood)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def debug_openai(request):
    """Debug endpoint (now using Gemini instead of OpenAI)"""
    try:
        if request.method == 'GET':
            return Response({
                'message': 'AI debug endpoint (using Gemini)',
                'api_key_set': bool(getattr(settings, 'GEMINI_API_KEY', None)),
                'api_key_preview': f"{settings.GEMINI_API_KEY[:10]}...{settings.GEMINI_API_KEY[-4:]}" if getattr(settings, 'GEMINI_API_KEY', None) else "Not set"
            })
       
        elif request.method == 'POST':
            test_message = request.data.get('message', 'Hello, this is a test message')
           
            # Test Gemini connection
            ai_response = get_gemini_response(test_message)
           
            return Response({
                'success': True,
                'test_message': test_message,
                'ai_response': ai_response,
                'model': 'gemini-1.5-flash',
                'note': 'Using Gemini instead of OpenAI'
            })
           
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




@api_view(['POST'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def predict_symptoms(request):
    """Predict likely condition from symptoms using a RandomForest pipeline.

    Payload: { "symptoms": "vomiting, lethargy", "species": "dog", "pet_id": 1, "image_url": "optional" }
    """
    from utils.unified_permissions import check_user_or_admin
    from django.contrib.auth.models import AnonymousUser
    
    # Check authentication (supports both user types)
    # If request.user is already set to a real user (internal call), use it; otherwise authenticate
    if isinstance(request.user, AnonymousUser) or not hasattr(request.user, 'id') or request.user.id is None:
        user_type, user_obj, error_response = check_user_or_admin(request)
        if error_response:
            return error_response
        
        # Only pet owners can use symptom prediction
        if user_type != 'pet_owner':
            return Response({
                'success': False,
                'error': 'Only pet owners can use symptom prediction'
            }, status=status.HTTP_403_FORBIDDEN)
        
        request.user = user_obj
    else:
        # User is already set (internal call), verify it's a pet owner
        if not hasattr(request.user, 'is_staff') or request.user.is_staff:
            # Admin users shouldn't use this endpoint directly
            pass  # Allow it for now, but could add check here if needed
    
    try:
        body = request.data
        symptoms_text = (body.get('symptoms') or '').strip()
        species = (body.get('species') or '').strip().lower() or 'dog'
        pet_id = body.get('pet_id')
        image_url = body.get('image_url')
        
        if not symptoms_text:
            return Response({'error': 'symptoms is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Load Random Forest model
        model_dir = getattr(settings, 'ML_MODELS_DIR', str(os.path.join(os.path.dirname(__file__), '..', 'ml', 'models')))
        model_path = os.path.join(model_dir, 'symptom_rf_enhanced.joblib')
        if not os.path.exists(model_path):
            # Fallback to original model
            model_path = os.path.join(model_dir, 'symptom_rf.joblib')
            if not os.path.exists(model_path):
                return Response({'error': 'Model not trained yet. Please train the model first.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        pipeline = joblib.load(model_path)

        # Get pet context if pet_id provided
        pet_context = {}
        if pet_id:
            try:
                from pets.models import Pet
                pet = Pet.objects.get(id=pet_id, owner=request.user)
                pet_context = {
                    'name': pet.name,
                    'species': pet.animal_type,
                    'breed': pet.breed,
                    'age': pet.age,
                    'sex': pet.sex,
                    'medical_notes': pet.medical_notes,
                    'weight': float(pet.weight) if pet.weight else None
                }
            except Pet.DoesNotExist:
                pass

        # Image analysis if image provided
        image_analysis = None
        if image_url:
            try:
                from ml.advanced_image_classifier import AdvancedPetSymptomImageClassifier
                
                # Try EfficientNet-B0 first (more accurate)
                efficientnet_path = os.path.join(model_dir, 'efficientnet_image_classifier.joblib')
                mobilenet_path = os.path.join(model_dir, 'mobilenet_image_classifier.joblib')
                
                classifier = None
                
                if os.path.exists(efficientnet_path):
                    classifier = AdvancedPetSymptomImageClassifier(model_type='efficientnet')
                    classifier.load_model(efficientnet_path)
                    print("Using EfficientNet-B0 for image analysis")
                elif os.path.exists(mobilenet_path):
                    classifier = AdvancedPetSymptomImageClassifier(model_type='mobilenet')
                    classifier.load_model(mobilenet_path)
                    print("Using MobileNetV3 for image analysis")
                else:
                    # Fallback to basic classifier
                    from ml.image_classifier import PetSymptomImageClassifier
                    classifier = PetSymptomImageClassifier()
                    print("Using basic classifier for image analysis")
                
                image_analysis = classifier.predict(image_url)
                
            except Exception as e:
                print(f"Advanced image analysis failed: {e}")
                # Fallback mock analysis
                image_analysis = {
                    'skin_irritation': 0.3,
                    'eye_problem': 0.2,
                    'ear_infection': 0.1,
                    'dental_issue': 0.1,
                    'normal': 0.3
                }

        # ML Predictions
        try:
            X = pd.DataFrame([{'symptoms': symptoms_text, 'species': species}])
            proba = getattr(pipeline, 'predict_proba')(X)
            classes = list(getattr(pipeline, 'classes_'))
        except Exception:
            # Fallback: text-only
            proba = getattr(pipeline, 'predict_proba')([symptoms_text])
            classes = list(getattr(pipeline, 'classes_'))

        # Top-3 predictions
        probs = proba[0]
        top_idx = sorted(range(len(probs)), key=lambda i: probs[i], reverse=True)[:3]
        predictions = [
            {
                'label': classes[i],
                'confidence': float(probs[i])
            }
            for i in top_idx
        ]

        # Generate AI explanation using Gemini
        ai_explanation = get_gemini_response(
            f"Symptoms: {symptoms_text}\nSpecies: {species}\nML Predictions: {predictions}\nPet Context: {pet_context}",
            chat_mode='symptom_checker'
        )

        # Determine overall severity and urgency
        max_confidence = max([p['confidence'] for p in predictions])
        if max_confidence > 0.8:
            severity = 'high'
            urgency = 'immediate'
        elif max_confidence > 0.6:
            severity = 'moderate'
            urgency = 'soon'
        else:
            severity = 'low'
            # FIX 2: Change "routine" to "Mild" to match your system's terminology
            urgency = 'mild' 

        return Response({
            'predictions': predictions,
            'species': species,
            'pet_context': pet_context,
            'image_analysis': image_analysis,
            'ai_explanation': ai_explanation,
            'severity': severity,
            'urgency': urgency,
            'confidence_score': max_confidence
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _build_comprehensive_soap_report(cleaned, emergency_data, progression, severity, predictions, triage_assessment, user_notes=''):
    """
    Build a comprehensive SOAP report including emergency screening results.
    
    Args:
        cleaned: Cleaned payload data
        emergency_data: Emergency screening results
        progression: Symptom progression
        severity: Severity level
        predictions: Disease predictions
        triage_assessment: Triage assessment results
    
    Returns:
        dict: Complete SOAP report with S, O, A, P sections
    """
    pet_name = cleaned.get('pet_name', 'Pet')
    symptoms_list = cleaned.get('symptoms_list', [])
    symptoms_text = cleaned.get('symptoms_text', '')
    duration_days = float(cleaned.get('duration_days') or 0)
    main_concern = cleaned.get('main_concern', 'Not specified')
    vtl_category = cleaned.get('vtl_category', 'Generalised')
    
    # Format duration
    if duration_days <= 0.5:
        duration_str = 'less than 24 hours'
    elif duration_days <= 3:
        duration_str = '1-3 days'
    elif duration_days <= 7:
        duration_str = '3-7 days'
    else:
        duration_str = 'more than a week'
    
    # Extract emergency screening data
    chief_complaint = ''
    respiration_status = 'Not assessed'
    alertness_status = 'Not assessed'
    perfusion_status = 'Not assessed'
    critical_symptoms = []
    
    if emergency_data and isinstance(emergency_data, dict):
        chief_complaint = emergency_data.get('chiefComplaint', '').strip()
        emergency_screen = emergency_data.get('emergencyScreen', {})
        
        if isinstance(emergency_screen, dict):
            respiration_status = emergency_screen.get('respiration', 'Not assessed')
            alertness_status = emergency_screen.get('alertness', 'Not assessed')
            perfusion_status = emergency_screen.get('perfusion', 'Not assessed')
            critical_symptoms = emergency_screen.get('criticalSymptoms', [])
    
    # Format progression
    progression_map = {
        'getting_worse': 'Getting worse',
        'staying_same': 'Staying about the same',
        'getting_better': 'Getting better',
        'intermittent': 'Coming and going (intermittent)'
    }
    progression_text = progression_map.get(progression, 'Not assessed') if progression else 'Not assessed'
    
    # Format severity
    severity_text = severity.capitalize() if severity else 'Not specified'
    
    # ===== SUBJECTIVE SECTION =====
    subjective_lines = []
    
    if chief_complaint:
        subjective_lines.append(f"Chief Complaint: {chief_complaint}")
    
    subjective_lines.append(f"\nOwner reports {pet_name} experiencing the following symptoms:")
    
    if symptoms_list:
        for symptom in symptoms_list:
            # Convert snake_case to readable format
            readable_symptom = symptom.replace('_', ' ').title()
            subjective_lines.append(f"  • {readable_symptom}")
    else:
        subjective_lines.append("  • [No specific symptoms documented]")

    if user_notes:
        subjective_lines.append(f"\nAdditional Owner Notes:\n\"{user_notes}\"")
    
    subjective_lines.append(f"\nDuration: {duration_str}")
    subjective_lines.append(f"Progression: {progression_text}")
    subjective_lines.append(f"Severity: {severity_text}")
    subjective_lines.append(f"Main concern: {main_concern} (Body system: {vtl_category})")
    
    subjective_text = "\n".join(subjective_lines)
    
    # ===== OBJECTIVE SECTION =====
    objective_lines = []
    
    # Basic patient information
    species = cleaned.get('species', 'Unknown')
    objective_lines.append(f"Species: {species}")
    
    # Add breed, age, weight if available from pet data
    # Note: These would need to be passed from the Pet model
    objective_lines.append("")
    
    # Emergency Screening (RAP Assessment)
    objective_lines.append("Emergency Screening (RAP Assessment):")
    objective_lines.append(f"  • Respiration: {respiration_status}")
    objective_lines.append(f"  • Alertness: {alertness_status}")
    objective_lines.append(f"  • Perfusion: {perfusion_status}")
    
    if critical_symptoms:
        critical_list = ", ".join(critical_symptoms)
        objective_lines.append(f"  • Critical symptoms: {critical_list}")
    else:
        objective_lines.append("  • Critical symptoms: None detected")
    
    objective_lines.append("")
    
    # Symptoms Documented
    objective_lines.append("Symptoms Documented:")
    if symptoms_list:
        for symptom in symptoms_list:
            readable_symptom = symptom.replace('_', ' ').title()
            objective_lines.append(f"  • {readable_symptom}")
    else:
        objective_lines.append("  • [No specific symptoms documented]")
    
    objective_lines.append("")
    objective_lines.append("Assessment conducted: AI-powered symptom analysis via structured triage questionnaire")
    
    objective_text = "\n".join(objective_lines)
    
    # ===== ASSESSMENT SECTION =====
    assessment_lines = []
    
    # Differential diagnoses
    top_names = [p['disease'] for p in predictions[:3]] if predictions else []
    if top_names:
        assessment_lines.append("Differential Diagnoses:")
        for i, disease in enumerate(top_names, 1):
            assessment_lines.append(f"  {i}. {disease}")
    else:
        assessment_lines.append("Differential Diagnoses: Unable to determine from available data")
    
    assessment_lines.append("")
    
    # Triage Classification
    overall_urgency = triage_assessment.get('overall_urgency', 'Moderate')
    urgency_reasoning = triage_assessment.get('urgency_reasoning', [])
    
    assessment_lines.append(f"Triage Classification: {overall_urgency.upper()}")
    assessment_lines.append("Based on:")
    
    if urgency_reasoning:
        for reason in urgency_reasoning:
            assessment_lines.append(f"  • {reason}")
    else:
        assessment_lines.append("  • Comprehensive symptom and emergency screening assessment")
    
    assessment_text = "\n".join(assessment_lines)
    
    # ===== PLAN SECTION =====
    plan_lines = []
    
    requires_care_within = triage_assessment.get('requires_care_within', '24-48 hours')
    requires_immediate = triage_assessment.get('requires_immediate_care', False)
    
    if requires_immediate:
        plan_lines.append("⚠️ IMMEDIATE CARE REQUIRED")
        plan_lines.append("Seek emergency veterinary care immediately. Contact your emergency vet or nearest 24-hour clinic.")
    else:
        plan_lines.append(f"Recommended timeline: {requires_care_within}")
    
    plan_lines.append("")
    plan_lines.append("Monitoring recommendations:")
    plan_lines.append("  • Monitor for worsening symptoms")
    plan_lines.append("  • Track symptom progression and any changes")
    plan_lines.append("  • Maintain detailed notes of symptom patterns")
    
    if progression == 'getting_worse':
        plan_lines.append("  • Given worsening progression, seek care sooner rather than later")
    
    plan_lines.append("")
    plan_lines.append("Note: This assessment is AI-generated and does not replace professional veterinary diagnosis.")
    plan_lines.append("Always consult with a licensed veterinarian for definitive diagnosis and treatment.")
    
    plan_text = "\n".join(plan_lines)
    
    # Return complete SOAP report
    return {
        'subjective': subjective_text,
        'objective': objective_text,
        'assessment': assessment_text,
        'plan': plan_text,
        'full_report': f"S - SUBJECTIVE:\n{subjective_text}\n\nO - OBJECTIVE:\n{objective_text}\n\nA - ASSESSMENT:\n{assessment_text}\n\nP - PLAN:\n{plan_text}"
    }


def _calculate_triage_assessment(emergency_data, severity, progression, predictions):
    """
    Calculate comprehensive triage assessment based on multiple factors.
    
    Args:
        emergency_data: Emergency screening results from frontend
        severity: User-selected severity (mild/moderate/severe)
        progression: Symptom progression (getting_worse/staying_same/getting_better/intermittent)
        predictions: List of disease predictions with urgency levels
    
    Returns:
        dict: Triage assessment with urgency level and reasoning
    """
    urgency_reasoning = []
    is_emergency = False
    requires_immediate_care = False
    
    # 1. Check emergency screening (HIGHEST PRIORITY)
    if emergency_data and isinstance(emergency_data, dict):
        emergency_screen = emergency_data.get('emergencyScreen', {})
        if isinstance(emergency_screen, dict):
            is_emergency = emergency_screen.get('isEmergency', False)
            
            if is_emergency:
                requires_immediate_care = True
                urgency_reasoning.append("Emergency indicators detected in RAP screening")
                
                # Add specific emergency details
                critical_symptoms = emergency_screen.get('criticalSymptoms', [])
                if critical_symptoms:
                    urgency_reasoning.append(f"Critical symptoms present: {', '.join(critical_symptoms)}")
                
                return {
                    'overall_urgency': 'immediate',
                    'emergency_indicators': True,
                    'requires_immediate_care': True,
                    'requires_care_within': 'Immediately - seek emergency veterinary care',
                    'urgency_reasoning': urgency_reasoning
                }
    
    # 2. Check disease prediction urgency
    highest_disease_urgency = 'moderate'
    if predictions:
        disease_urgencies = [p.get('urgency', 'moderate') for p in predictions]
        if any(u in ['high', 'severe', 'immediate'] for u in disease_urgencies):
            highest_disease_urgency = 'high'
            urgency_reasoning.append("High-urgency condition predicted")
        elif any(u == 'urgent' for u in disease_urgencies):
            highest_disease_urgency = 'urgent'
    
    # 3. Evaluate severity level
    if severity == 'severe':
        urgency_reasoning.append("Severe symptoms reported")
        if highest_disease_urgency == 'high':
            return {
                'overall_urgency': 'urgent',
                'emergency_indicators': False,
                'requires_immediate_care': False,
                'requires_care_within': '12-24 hours',
                'urgency_reasoning': urgency_reasoning
            }
    elif severity == 'moderate':
        urgency_reasoning.append("Moderate severity symptoms")
    else:  # mild
        urgency_reasoning.append("Mild symptoms reported")
    
    # 4. Factor in progression
    if progression == 'getting_worse':
        urgency_reasoning.append("Symptoms are getting worse - recommend monitoring closely")
        # Escalate urgency if symptoms are worsening
        if severity in ['moderate', 'severe']:
            return {
                'overall_urgency': 'urgent',
                'emergency_indicators': False,
                'requires_immediate_care': False,
                'requires_care_within': '12-24 hours',
                'urgency_reasoning': urgency_reasoning
            }
    elif progression == 'getting_better':
        urgency_reasoning.append("Symptoms are improving")
    elif progression == 'intermittent':
        urgency_reasoning.append("Symptoms are intermittent - patterns should be monitored")
    elif progression == 'staying_same':
        urgency_reasoning.append("Symptoms are stable")
    
    # 5. Default urgency calculation
    if severity == 'severe' or highest_disease_urgency == 'high':
        overall_urgency = 'urgent'
        requires_care_within = '12-24 hours'
    elif severity == 'moderate' or progression == 'getting_worse':
        overall_urgency = 'moderate'
        requires_care_within = '24-48 hours'
    else:
        overall_urgency = 'routine'
        requires_care_within = 'Schedule regular appointment within a few days'
    
    return {
        'overall_urgency': overall_urgency,
        'emergency_indicators': False,
        'requires_immediate_care': False,
        'requires_care_within': requires_care_within,
        'urgency_reasoning': urgency_reasoning
    }


def calculate_dynamic_urgency(user_input, predicted_disease, metadata):
    """
    Calculate urgency based on user input + red flags, not just disease metadata.
    
    Args:
        user_input: Cleaned payload from frontend with symptoms, severity, progression, etc.
        predicted_disease: Top predicted disease name
        metadata: Disease metadata from model
    
    Returns:
        dict: Dynamic urgency assessment with score, red flags, and recommendations
    """
    urgency_score = 0
    red_flags = []
    
    # User-selected severity (highest weight)
    severity = user_input.get('severity', 'moderate')
    if severity == 'severe':
        urgency_score += 3
        red_flags.append("Severe symptoms reported")
    elif severity == 'moderate':
        urgency_score += 2
    else:
        urgency_score += 1
    
    # Progression (getting worse = more urgent)
    progression = user_input.get('progression', 'same')
    if progression == 'getting_worse':
        urgency_score += 2
        red_flags.append("Symptoms worsening")
    
    # RED FLAG SYMPTOMS (critical indicators)
    symptoms = user_input.get('symptoms_list', [])
    emergency_data = user_input.get('emergency_data', {})
    emergency_screen = emergency_data.get('emergencyScreen', {}) if emergency_data else {}
    
    # Check emergency screening results
    perfusion = emergency_screen.get('perfusion', '')
    if perfusion in ['pale_white', 'blue_purple']:
        urgency_score += 3
        red_flags.append("Pale/blue gums - possible shock or blood loss")
    
    respiration = emergency_screen.get('respiration', '')
    if respiration in ['gasping', 'not_breathing', 'open_mouth_breathing']:
        urgency_score += 3
        red_flags.append("Respiratory distress")
    
    alertness = emergency_screen.get('alertness', '')
    if alertness in ['unresponsive', 'disoriented']:
        urgency_score += 3
        red_flags.append("Altered consciousness")
    
    # Check for blood-related symptoms
    blood_symptoms = ['blood_in_urine', 'bloody_stool', 'vomiting_blood', 'hemoptysis']
    if any(s in symptoms for s in blood_symptoms):
        urgency_score += 2
        red_flags.append("Blood in vomit/stool/urine")
    
    # Check critical symptoms from emergency screening
    critical_symptoms = emergency_screen.get('criticalSymptoms', [])
    if len(critical_symptoms) > 0:
        urgency_score += 3
        for symptom in critical_symptoms:
            red_flags.append(f"Critical: {symptom}")
    
    # Duration (sudden onset = more concerning)
    duration = user_input.get('duration_days', 3)
    if duration < 1:  # Less than 24 hours
        urgency_score += 1
        red_flags.append("Rapid onset")
    
    # Map score to urgency level
    if urgency_score >= 7:
        urgency = "critical"
        recommendation = "⚠️ URGENT: This appears to be a medical emergency. Seek immediate veterinary care. Contact your emergency vet or nearest 24-hour clinic immediately."
        timeline = "Immediate - do not wait"
    elif urgency_score >= 5:
        urgency = "high"
        recommendation = "HIGH URGENCY: These symptoms require prompt veterinary attention. Contact your vet today or visit an emergency clinic if after hours."
        timeline = "Within 2-6 hours"
    elif urgency_score >= 3:
        urgency = "moderate"
        recommendation = "Schedule a vet visit within 24-48 hours. Monitor closely for worsening symptoms."
        timeline = "Within 24-48 hours"
    else:
        urgency = "low"
        recommendation = "Monitor at home. Schedule routine vet visit if symptoms persist or worsen."
        timeline = "Within 3-7 days or as needed"
    
    return {
        'urgency': urgency,
        'urgency_score': urgency_score,
        'red_flags': red_flags,
        'recommendation': recommendation,
        'timeline': timeline,
        'disease_base_urgency': metadata.get('urgency', 'moderate') if metadata else 'moderate'
    }


@api_view(['POST'])
@authentication_classes([])  # Custom auth via check_user_or_admin
@permission_classes([AllowAny])
def symptom_checker_predict(request):
    """Predict likely diseases from structured symptom checker payload using PawPal LightGBM.

    Expected payload (from conversational questionnaire):
    {
      "pet_name": "Max",
      "pet_id": 123,
      "species": "Dog",
      "urgency": "moderate",
      "duration_days": 3.0,
      "symptoms_list": ["vomiting", "lethargy", "loss_of_appetite"],
      "symptoms_text": "vomiting, lethargy, loss_of_appetite",
      "symptom_count": 3,
      "main_concern": "Digestive Issues",
      "severity": "moderate",
      "vtl_category": "Gastrointestinal",
      "progression": "getting_worse",
      "emergency_data": {
        "chiefComplaint": "Dog vomiting all morning",
        "emergencyScreen": {
          "respiration": "normal_breathing",
          "alertness": "alert_and_aware",
          "perfusion": "normal_pink",
          "criticalSymptoms": [],
          "isEmergency": false
        },
        "timestamp": "2024-11-16T10:30:00Z"
      }
    }
    
    Returns enhanced response with triage_assessment:
    {
      "success": true,
      "predictions": [...],
      "triage_assessment": {
        "overall_urgency": "moderate",
        "emergency_indicators": false,
        "requires_immediate_care": false,
        "requires_care_within": "24-48 hours",
        "urgency_reasoning": [...]
      },
      "soap_data": {
        "subjective": "Owner reports: Chief complaint. Symptoms progression...",
        "objective": "Emergency screening results...",
        ...
      }
    }
    """
    from utils.unified_permissions import check_user_or_admin
    from django.contrib.auth.models import AnonymousUser

    # Authenticate user (pet owner only)
    if isinstance(request.user, AnonymousUser) or not getattr(request.user, 'id', None):
        user_type, user_obj, error_response = check_user_or_admin(request)
        if error_response:
            return error_response
        if user_type != 'pet_owner':
            return Response(
                {
                    'success': False,
                    'error': 'Only pet owners can use the symptom checker prediction',
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        request.user = user_obj
    else:
        user_obj = request.user

    # Rate limiting per user
    if _rate_limit_symptom_checker(user_obj.id, max_requests=10, window_seconds=60):
        return Response(
            {
                'success': False,
                'error': 'Too many symptom checker requests. Please try again in a minute.',
            },
            status=429,
        )

    try:
        payload = request.data or {}
        logger.info(f"Symptom checker predict received payload: {payload}")
        
        # Check species early to determine if we should bypass question-tree validation
        species = str(payload.get('species', '')).strip().capitalize()
        is_standard_species = species in ['Dog', 'Cat', 'Rabbit']
        vector_result = None  # Will be set in either branch
        
        # For non-standard species (Bird, Fish, Reptile, Turtle, Amphibian), bypass validation
        # and use vector similarity directly with user_notes
        if not is_standard_species:
            logger.info(f"🔄 Dynamic mode detected for species: {species}. Bypassing question-tree validation.")
            
            # Get minimal required fields
            pet_id = payload.get('pet_id')
            pet_name = payload.get('pet_name', 'Unknown Pet')
            user_notes = payload.get('user_notes', '')
            
            if not user_notes or not user_notes.strip():
                return Response(
                    {
                        'success': False,
                        'error': 'user_notes is required for dynamic mode species.',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Verify pet ownership if pet_id provided
            if pet_id:
                try:
                    pet = Pet.objects.get(id=pet_id, owner=user_obj)
                except Pet.DoesNotExist:
                    return Response(
                        {
                            'success': False,
                            'error': 'Pet not found or not owned by the current user.',
                        },
                        status=status.HTTP_404_NOT_FOUND,
                    )
            
            # Prepare minimal payload for vector similarity
            minimal_payload = {
                'pet_id': pet_id,
                'pet_name': pet_name,
                'species': species,
                'breed': getattr(pet, 'breed', 'Unknown'), 
                'age': getattr(pet, 'age', 'Unknown'),
                'user_notes': user_notes.strip(),
                'symptoms_list': [],  # Empty - will be extracted from user_notes
                'urgency': 'moderate',  # Default
                'duration_days': None,
            }
            
            # Call vector similarity directly
            from vector_similarity_django_integration import predict_with_vector_similarity
            
            logger.info(f"🔍 VECTOR SIMILARITY PREDICTION (Dynamic Mode) FOR {pet_name}")
            logger.info(f"Species: {species}")
            logger.info(f"User notes: '{user_notes[:200]}...'")
            
            vector_result = predict_with_vector_similarity(minimal_payload)
            
            if not vector_result.get('success'):
                raise Exception(vector_result.get('error', 'Prediction failed'))
            
            # Set cleaned for use in rest of processing
            cleaned = minimal_payload
            # Skip to processing section - vector_result is already obtained
        else:
            # Standard validation for Dog, Cat, Rabbit
            is_valid, cleaned, error_response = _validate_symptom_checker_payload(payload)
            if not is_valid:
                logger.error(f"Symptom checker payload validation failed. Payload: {payload}")
                return error_response

            pet_id = cleaned.get('pet_id')
            pet = None
            if pet_id:
                try:
                    pet = Pet.objects.get(id=pet_id, owner=user_obj)
                    cleaned['age'] = pet.age
                    cleaned['breed'] = pet.breed
                    cleaned['sex'] = pet.sex    
                    cleaned['pet_name'] = pet.name
                except Pet.DoesNotExist:
                    return Response(
                        {
                            'success': False,
                            'error': 'Pet not found or not owned by the current user.',
                        },
                        status=status.HTTP_404_NOT_FOUND,
                    )

            # ============================================================
            # VECTOR SIMILARITY PREDICTION (Replaces LightGBM)
            # ============================================================
            from vector_similarity_django_integration import predict_with_vector_similarity
        
        try:
            # Debug logging
            pet_name_debug = cleaned.get('pet_name', 'Unknown Pet')
            logger.info(f"{'='*60}")
            logger.info(f"🔍 VECTOR SIMILARITY PREDICTION FOR {pet_name_debug}")
            logger.info(f"{'='*60}")
            logger.info(f"Species: {cleaned.get('species')}")
            logger.info(f"Input symptoms: {cleaned.get('symptoms_list', [])}")
            logger.info(f"Severity: {cleaned.get('severity')}")
            logger.info(f"Progression: {cleaned.get('progression')}")
            
            # HYBRID TRIAGE: Log user_notes if present
            user_notes = cleaned.get('user_notes', '')
            if user_notes:
                logger.info(f"🔍 HYBRID TRIAGE: User-typed symptoms: '{user_notes}'")
            
            # Run vector similarity prediction (includes user_notes extraction)
            # Note: For dynamic mode, vector_result is already set above
            if vector_result is None:
                # Run vector similarity prediction for standard species
                vector_result = predict_with_vector_similarity(cleaned)
            
            if not vector_result.get('success'):
                raise Exception(vector_result.get('error', 'Prediction failed'))
            
            # Convert vector similarity results to existing prediction format
            predictions = []
            symptoms_list = list(cleaned.get('symptoms_list') or [])
            
            for match in vector_result['predictions']:
                disease_name = match['disease']
                conf = match.get('internal_probability', match.get('probability', 0.0))
    
                # Also capture our new match label for the UI
                match_level = match.get('match_level', 'Possible consideration')
                
                logger.info(f"Processing disease {disease_name} with finding: {match_level}")
                
                # Build prediction object in existing format
                matching_symptoms = match.get('matched_symptoms', [])
                
                # Determine urgency (vector similarity provides base urgency)
                base_urgency = match.get('urgency', 'moderate')
                contagious = match.get('contagious', False)
                
                # ============================================================
                # 🚨 CRITICAL SAFETY OVERRIDE - EMERGENCY DISEASES
                # ============================================================
                # These diseases MUST ALWAYS be marked as EMERGENCY regardless
                # of confidence or symptom matching to prevent dangerous
                # misclassification (e.g., Canine Parvovirus as LOW urgency)
                EMERGENCY_DISEASES = {
                    # Dogs
                    'Gastric Dilation (Bloat)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Bloat/GDV': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Bloat/Gastric Dilation': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Canine Parvovirus': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Heatstroke': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Heat Stroke': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Drowning/Hypothermia': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Urethral Obstruction': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Urinary Obstruction': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Urinary Blockage': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Pyometra': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Breathing Difficulties': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Rabies': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Infectious Canine Hepatitis': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Pancreatitis (Acute)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                
                # Cats
                'Feline Panleukopenia Virus': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Urinary Blockage': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Feline Infectious Peritonitis (Wet form)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                
                # Rabbits
                'Rabbit Hemorrhagic Disease Virus': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Heat Stress': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Flystrike (Myiasis)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Dystocia (Egg Binding equivalent)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                
                # Hamsters
                'Wet Tail (Proliferative Ileitis)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Wet Tail': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                
                # Turtles
                'Heat Shock': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Cold Water Shock': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Shell Injuries/Trauma (Severe)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Prolapse (Cloacal/Vent)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Dystocia (Egg Binding)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                
                # Fish
                'Ammonia Poisoning': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Nitrate Poisoning (Severe)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'pH Shock': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Oxygen Deprivation': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Hemorrhagic Septicemia': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                '(Hemorrhagic Septicemia / Ulcerative Syndromes)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Dropsy (Advanced)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Koi Herpes Virus': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                
                # Birds
                'Avian Influenza': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Newcastle Disease': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Psittacosis (Chlamydiosis, Severe)': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                "Pacheco's Disease": {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Egg Binding': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Dystocia': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Heavy Metal Poisoning': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Vent Prolapse': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                'Cloacal Prolapse': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                
                    # General
                    'Internal Bleeding': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                    'Respiratory Distress Syndrome': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                    'Toxicity': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                    'Seizures': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE - Life threatening', 'recommendation': 'SEEK EMERGENCY VET CARE IMMEDIATELY'},
                }
                
                # 🚨 SAFETY OVERRIDE: Check if this is an emergency disease
                # Special case: Heatstroke only if heat-related symptoms present
                should_override = False
                if disease_name in ['Heatstroke', 'Heat Stroke', 'Heat shock']:
                    # Only trigger if actual heat symptoms present
                    heat_symptoms = {'panting', 'excessive_heat', 'collapse', 'rapid_heartbeat', 'fever'}
                    if any(sym in matching_symptoms for sym in heat_symptoms):
                        should_override = True
                        logger.warning(f"🚨 SAFETY OVERRIDE: {disease_name} with heat symptoms detected")
                elif disease_name in EMERGENCY_DISEASES:
                    should_override = True
                    logger.warning(f"🚨 SAFETY OVERRIDE: {disease_name} forced to EMERGENCY urgency")
                
                if should_override:
                    emergency_override = EMERGENCY_DISEASES[disease_name].copy()
                    emergency_override['red_flags'] = ['🚨 CRITICAL CONDITION - This is a life-threatening emergency']
                    dynamic_urgency = emergency_override
                else:
                    # Use vector similarity urgency or calculate dynamic urgency
                    # Map vector similarity urgency levels to urgency scores
                    urgency_map = {
                        'critical': {'urgency': 'critical', 'urgency_score': 10, 'timeline': 'IMMEDIATE', 'recommendation': 'Seek emergency veterinary care immediately'},
                        'high': {'urgency': 'high', 'urgency_score': 8, 'timeline': 'Within 2-4 hours', 'recommendation': 'Contact veterinarian urgently'},
                        'moderate': {'urgency': 'moderate', 'urgency_score': 5, 'timeline': '24-48 hours', 'recommendation': 'Schedule veterinary appointment'},
                        'medium': {'urgency': 'moderate', 'urgency_score': 5, 'timeline': '24-48 hours', 'recommendation': 'Schedule veterinary appointment'},
                        'mild': {'urgency': 'low', 'urgency_score': 3, 'timeline': '2-7 days', 'recommendation': 'Monitor and schedule routine appointment'},
                        'low': {'urgency': 'low', 'urgency_score': 3, 'timeline': '2-7 days', 'recommendation': 'Monitor and schedule routine appointment'},
                    }
                    dynamic_urgency = urgency_map.get(base_urgency.lower(), urgency_map['moderate']).copy()
                    dynamic_urgency['red_flags'] = []

                prediction_obj = {
                    'disease': disease_name,
                    'confidence': conf,
                    'confidence_pct': f"{conf*100:.0f}%",
                    'urgency': dynamic_urgency['urgency'],
                    'urgency_score': dynamic_urgency['urgency_score'],
                    'red_flags': dynamic_urgency['red_flags'],
                    'recommendation': dynamic_urgency['recommendation'],
                    'timeline': dynamic_urgency['timeline'],
                    'contagious': contagious,
                    'matching_symptoms': matching_symptoms,
                    'common_symptoms': matching_symptoms,  # Vector similarity shows matched symptoms
                    'care_guidelines': match.get('care_guidelines') or match.get('match_explanation', ''),
                    'when_to_see_vet': match.get('when_to_see_vet') or dynamic_urgency['recommendation'],
                    'match_explanation': match.get('match_explanation', ''),  # NEW: Explainability
                    'user_coverage': match.get('user_coverage', 0),  # NEW: % of user symptoms matched
                }
                
                predictions.append(prediction_obj)

            predictions.sort(key=lambda x: x['confidence'], reverse=True)
            
            logger.info(f"Vector similarity returned {len(predictions)} predictions")
            
        except Exception as e:
            logger.exception('Error during vector similarity prediction: %s', e)
            return Response(
                {
                    'success': False,
                    'error': 'Disease prediction failed. Please try again later.',
                    'details': str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
        logger.info(f"After filtering and sorting: {len(predictions)} predictions collected")
        for i, pred in enumerate(predictions):
            logger.info(f"  Prediction {i+1}: {pred.get('disease')} - confidence: {pred.get('confidence'):.4f}")

        if predictions:
            highest_urgency = max((p.get('urgency') or 'moderate') for p in predictions)
        else:
            highest_urgency = cleaned.get('urgency', 'moderate')

        urgency_level = highest_urgency
        should_see_vet_immediately = any(
            str(p.get('urgency', '')).lower() in {'high', 'severe', 'immediate'} for p in predictions
        )

        pet_name = cleaned.get('pet_name')
        
        # === FIX START: Handle User Notes and Text ===
        user_notes = cleaned.get('user_notes', '')
        symptoms_text = cleaned.get('symptoms_text', '')
        
        # Combine into one robust text for downstream use (SOAP generation)
        full_symptoms_text = symptoms_text
        if user_notes:
            if full_symptoms_text:
                full_symptoms_text = f"{symptoms_text}. Owner Notes: {user_notes}"
            else:
                full_symptoms_text = f"Owner Notes: {user_notes}"
        # === FIX END ===
        duration_days = float(cleaned.get('duration_days') or 0)
        if duration_days <= 0.5:
            duration_str = 'less than 24 hours'
        elif duration_days <= 3:
            duration_str = '1-3 days'
        elif duration_days <= 7:
            duration_str = '3-7 days'
        else:
            duration_str = 'more than a week'

        top_names = [p['disease'] for p in predictions[:3]] if predictions else []

        # Get emergency data and progression for enhanced triage
        emergency_data = cleaned.get('emergency_data')
        progression = cleaned.get('progression')
        severity = cleaned.get('severity', 'moderate')
        
        # === SAFETY OVERRIDE: Use vector_result triage if safety override is active ===
        # Check if vector similarity prediction included a safety override
        vector_triage = vector_result.get('triage_assessment')
        has_safety_override = vector_triage and vector_triage.get('safety_override_applied', False)
        
        if has_safety_override:
            # CRITICAL: Use the triage_assessment from vector_result (contains safety override)
            triage_assessment = vector_triage
            logger.warning(f"🚨 SAFETY OVERRIDE DETECTED - Using triage_assessment from vector_result")
            logger.warning(f"   Overall urgency: {triage_assessment.get('overall_urgency')}")
            logger.warning(f"   Red flags: {triage_assessment.get('red_flags')}")
        else:
            # Normal flow: Calculate comprehensive triage assessment
            triage_assessment = _calculate_triage_assessment(
                emergency_data=emergency_data,
                severity=severity,
                progression=progression,
                predictions=predictions
            )
        
        # Build comprehensive SOAP report with emergency screening
        soap_data = _build_comprehensive_soap_report(
            cleaned=cleaned,
            emergency_data=emergency_data,
            progression=progression,
            severity=severity,
            predictions=predictions,
            triage_assessment=triage_assessment,
            user_notes=user_notes
        )
        
        # === SAFETY OVERRIDE: Use vector_result recommendation if safety override is active ===
        # Update overall recommendation based on triage (UNLESS safety override is active)
        if has_safety_override:
            # CRITICAL: Use the recommendation from vector_result (contains specific symptom details)
            overall_recommendation = vector_result.get('overall_recommendation') or triage_assessment.get('urgency_reasoning', [''])[0]
            logger.warning(f"🚨 SAFETY OVERRIDE - Using recommendation from vector_result")
            logger.warning(f"   Recommendation: '{overall_recommendation}'")
        elif triage_assessment.get('requires_immediate_care'):
            overall_recommendation = (
                "⚠️ URGENT: This appears to be a medical emergency. "
                "Seek immediate veterinary care. Contact your emergency vet or nearest 24-hour clinic immediately."
            )
        elif triage_assessment.get('overall_urgency') == 'urgent':
            overall_recommendation = (
                "Based on the assessment, veterinary care is recommended within 12-24 hours. "
                "Monitor closely for any worsening symptoms and seek immediate care if condition deteriorates."
            )
        elif triage_assessment.get('overall_urgency') == 'moderate':
            overall_recommendation = (
                "Based on the current severity and symptom pattern, we recommend scheduling a vet visit within 24-48 hours. "
                "Monitor for worsening symptoms such as persistent vomiting, severe lethargy, or signs of dehydration."
            )
        else:
            overall_recommendation = (
                "Continue monitoring your pet's condition. Schedule a routine veterinary appointment within a few days. "
                "Seek care sooner if symptoms worsen or new concerning signs develop."
            )

        response_payload = {
            'success': True,
            'pet_name': pet_name,
            'assessment_date': timezone.now().isoformat(),
            'predictions': predictions,
            'overall_recommendation': overall_recommendation,
            'urgency_level': vector_result.get('urgency_level') or triage_assessment.get('overall_urgency', urgency_level),
            'should_see_vet_immediately': triage_assessment.get('requires_immediate_care', should_see_vet_immediately),
            'triage_assessment': triage_assessment,
            'soap_data': soap_data,
            'symptoms_text': full_symptoms_text,
        }
        
        logger.info(f"Symptom checker predict returning {len(predictions)} predictions: {[p.get('disease') for p in predictions]}")

        return Response(response_payload)
    except Exception as e:
        logger.exception('Unhandled error in symptom_checker_predict: %s', e)
        return Response(
            {
                'success': False,
                'error': 'Internal server error while processing symptom checker prediction.',
                'details': str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def create_ai_diagnosis(request):
    """Create a comprehensive AI diagnosis report"""
    print("\n" + "="*50)
    print("🔴 CREATE_AI_DIAGNOSIS CALLED")
    print("="*50 + "\n")
    
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can create AI diagnoses
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can create AI diagnoses'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from pets.models import Pet
        
        data = request.data
        pet_id = data.get('pet_id')
        symptoms_text = data.get('symptoms', '')
        assessment_data = data.get('assessment_data', {})
        conversation_id = data.get('conversation_id')  # Get conversation_id if provided
        
        if not pet_id:
            return Response({'error': 'pet_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get pet
        try:
            pet = Pet.objects.get(id=pet_id, owner=user_obj)
        except Pet.DoesNotExist:
            return Response({'error': 'Pet not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Generate explicit case_id with better uniqueness (12 chars for maximum uniqueness)
        # This prevents collisions that were causing assessments to appear overwritten
        # Generate it early so we can use it in SOAP data generation
        explicit_case_id = f"PDX-{timezone.now().strftime('%Y-%m%d')}-{str(uuid.uuid4())[:12].upper()}"
        print(f"🟢 Step 0: Generated explicit case_id: {explicit_case_id}")
        
        # Use assessment data from symptom checker if available
# Use assessment data from symptom checker if available
        if assessment_data:
            predictions = assessment_data.get('predictions', [])
            urgency_level = assessment_data.get('urgency_level', 'moderate')
            overall_recommendation = assessment_data.get('overall_recommendation', '')
            triage_assessment = assessment_data.get('triage_assessment', {})
            
            # --- FIX: Ensure symptoms list is populated from multiple possible sources ---
            input_symptoms = assessment_data.get('symptoms_list', [])
            if not input_symptoms and symptoms_text:
                 # Fallback to splitting the symptoms text string if list is empty
                 input_symptoms = [s.strip() for s in symptoms_text.split(',') if s.strip()]

            # Build raw_predictions dict
            raw_predictions = {
                'confidences': predictions,
                'top_prediction': predictions[0].get('disease', predictions[0].get('label', 'Unknown')) if predictions else 'Unknown',
                'confidence': predictions[0].get('confidence', 0) if predictions else 0,
                'top_prediction_details': predictions[0] if predictions else {},
                
                # CRITICAL: Pass the populated list and text here
                'symptoms': input_symptoms,
                'symptoms_text': symptoms_text or assessment_data.get('symptoms_text', ''),
                
                'duration': assessment_data.get('duration_days', 'Unspecified'),
                'species': pet.animal_type if pet else 'Dog', # Added species for summary generation
                'case_id': explicit_case_id
            }
            
            # Extract Verification & Triage Urgency
            verification_result = assessment_data.get('triage_assessment', {}).get('verification_result') or {}
            triage_urgency = assessment_data.get('triage_assessment', {}).get('overall_urgency')
            
            # Generate SOAP Data with Severity Override
            from vector_similarity_django_integration import format_soap_report_with_vector_similarity
            
            soap_data = format_soap_report_with_vector_similarity(
                pet.name, 
                raw_predictions, 
                verification_result,
                override_severity=triage_urgency 
            )
            
            logger.info(f"Assessment data keys: {assessment_data.keys()}")
            logger.info(f"SOAP data generated: {bool(soap_data)}")
            logger.info(f"SOAP data keys: {soap_data.keys() if soap_data else 'None'}")
        else:
            return Response({'error': 'assessment_data is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        print("🟢 Step 1: Got predictions, building suggested_diagnoses")
        
        # Get top prediction for overall severity
        top_prediction = predictions[0] if predictions else {}
        
        # Build suggested diagnoses from predictions
        suggested_diagnoses = []    
        for pred in predictions:
            suggested_diagnoses.append({
                'condition_name': pred.get('disease', pred.get('label', 'Unknown')),
                'likelihood_percentage': pred.get('confidence', 0) * 100,
                'description': pred.get('recommendation', f"AI-suggested condition based on symptoms"),
                'urgency_level': pred.get('urgency', urgency_level),
                'contagious': pred.get('contagious', False),
                'red_flags': pred.get('red_flags', []),
                'timeline': pred.get('timeline', ''),

                'recommendation': pred.get('recommendation', ''),
                'care_guidelines': pred.get('care_guidelines', ''),
                'when_to_see_vet': pred.get('when_to_see_vet', ''),
                'match_explanation': pred.get('match_explanation', ''),
            })
        
        print("🟢 Step 2: About to create AIDiagnosis record")
        print(f"🟢 Step 2a: Generated explicit case_id: {explicit_case_id}")

        ml_predictions_storage = {
            'predictions': predictions,
            'triage_assessment': triage_assessment
        }
        
        # Create AI Diagnosis record with explicit case_id
        ai_diagnosis = AIDiagnosis.objects.create(
            user=user_obj,
            pet=pet,
            case_id=explicit_case_id,  # Use explicit case_id to prevent collisions
            symptoms_text=symptoms_text or assessment_data.get('symptoms_text', 'Symptom assessment completed'),
            image_analysis=None,  # Not using image analysis from symptom checker
            ml_predictions=ml_predictions_storage,
            ai_explanation=overall_recommendation,
            suggested_diagnoses=suggested_diagnoses,
            overall_severity=triage_assessment.get('overall_urgency', urgency_level),
            urgency_level=urgency_level,
            pet_context={
                'pet_name': pet.name,
                'species': pet.animal_type,
                'age': pet.age,
                'weight': str(pet.weight) if pet.weight else None
            },
            confidence_score=top_prediction.get('confidence', 0.0)
        )
        
        print(f"🟢 Step 3: AIDiagnosis created with case_id: {ai_diagnosis.case_id}")
        
        # Always create SOAP Report
        # Map urgency to flag level
        flag_level_map = {
            'critical': 'critical',
            'immediate': 'critical',
            'high': 'urgent',
            'urgent': 'urgent',
            'moderate': 'moderate',
            'low': 'routine'
        }
        flag_level = flag_level_map.get(urgency_level, 'moderate')
        print("🔵 Step 4: Building SOAP data...")
        
        # Build SOAP report data
        # Build SOAP report data
        
        # === FIX: Ensure Subjective Text in SOAP Report includes notes ===
        gen_subjective = soap_data.get('subjective', '') if soap_data else ''
        
        # Logic: If the generated text is empty, OR if we have specific user text 
        # that isn't fully inside the generated text, append it.
        subjective_text = gen_subjective
        if not subjective_text:
            subjective_text = symptoms_text or 'Symptom assessment completed'
        elif symptoms_text and len(symptoms_text) > 5 and symptoms_text not in gen_subjective:
             # Append owner details safely so we don't lose the structured format
             subjective_text = f"{gen_subjective}\n\nOwner Reported Details: {symptoms_text}"
        # ==============================================================
        objective_data = soap_data.get('objective', {
            'symptoms': predictions[0].get('matching_symptoms', []) if predictions else [],
            'duration': assessment_data.get('symptoms_text', ''),
            'severity': assessment_data.get('severity', 'moderate')
        }) if soap_data else {
            'symptoms': predictions[0].get('matching_symptoms', []) if predictions else [],
            'duration': assessment_data.get('symptoms_text', ''),
            'severity': assessment_data.get('severity', 'moderate')
        }
        
        assessment_soap = soap_data.get('assessment', suggested_diagnoses) if soap_data else suggested_diagnoses
        
        plan_data = soap_data.get('plan', {
            'severityLevel': urgency_level,
            'careAdvice': [overall_recommendation]
        }) if soap_data else {
            'severityLevel': urgency_level,
            'careAdvice': [overall_recommendation]
        }
        
        # Preserve clinical_summary_backup if it exists in soap_data
        if soap_data and soap_data.get('clinical_summary'):
            plan_data['clinical_summary_backup'] = soap_data.get('clinical_summary')

        if overall_recommendation:
            plan_data['aiExplanation'] = overall_recommendation
        
        # Use the explicit case_id we generated, save it cleanly without # prefix
        # The frontend handles the display symbol
        explicit_case_id_clean = explicit_case_id.lstrip('#')
        soap_case_id = explicit_case_id_clean
        
        logger.info(f"🔵 About to create SOAP report for case_id: {soap_case_id}")
        logger.info(f"🔵 SOAP parameters: case_id={soap_case_id}, pet={pet.id}, flag_level={flag_level}")
        
        try:
            # Always create new SOAP report with our unique case_id
            # No need to check for existing - our case_id is guaranteed unique
            
            # Link to conversation if provided
            conversation = None
            if conversation_id:
                try:
                    from .models import Conversation
                    conversation = Conversation.objects.get(id=conversation_id, user=user_obj)
                    logger.info(f"🔗 Linking SOAP report to conversation {conversation_id}")
                except Conversation.DoesNotExist:
                    logger.warning(f"⚠️ Conversation {conversation_id} not found, creating SOAP report without conversation link")
            
            soap_report = SOAPReport.objects.create(
                case_id=soap_case_id,
                pet=pet,
                chat_conversation=conversation,  # Link to conversation if provided
                subjective=subjective_text,
                objective=objective_data,
                assessment=assessment_soap,
                plan=plan_data,
                flag_level=flag_level
            )
            logger.info(f"✅ Created SOAP report for case {soap_case_id}" + (f" linked to conversation {conversation_id}" if conversation else ""))
        except Exception as soap_error:
            logger.error(f"❌ Failed to create SOAP report: {soap_error}")
            logger.error(f"SOAP error type: {type(soap_error).__name__}")
            import traceback
            logger.error(f"SOAP error traceback: {traceback.format_exc()}")
            logger.error(f"SOAP data: subjective={subjective_text[:100]}, objective={objective_data}, assessment={assessment_soap}, plan={plan_data}, flag={flag_level}")
            # Don't fail the entire request if SOAP creation fails
            soap_report = None
        
        # Create diagnosis suggestions
        suggestions = []
        for pred in predictions:
            suggestion = DiagnosisSuggestion.objects.create(
                ai_diagnosis=ai_diagnosis,
                condition_name=pred.get('disease', pred.get('label', 'Unknown')),
                likelihood_percentage=pred.get('confidence', 0) * 100,
                description=pred.get('recommendation', f"AI-suggested condition based on symptoms"),
                matched_symptoms=pred.get('matching_symptoms', [symptoms_text]),
                urgency_level=pred.get('urgency', urgency_level),
                contagious=pred.get('contagious', False),
                confidence_score=pred.get('confidence', 0)
            )
            suggestions.append({
                'id': suggestion.id,
                'condition_name': suggestion.condition_name,
                'likelihood_percentage': suggestion.likelihood_percentage,
                'description': suggestion.description,
                'matched_symptoms': suggestion.matched_symptoms,
                'urgency_level': suggestion.urgency_level,
                'contagious': suggestion.contagious,
                'confidence_score': suggestion.confidence_score,
                'red_flags': pred.get('red_flags', []),
                'timeline': pred.get('timeline', '')
            })
        
        # Generate structured report
        report = {
            'case_id': ai_diagnosis.case_id,
            'generated_at': ai_diagnosis.generated_at.isoformat(),
            'pet_owner_info': {
                'name': user_obj.username,
                'email': user_obj.email,
            },
            'pet_info': {
                'name': pet.name,
                'species': pet.animal_type,
                'breed': pet.breed or 'Mixed Breed',
                'age': pet.age,
                'sex': pet.sex,
                'weight': float(pet.weight) if pet.weight else None,
            },
            'medical_info': {
                'blood_type': 'Unknown',
                'spayed_neutered': 'Unknown',
                'allergies': 'None',
                'chronic_diseases': 'None',
            },
            'symptom_summary': symptoms_text or assessment_data.get('symptoms_text', ''),
            'ai_suggested_diagnoses': suggestions,
            'overall_severity': ai_diagnosis.overall_severity,
            'urgency_level': ai_diagnosis.urgency_level,
            'confidence_score': ai_diagnosis.confidence_score,
            'ai_explanation': ai_diagnosis.ai_explanation,
            'soap_report': soap_data,
            'triage_assessment': triage_assessment
        }
        
        # Return the SOAP report case_id (with # prefix) if it was created, otherwise use AIDiagnosis case_id
        response_case_id = soap_case_id if soap_report else ai_diagnosis.case_id
        
        return Response({
            'success': True,
            'diagnosis_id': ai_diagnosis.id,
            'case_id': response_case_id,  # Use SOAP case_id format for consistency
            'ai_diagnosis_case_id': ai_diagnosis.case_id,  # Also include original for reference
            'soap_report_created': soap_report is not None,
            'report': report
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.exception(f'Error creating AI diagnosis: {e}')
        return Response({
            'success': False,
            'error': f'Failed to create AI diagnosis: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_symptom_image(request):
    """Upload and analyze pet symptom images"""
    try:
        if 'image' not in request.FILES:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['image']
        
        # Validate image file
        if not image_file.content_type.startswith('image/'):
            return Response({'error': 'File must be an image'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save image temporarily
        from django.core.files.storage import default_storage
        file_path = default_storage.save(f'symptom_images/{image_file.name}', image_file)
        full_path = default_storage.path(file_path)
        
        # Analyze image using advanced classifier
        try:
            from ml.advanced_image_classifier import AdvancedPetSymptomImageClassifier
            
            # Try EfficientNet-B0 first (more accurate)
            model_dir = getattr(settings, 'ML_MODELS_DIR', str(os.path.join(os.path.dirname(__file__), '..', 'ml', 'models')))
            efficientnet_path = os.path.join(model_dir, 'efficientnet_image_classifier.joblib')
            mobilenet_path = os.path.join(model_dir, 'mobilenet_image_classifier.joblib')
            
            classifier = None
            
            if os.path.exists(efficientnet_path):
                classifier = AdvancedPetSymptomImageClassifier(model_type='efficientnet')
                classifier.load_model(efficientnet_path)
                print("Using EfficientNet-B0 for image analysis")
            elif os.path.exists(mobilenet_path):
                classifier = AdvancedPetSymptomImageClassifier(model_type='mobilenet')
                classifier.load_model(mobilenet_path)
                print("Using MobileNetV3 for image analysis")
            else:
                # Fallback to basic classifier
                from ml.image_classifier import PetSymptomImageClassifier
                classifier = PetSymptomImageClassifier()
                print("Using basic classifier for image analysis")
            
            analysis = classifier.predict(full_path)
            
        except Exception as e:
            print(f"Advanced image analysis error: {e}")
            # Fallback analysis
            analysis = {
                'skin_irritation': 0.3,
                'eye_problem': 0.2,
                'ear_infection': 0.1,
                'dental_issue': 0.1,
                'normal': 0.3
            }
        
        # Clean up temporary file
        try:
            default_storage.delete(file_path)
        except:
            pass
        
        return Response({
            'image_analysis': analysis,
            'message': 'Image analyzed successfully'
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def get_user_pets(request):
    """Get all pets for the current user"""
    from utils.unified_permissions import check_user_or_admin
    
    print(f"[GET_USER_PETS] Received request")
    print(f"[GET_USER_PETS] Authorization header: {request.META.get('HTTP_AUTHORIZATION', '')[:50]}...")
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        print(f"[GET_USER_PETS] Authentication failed: {error_response.data if hasattr(error_response, 'data') else 'Unknown error'}")
        return error_response
    
    print(f"[GET_USER_PETS] Authentication successful, user_type: {user_type}, user: {user_obj.email if user_obj else 'None'}")
    
    # Only pet owners can access their own pets
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        logger.info(f"get_user_pets called by user: {user_obj.email}")
        
        # Check if Pet model is imported
        logger.info("Fetching pets from database...")
        pets = Pet.objects.filter(owner=user_obj)
        logger.info(f"Found {pets.count()} pets")
        
        pets_data = []
        
        for pet in pets:
            logger.info(f"Processing pet: {pet.name}")
            pet_data = {
                'id': pet.id,
                'name': pet.name,
                'species': pet.get_animal_type_display() if hasattr(pet, 'get_animal_type_display') else getattr(pet, 'animal_type', 'Unknown').capitalize(),
                'breed': getattr(pet, 'breed', 'Unknown'),
                'age': getattr(pet, 'age', 0),
                'photo': pet.image.url if hasattr(pet, 'image') and pet.image else None,
            }
            
            # Add medical info carefully
            try:
                pet_data['medical_info'] = {
                    'allergies': getattr(pet, 'allergies', ''),
                    'chronic_diseases': getattr(pet, 'chronic_diseases', ''),
                    'blood_type': getattr(pet, 'blood_type', ''),
                    'spayed_neutered': getattr(pet, 'spayed_neutered', False),
                }
            except Exception as e:
                logger.error(f"Error getting medical info for pet {pet.name}: {e}")
                pet_data['medical_info'] = {}
            
            pets_data.append(pet_data)
        
        logger.info(f"Successfully processed {len(pets_data)} pets")
        
        return Response({
            'success': True,
            'pets': pets_data,
            'count': len(pets_data)
        })
        
    except Exception as e:
        logger.error(f"Error in get_user_pets: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def start_conversation_with_pet(request):
    """Start a new conversation with a selected pet (or general chat if no pet)"""
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can start conversations
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can start conversations'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        pet_id = request.data.get('pet_id')
        conversation_type = request.data.get('type', 'general')  # Get conversation type from request
        pet = None
        
        # === FIX: Logic updated to handle optional pet_id ===
        if pet_id:
            # Check if pet exists and belongs to user
            try:
                pet = Pet.objects.get(id=pet_id, owner=user_obj)
            except Pet.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Pet not found or not owned by user'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # === FIX: Set title based on conversation type to enable proper mode detection ===
        if conversation_type == 'symptom_checker':
            title_prefix = "Symptom Check"
        else:
            title_prefix = "Pet Care"
        
        # Create a new conversation (pet can be None now)
        conversation = Conversation.objects.create(
            user=user_obj,
            pet=pet,
            title=f"{title_prefix}: {pet.name}" if pet else f"{title_prefix}: New Pet"
        )
        
        # Customize welcome message based on whether a pet is selected
        if pet:
            pet_species = getattr(pet, 'species', getattr(pet, 'animal_type', 'pet'))
            if conversation_type == 'symptom_checker':
                welcome_message = f"Hello! I'm here to help you with {pet.name}. What would you like to know about your {pet_species}?"
            else:
                welcome_message = f"Hello! I'm here to help you learn what's normal for {pet.name}. What would you like to know about your {pet_species}?"
        else:
            welcome_message = "Hello! I'm here to help. Since we don't have a specific pet profile selected, I can provide general advice. What's on your mind?"
        
        Message.objects.create(
            conversation=conversation,
            content=welcome_message,
            is_user=False  # This is an AI message
        )
        
        # Construct pet context only if pet exists
        pet_context = None
        if pet:
            pet_context = {
                'id': pet.id,
                'name': pet.name,
                'species': getattr(pet, 'species', getattr(pet, 'animal_type', 'Unknown')),
                'breed': getattr(pet, 'breed', 'Unknown'),
                'age': getattr(pet, 'age', 0)
            }
        else:
            # Optional: Provide a dummy context if your frontend REQUIRES one for Symptom Checker
            # Remove this else block if your frontend handles null pet_context gracefully
            pet_context = {
                'id': 0, 
                'name': 'Your Pet', 
                'species': 'Pet', 
                'breed': 'Unknown', 
                'age': 0
            }

        return Response({
            'success': True,
            'conversation_id': conversation.id,
            'pet_context': pet_context,
            'initial_message': welcome_message,
            'message': 'Conversation started successfully'
        })
        
    except Exception as e:
        print(f"Error in start_conversation_with_pet: {str(e)}")  # Debug print
        return Response({
            'success': False,
            'error': f'Failed to start conversation: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_symptom_with_image(request):
    """Analyze symptoms with optional image upload"""
    try:
        conversation_id = request.data.get('conversation_id')
        pet_id = request.data.get('pet_id')
        symptoms_text = request.data.get('symptoms')
        uploaded_image = request.FILES.get('image')
        
        if not conversation_id:
            return Response({
                'success': False,
                'error': 'Conversation ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
        pet = get_object_or_404(Pet, id=pet_id, owner=request.user) if pet_id else None
        
        # Save user message
        Message.objects.create(
            conversation=conversation,
            content=symptoms_text,
            is_user=True
        )
        
        # Analyze image if provided
        image_analysis = {}
        if uploaded_image:
            try:
                # Use your trained image classifier
                from ml.imageClassifier import analyze_pet_image
                
                # Save uploaded image temporarily
                import tempfile
                import os
                
                with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                    for chunk in uploaded_image.chunks():
                        temp_file.write(chunk)
                    temp_file_path = temp_file.name
                
                # Analyze the image with your trained models
                pet_species = getattr(pet, 'animal_type', 'dog') if pet else 'dog'
                classification_result = analyze_pet_image(temp_file_path, pet_species)
                
                # Clean up temp file
                os.unlink(temp_file_path)
                
                # Use the analysis results
                if classification_result and classification_result.get('analysis_successful'):
                    image_analysis = {
                        'analysis_successful': True,
                        'model_used': classification_result.get('model_used'),
                        'detected_condition': classification_result.get('detected_condition'),
                        'confidence_score': classification_result.get('confidence_score'),
                        'top_predictions': classification_result.get('top_predictions'),
                        'urgency_level': classification_result.get('urgency_level'),
                        'recommendations': classification_result.get('recommendations')
                    }
                else:
                    image_analysis = {
                        'analysis_successful': False,
                        'error': 'Could not analyze image with trained models'
                    }
                
            except Exception as e:
                print(f"Image analysis error: {e}")
                image_analysis = {
                    'analysis_successful': False,
                    'error': f'Image analysis failed: {str(e)}'
                }
        
        # Build comprehensive prompt for Gemini with detailed image analysis
        prompt_parts = [
            f"Pet Information: {pet.name} ({getattr(pet, 'animal_type', 'pet')})" if pet else "Pet information not available",
            f"Symptoms described by owner: {symptoms_text}",
        ]
        
        if image_analysis.get('analysis_successful'):
            prompt_parts.append("🔬 COMPUTER VISION ANALYSIS RESULTS:")
            prompt_parts.append(f"Model used: {image_analysis.get('model_used')}")
            prompt_parts.append(f"Primary condition detected: {image_analysis.get('detected_condition')}")
            prompt_parts.append(f"Confidence score: {image_analysis.get('confidence_score'):.1%}")
            prompt_parts.append(f"Urgency level: {image_analysis.get('urgency_level')}")
            
            if image_analysis.get('top_predictions'):
                prompt_parts.append("Top predictions:")
                for pred in image_analysis['top_predictions']:
                    prompt_parts.append(f"  • {pred['condition']}: {pred['percentage']}%")
            
            if image_analysis.get('recommendations'):
                prompt_parts.append("AI recommendations:")
                for rec in image_analysis['recommendations']:
                    prompt_parts.append(f"  • {rec}")
            
        elif uploaded_image:
            prompt_parts.append("📷 Image was uploaded but computer vision analysis failed.")
            prompt_parts.append("Please provide detailed description of what you observe in the image.")
        
        full_prompt = "\n".join(prompt_parts)
        
        # Get pet context
        pet_context = None
        if pet:
            pet_context = {
                'name': pet.name,
                'species': getattr(pet, 'animal_type', 'Unknown'),
                'breed': getattr(pet, 'breed', 'Unknown'),
                'age': getattr(pet, 'age', 'Unknown'),
                'sex': getattr(pet, 'sex', 'Unknown'),
                'weight': getattr(pet, 'weight', 'Unknown'),
                'medical_notes': getattr(pet, 'medical_notes', ''),
                'allergies': getattr(pet, 'allergies', ''),
                'chronic_diseases': getattr(pet, 'chronic_diseases', ''),
            }
        
        # Get AI response using symptom checker mode with image analysis
        ai_response = get_gemini_response_with_pet_context(
            full_prompt,
            conversation.messages.all().order_by('created_at'),
            'symptom_checker',
            pet_context
        )
        
        # Save AI response
        Message.objects.create(
            conversation=conversation,
            content=ai_response,
            is_user=False
        )
        
        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save()
        
        return Response({
            'success': True,
            'ai_response': ai_response,
            'image_analysis': image_analysis,
            'conversation_id': conversation.id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in analyze_symptom_with_image: {e}")
        return Response({
            'success': False,
            'error': f'Failed to analyze symptoms: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_ai_response_with_context(symptoms, pet, image_analysis, ml_predictions):
    """Generate AI response with full context"""
    # This would integrate with your existing OpenAI/Gemini AI
    context_parts = []
    
    if pet:
        context_parts.append(f"Pet: {pet.name}, {pet.species}, {pet.breed}, {pet.age} years old")
        if pet.allergies:
            context_parts.append(f"Known allergies: {pet.allergies}")
        if pet.chronic_diseases:
            context_parts.append(f"Chronic conditions: {pet.chronic_diseases}")
    
    if image_analysis.get('analysis_successful'):
        context_parts.append(f"Image analysis detected: {image_analysis.get('detected_category')}")
    
    context_parts.append(f"ML predictions: {ml_predictions}")
    
    full_context = "Context: " + "; ".join(context_parts)
    
    # Your existing AI integration code here
    # Return the AI response
    return f"Based on the symptoms and context provided... [AI response here]"

def get_pet_context_dict(pet):
    """Convert pet object to context dictionary"""
    return {
        'name': pet.name,
        'species': pet.species,
        'breed': pet.breed,
        'age': pet.age,
        'medical_history': list(pet.medical_records.values()),
        'allergies': pet.allergies,
        'chronic_diseases': pet.chronic_diseases
    }

@api_view(['GET'])
@authentication_classes([])  # Allow testing without auth for easier debugging
@permission_classes([AllowAny])
def test_gemini_api_key(request):
    """Test if Gemini API key is working - Public endpoint for debugging"""
    try:
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        
        # Detailed diagnostics
        diagnostics = {
            'api_key_present': api_key is not None,
            'api_key_length': len(api_key) if api_key else 0,
            'api_key_starts_with': api_key[:10] if api_key and len(api_key) >= 10 else 'N/A',
            'api_key_has_whitespace': api_key != api_key.strip() if api_key else False,
        }
        
        if not api_key:
            return Response({
                'success': False,
                'api_key_valid': False,
                'error': 'GEMINI_API_KEY not found in settings',
                'diagnostics': diagnostics,
                'solution': 'Add GEMINI_API_KEY=your-key-here to your .env file in the project root',
                'steps': [
                    '1. Open your .env file (should be in the same folder as manage.py)',
                    '2. Add this line: GEMINI_API_KEY=your-actual-api-key',
                    '3. Make sure there are no quotes around the key',
                    '4. Restart your Django server',
                    '5. Get a new key from https://aistudio.google.com/app/apikey if needed'
                ]
            }, status=400)
        
        # Strip whitespace
        api_key_clean = api_key.strip()
        if not api_key_clean:
            return Response({
                'success': False,
                'api_key_valid': False,
                'error': 'GEMINI_API_KEY is empty (only whitespace)',
                'diagnostics': diagnostics,
                'solution': 'Check your .env file - the key value is empty'
            }, status=400)
        
        # Test API key
        try:
            genai.configure(api_key=api_key_clean)
            
            # Try to list models
            models = list(genai.list_models())
            model_names = [m.name for m in models]
            
            # Try a simple generation test
            test_model = genai.GenerativeModel('models/gemini-1.5-flash')
            test_response = test_model.generate_content("Say 'Hello' if you can read this.")
            
            return Response({
                'success': True,
                'api_key_valid': True,
                'api_key_preview': f"{api_key_clean[:8]}...{api_key_clean[-4:]}",
                'available_models': model_names[:5],  # First 5 models
                'total_models': len(models),
                'test_generation': test_response.text if hasattr(test_response, 'text') else 'Failed',
                'diagnostics': diagnostics
            })
            
        except Exception as api_error:
            error_str = str(api_error)
            error_lower = error_str.lower()
            
            # Determine the specific issue
            if '403' in error_str or 'permission' in error_lower or 'forbidden' in error_lower:
                issue = 'API key is invalid or has been revoked'
                solutions = [
                    'Get a new API key from https://aistudio.google.com/app/apikey',
                    'Make sure you copied the entire key (no spaces, no quotes)',
                    'Check if the key has expired or been revoked in Google AI Studio'
                ]
            elif 'quota' in error_lower or '429' in error_str:
                issue = 'API quota exceeded'
                solutions = [
                    'Wait a few minutes and try again',
                    'Check your Google Cloud billing account',
                    'Upgrade your API plan if needed'
                ]
            elif 'invalid' in error_lower:
                issue = 'API key format is invalid'
                solutions = [
                    'Verify the key in your .env file has no extra spaces or quotes',
                    'Get a fresh key from https://aistudio.google.com/app/apikey',
                    'Make sure the key starts with "AI" (for Gemini API keys)'
                ]
            else:
                issue = 'Unknown API error'
                solutions = [
                    'Check the error message below',
                    'Verify your internet connection',
                    'Try again in a few minutes'
                ]
            
            return Response({
                'success': False,
                'api_key_valid': False,
                'error': error_str,
                'issue': issue,
                'api_key_preview': f"{api_key_clean[:8]}...{api_key_clean[-4:]}",
                'diagnostics': diagnostics,
                'solutions': solutions,
                'help_url': 'https://aistudio.google.com/app/apikey'
            }, status=400)
            
    except Exception as e:
        logger.exception(f"Error in test_gemini_api_key: {e}")
        return Response({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        }, status=500)


# ===== SOAP generation and retrieval (spec) =====
def _calculate_flag_level(assessment: list, matched_symptoms_all: list | None = None, symptom_duration_days: int | None = None) -> str:
    if not assessment:
        return 'Moderate'
    top = max(assessment, key=lambda x: x.get('likelihood', 0))
    likelihood = top.get('likelihood', 0)
    urgency = str(top.get('urgency', '')).lower()
    matched = (matched_symptoms_all or []) + list(top.get('matched_symptoms', []))
    matched_lc = [str(s).lower() for s in matched]
    if likelihood >= 0.90 and urgency == 'severe':
        return 'Emergency'
    if 'seizure' in matched_lc or 'difficulty breathing' in matched_lc:
        return 'Emergency'
    if likelihood >= 0.75 and urgency in ['moderate', 'severe']:
        return 'Urgent'
    if symptom_duration_days and symptom_duration_days > 3 and likelihood >= 0.60:
        return 'Urgent'
    if likelihood >= 0.60:
        return 'Moderate'
    return 'Moderate'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_soap_report(request):
    try:
        pet_id = request.data.get('pet_id')
        conversation_id = request.data.get('conversation_id')
        symptoms = request.data.get('symptoms', [])
        duration = request.data.get('duration', '')
        subjective_text = request.data.get('subjective', '')

        if not pet_id or not isinstance(symptoms, list) or len(symptoms) < 1:
            return Response({'success': False, 'error': 'pet_id and symptoms array are required'}, status=400)

        pet = Pet.objects.get(id=pet_id, owner=request.user)
        convo = None
        if conversation_id:
            try:
                convo = Conversation.objects.get(id=conversation_id, user=request.user)
            except Conversation.DoesNotExist:
                convo = None

        # Call ML predict (assume existing predict endpoint logic)
        ml_resp = predict_symptoms(request)
        if ml_resp.status_code != 200:
            return ml_resp
        ml = ml_resp.data

        # Build assessment entries
        assessment = []
        for pred in ml.get('predictions', [])[:3]:
            assessment.append({
                'condition': pred.get('label'),
                'likelihood': float(pred.get('confidence', 0.0)),
                'description': 'AI-predicted condition based on reported symptoms.',
                'matched_symptoms': symptoms,
                'urgency': ml.get('urgency', 'routine').title() if ml.get('urgency') else 'Mild',
                'contagious': False,
            })

        # Determine plan severity
        severity_map = {
            'routine': 'Moderate',
            'soon': 'Urgent',
            'immediate': 'Emergency',
            'emergency': 'Emergency',
        }
        severity_level = severity_map.get(str(ml.get('urgency', 'routine')).lower(), 'Moderate')

        # Set flag level to match severity level
        flag_level = severity_level

        case_id = f"#PDX-{timezone.now().strftime('%Y-%m%d')}-{str(uuid.uuid4())[:12].upper()}"
        report = SOAPReport.objects.create(
            case_id=case_id,
            pet=pet,
            chat_conversation=convo,
            subjective=subjective_text,
            objective={'symptoms': symptoms, 'duration': duration},
            assessment=assessment,
            plan={
                'severityLevel': severity_level,
                'careAdvice': [
                    'Monitor your pet closely and provide comfort.',
                    'Ensure access to fresh water and rest.',
                    'Seek veterinary care based on severity.',
                ],
            },
            flag_level=flag_level,
        )

        return Response({'success': True, 'case_id': report.case_id}, status=201)
    except Pet.DoesNotExist:
        return Response({'success': False, 'error': 'Pet not found'}, status=404)
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)
#isk

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_soap_report(request, case_id: str):
    try:
        # 1. Get the Report
        report = SOAPReport.objects.get(case_id=case_id)
        if report.pet.owner != request.user:
            return Response({'success': False, 'error': 'Forbidden'}, status=403)
        
        # --- DEBUG PRINTS (Check your terminal after running this!) ---
        print(f"=== DEBUGGING CASE: {case_id} ===")
        print(f"Plan Raw Type: {type(report.plan)}")
        
        # 2. Handle Plan (String vs Dict)
        plan_data = report.plan
        if isinstance(plan_data, str):
            try:
                plan_data = json.loads(plan_data)
                print("DEBUG: Converted plan string to dict")
            except:
                plan_data = {}
                print("DEBUG: Failed to parse plan string")
        
        # 3. Extract Clinical Summary (Priority 1: Plan JSON)
        clinical_summary = ""
        if isinstance(plan_data, dict):
            # Try every possible key naming convention
            clinical_summary = plan_data.get('clinical_summary_backup') or \
                               plan_data.get('clinical_summary') or \
                               plan_data.get('summary') or \
                               plan_data.get('clinicalSummary')
            
            print(f"DEBUG: Summary found in Plan JSON? {'Yes' if clinical_summary else 'No'}")

        # 4. Fallback: Fetch directly from AIDiagnosis Table (Priority 2)
        # We do this manually to ensure we don't rely on potentially broken Foreign Keys
        if not clinical_summary:
            try:
                print("DEBUG: Attempting to fetch from AIDiagnosis table...")
                ai_diag = AIDiagnosis.objects.get(case_id=case_id)
                clinical_summary = ai_diag.ai_explanation
                print(f"DEBUG: Found in AIDiagnosis: {clinical_summary[:50]}...")
            except AIDiagnosis.DoesNotExist:
                print("DEBUG: No AIDiagnosis record found for this Case ID.")

        # 5. Build Response
        data = {
            'caseId': report.case_id,
            'petId': str(report.pet.id),
            'ownerId': str(report.pet.owner.id),
            'petName': report.pet.name,
            'ownerName': report.pet.owner.username,
            'dateGenerated': report.date_generated.isoformat(),
            'objective': report.objective,
            'subjective': report.subjective,
            'assessment': report.assessment,
            'plan': plan_data, # Use the parsed plan_data
            'flagLevel': report.flag_level,
            
            # THE KEY FIELD
            'clinical_summary': clinical_summary or "No summary available.", 
            
            'ai_explanation': plan_data.get('aiExplanation', '') if isinstance(plan_data, dict) else ''
        }
        
        print(f"=== SENDING CLINICAL SUMMARY: {len(str(clinical_summary))} chars ===")
        
        return Response({
            'success': True, 
            'soap_report': data,
            'data': data
        })

    except SOAPReport.DoesNotExist:
        return Response({'success': False, 'error': 'Not found'}, status=404)


@api_view(['GET'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def get_pet_diagnoses(request, pet_id: int):
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can view pet diagnoses
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can view pet diagnoses'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        pet = Pet.objects.get(id=pet_id, owner=user_obj)
        reports = pet.soap_reports.all().order_by('-date_generated')
        results = [
            {
                'caseId': r.case_id,
                'dateGenerated': r.date_generated.isoformat(),
                'flagLevel': r.flag_level,
                'topCondition': (r.assessment[0]['condition'] if r.assessment else None),
                'likelihood': (r.assessment[0]['likelihood'] if r.assessment else None),
            }
            for r in reports
        ]
        return Response({'success': True, 'data': results})
    except Pet.DoesNotExist:
        return Response({'success': False, 'error': 'Pet not found'}, status=404)


@api_view(['GET'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def get_flagged_cases_for_pet(request, pet_id: int):
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication (supports both user types)
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can view flagged cases
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can view flagged cases'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        pet = Pet.objects.get(id=pet_id, owner=user_obj)
        reports = pet.soap_reports.filter(flag_level__in=['Urgent', 'Emergency']).order_by('-date_flagged')
        results = [
            {
                'caseId': r.case_id,
                'dateFlagged': r.date_flagged.isoformat(),
                'flagLevel': r.flag_level,
            }
            for r in reports
        ]
        return Response({'success': True, 'data': results})
    except Pet.DoesNotExist:
        return Response({'success': False, 'error': 'Pet not found'}, status=404)
