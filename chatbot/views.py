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
from datetime import datetime
import os
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from django.conf import settings
from django.shortcuts import render, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pets.models import Pet
from .models import Conversation, Message, AIDiagnosis, SOAPReport, DiagnosisSuggestion
# Note: image_classifier is now lazily loaded via analyze_pet_image when needed
import logging
logger = logging.getLogger(__name__)



# Configure Gemini
def get_gemini_client():
    """Configure and return Gemini model"""
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
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


def get_gemini_response(user_message, conversation_history=None, chat_mode='general'):
    """Generate AI response using Google Gemini with different modes"""
    try:
        model = get_gemini_client()
       
        # Different system prompts based on mode
        if chat_mode == 'symptom_checker':
            system_prompt = """You are PawPal's Symptom Checker, an AI veterinary diagnostic assistant.
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
            system_prompt = """You are PawPal, a friendly AI veterinary assistant focused on general pet health education.
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
       
        # Generate response
        response = model.generate_content(conversation_text)
       
        if response and hasattr(response, 'text') and response.text:
            return response.text.strip()
        else:
            return "I'm having trouble responding right now. Could you please try again?"
       
    except Exception as e:
        print(f"Gemini Error: {type(e).__name__}: {e}")
        return "I'm experiencing technical difficulties. Please try again or consult with a veterinarian for immediate concerns."

def get_gemini_response_with_pet_context(user_message, conversation_history=None, chat_mode='general', pet_context=None):
    """Generate AI response using Google Gemini with pet context"""
    try:
        model = get_gemini_client()
       
        # Different system prompts based on mode
        if chat_mode == 'symptom_checker':
            system_prompt = """You are PawPal's Symptom Checker, an AI veterinary diagnostic assistant.
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
            """
        else:  # general mode
            system_prompt = """You are PawPal, a friendly AI veterinary assistant focused on general pet health education.
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
       
        # Generate response
        response = model.generate_content(conversation_text)
       
        if response and hasattr(response, 'text') and response.text:
            return response.text.strip()
        else:
            return "I'm having trouble responding right now. Could you please try again?"
       
    except Exception as e:
        error_str = str(e)
        print(f"Gemini Error: {type(e).__name__}: {e}")
        
        # Provide more specific error messages
        if "API key" in error_str or "invalid" in error_str.lower() or "revoked" in error_str.lower():
            return "I'm currently unavailable due to API configuration issues. Please contact support or try again later. For immediate pet health concerns, please consult with a veterinarian."
        elif "quota" in error_str.lower():
            return "I'm experiencing high demand right now. Please try again in a few minutes or consult with a veterinarian for immediate concerns."
        else:
            return "I'm experiencing technical difficulties. Please try again or consult with a veterinarian for immediate concerns."
def generate_conversation_title(first_message, ai_response=None):
    """Generate a conversation title using Gemini"""
    try:
        model = get_gemini_client()
       
        prompt = f"""Based on this pet health conversation, generate a short, descriptive title (max 6 words):


User: {first_message}
{f"AI: {ai_response}" if ai_response else ""}


Generate a clear, concise title that describes the main topic. Examples:
- "Cat Eating Issues"
- "Dog Vaccination Questions"
- "Pet Skin Problems"
- "Puppy Training Help"


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
            pet_context
        )
        print(f"AI response: {ai_response}")
        
        # Automatically create SOAP report for symptom checker mode if pet is linked
        soap_report = None
        ai_diagnosis = None
        case_id = None
        print(f"[SOAP_CHECK] chat_mode={chat_mode}, has_pet={hasattr(conversation, 'pet') and conversation.pet is not None}")
        if chat_mode == 'symptom_checker' and hasattr(conversation, 'pet') and conversation.pet:
            try:
                pet = conversation.pet
                print(f"[SOAP_CREATION] Starting SOAP report creation for pet {pet.name} (ID: {pet.id})")
                
                # Extract symptoms from user message (use the message as symptoms text)
                symptoms_text = user_message
                
                # Create a new request for predict_symptoms
                # Since predict_symptoms is a DRF view, we need to create a Django HttpRequest
                # The @api_view decorator will wrap it in a DRF Request
                from django.test import RequestFactory
                import json
                
                factory = RequestFactory()
                predict_data = {
                    'symptoms': symptoms_text,
                    'species': getattr(pet, 'animal_type', 'dog').lower(),
                    'pet_id': pet.id
                }
                # Create request with JSON body
                json_body = json.dumps(predict_data)
                
                # Generate JWT token for the user so predict_symptoms can authenticate
                from users.utils import generate_jwt_token
                user_token = generate_jwt_token(user_obj)
                
                predict_request = factory.post(
                    '/api/chatbot/predict/',
                    data=json_body,
                    content_type='application/json',
                    HTTP_AUTHORIZATION=f'Bearer {user_token}'  # Add Authorization header
                )
                # Ensure the body is set correctly for DRF parsing
                predict_request._body = json_body.encode('utf-8')
                
                # Call predict_symptoms with Django HttpRequest (not DRF Request)
                # The @api_view decorator will handle wrapping it
                ml_response = predict_symptoms(predict_request)
                
                print(f"[SOAP_CREATION] predict_symptoms response status: {ml_response.status_code}")
                if hasattr(ml_response, 'data'):
                    print(f"[SOAP_CREATION] predict_symptoms response data keys: {list(ml_response.data.keys()) if isinstance(ml_response.data, dict) else 'Not a dict'}")
                    if isinstance(ml_response.data, dict) and 'error' in ml_response.data:
                        print(f"[SOAP_CREATION] Error in response: {ml_response.data.get('error')}")
                else:
                    print(f"[SOAP_CREATION] predict_symptoms response: {ml_response}")
                
                # Extract symptoms list (try to parse from message or use as single item)
                symptoms_list = [s.strip() for s in symptoms_text.replace(',', '|').replace(' and ', '|').split('|') if s.strip()]
                if not symptoms_list:
                    symptoms_list = [symptoms_text]
                
                # Try to get ML predictions, but create SOAP report even if ML fails
                ml_data = None
                if ml_response.status_code == 200:
                    ml_data = ml_response.data
                    print(f"[SOAP_CREATION] Successfully got ML predictions, proceeding with SOAP creation...")
                else:
                    print(f"⚠️ predict_symptoms returned non-200 status: {ml_response.status_code}")
                    if hasattr(ml_response, 'data'):
                        print(f"⚠️ Error response: {ml_response.data}")
                    print(f"[SOAP_CREATION] Creating SOAP report without ML predictions (using AI response only)...")
                
                # Build assessment entries
                assessment = []
                if ml_data and ml_data.get('predictions'):
                    # Use ML predictions if available
                    for pred in ml_data.get('predictions', [])[:3]:
                        assessment.append({
                            'condition': pred.get('label', 'Unknown'),
                            'likelihood': float(pred.get('confidence', 0.0)),
                            'description': 'AI-predicted condition based on reported symptoms.',
                            'matched_symptoms': symptoms_list,
                            'urgency': ml_data.get('urgency', 'routine').title() if ml_data.get('urgency') else 'Mild',
                            'contagious': False,
                        })
                else:
                    # Fallback: Create basic assessment from symptoms
                    # Analyze symptoms to determine urgency (basic keyword matching)
                    urgent_keywords = ['not moving', 'not eating', 'not responding', 'emergency', 'critical', 'severe', 'lethargy', 'unresponsive']
                    symptom_lower = symptoms_text.lower()
                    is_urgent = any(keyword in symptom_lower for keyword in urgent_keywords)
                    
                    assessment.append({
                        'condition': 'Symptom Assessment Required',
                        'likelihood': 0.7,
                        'description': 'AI assessment based on reported symptoms. Veterinary examination recommended for accurate diagnosis.',
                        'matched_symptoms': symptoms_list,
                        'urgency': 'Immediate' if is_urgent else 'Soon',
                        'contagious': False,
                    })
                
                # Determine plan severity based on assessment urgency
                severity_map = {
                    'routine': 'Moderate',
                    'soon': 'Urgent',
                    'immediate': 'Emergency',
                    'emergency': 'Emergency',
                }
                
                if ml_data:
                    # Use ML urgency if available
                    ml_urgency = str(ml_data.get('urgency', 'routine')).lower()
                    severity_level = severity_map.get(ml_urgency, 'Moderate')
                else:
                    # For symptom checker mode without ML, default to Urgent
                    # This ensures consistent flag level matching
                    severity_level = 'Urgent'
                
                # Ensure flag level matches severity level exactly
                flag_level = severity_level
                
                # Debug logging
                print(f"[FLAG_LEVEL] Severity Level: {severity_level}, Flag Level: {flag_level}")
                if ml_data:
                    print(f"[FLAG_LEVEL] ML Urgency: {ml_data.get('urgency')}")
                else:
                    print(f"[FLAG_LEVEL] No ML data - using default Urgent for symptom checker mode")
                
                # Generate case ID
                case_id = f"#PDX-{timezone.now().strftime('%Y-%m%d')}-{str(uuid.uuid4())[:3].upper()}"
                
                # Create SOAP Report
                soap_report = SOAPReport.objects.create(
                    case_id=case_id,
                    pet=pet,
                    chat_conversation=conversation,
                    subjective=f"Owner reports: {symptoms_text}",
                    objective={
                        'symptoms': symptoms_list,
                        'duration': '',  # Could extract from message if available
                        'image_analysis': ml_data.get('image_analysis') if ml_data else None,
                        'ml_confidence': ml_data.get('confidence_score', 0.0) if ml_data else 0.0
                    },
                    assessment=assessment,
                    plan={
                        'severityLevel': severity_level,
                        'careAdvice': [
                            'Monitor your pet closely and provide comfort.',
                            'Ensure access to fresh water and rest.',
                            'Seek veterinary care based on severity.',
                        ],
                        'aiExplanation': ml_data.get('ai_explanation', ai_response) if ml_data else ai_response,
                        'recommendedActions': []
                    },
                    flag_level=flag_level,
                )
                
                # Create AIDiagnosis record
                ai_diagnosis = AIDiagnosis.objects.create(
                    user=user_obj,
                    pet=pet,
                    case_id=case_id,
                    symptoms_text=symptoms_text,
                    image_analysis=ml_data.get('image_analysis') if ml_data else None,
                    ml_predictions=ml_data.get('predictions', []) if ml_data else [],
                    ai_explanation=ml_data.get('ai_explanation', ai_response) if ml_data else ai_response,
                    suggested_diagnoses=assessment,
                    overall_severity=ml_data.get('severity', 'moderate') if ml_data else 'moderate',
                    urgency_level=ml_data.get('urgency', 'routine') if ml_data else 'soon',
                    pet_context=pet_context or {},
                    confidence_score=ml_data.get('confidence_score', 0.0) if ml_data else 0.0
                )
                
                print(f"✅ Created SOAP report {case_id} and AI Diagnosis for conversation {conversation.id}")
                print(f"✅ SOAP Report ID: {soap_report.id}, AI Diagnosis ID: {ai_diagnosis.id}")
                if not ml_data:
                    print(f"⚠️ Note: SOAP report created without ML predictions due to ML model error")
                    
            except Exception as e:
                print(f"⚠️ Error creating SOAP report: {str(e)}")
                print(f"⚠️ Error type: {type(e).__name__}")
                # Don't fail the chat if SOAP creation fails
                import traceback
                traceback.print_exc()
        else:
            if chat_mode != 'symptom_checker':
                print(f"[SOAP_CHECK] Skipping SOAP creation - chat_mode is '{chat_mode}', not 'symptom_checker'")
            elif not hasattr(conversation, 'pet') or not conversation.pet:
                print(f"[SOAP_CHECK] Skipping SOAP creation - conversation {conversation.id} has no pet linked")
        
        # Save AI response
        ai_msg = Message.objects.create(
            conversation=conversation,
            content=ai_response,
            is_user=False
        )
       
        # Generate title if this is the first exchange
        if conversation.messages.count() == 2:
            mode_prefix = "Symptom Check: " if chat_mode == 'symptom_checker' else "Pet Care: "
            if pet_context:
                title = f"{pet_context['name']} - {chat_mode.replace('_', ' ').title()}"
            else:
                title = generate_conversation_title(user_message, ai_response)
            conversation.title = mode_prefix + title
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
        
        # Format response based on user type
        if request.user_type == 'admin':
            # Admin format (similar to admin endpoint)
            diagnosis_case_id = None
            soap_report = conversation.soap_reports.first()
            if soap_report:
                diagnosis_case_id = soap_report.case_id
            
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
            return Response({
                'conversation': {
                    'id': conversation.id,
                    'title': conversation.title,
                    'created_at': conversation.created_at.isoformat(),
                },
                'messages': messages
            }, status=status.HTTP_200_OK)
       
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
       
        # Generate unique case ID
        case_id = f"PDX-{datetime.now().strftime('%Y-%m%d')}-{str(uuid.uuid4())[:3].upper()}"
       
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
            urgency = 'routine'

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


@api_view(['POST'])
@authentication_classes([])  # Disable DRF authentication - our custom function handles it
@permission_classes([AllowAny])  # Allow any - our custom function handles auth
def create_ai_diagnosis(request):
    """Create a comprehensive AI diagnosis report"""
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
        
        if not pet_id or not symptoms_text:
            return Response({'error': 'pet_id and symptoms are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get pet
        try:
            pet = Pet.objects.get(id=pet_id, owner=user_obj)
        except Pet.DoesNotExist:
            return Response({'error': 'Pet not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Temporarily set request.user for predict_symptoms function
        request.user = user_obj
        
        # Get ML predictions
        ml_response = predict_symptoms(request)
        if ml_response.status_code != 200:
            return ml_response
        
        ml_data = ml_response.data
        
        # Create AI Diagnosis record
        ai_diagnosis = AIDiagnosis.objects.create(
            user=user_obj,
            pet=pet,
            symptoms_text=symptoms_text,
            image_analysis=ml_data.get('image_analysis'),
            ml_predictions=ml_data['predictions'],
            ai_explanation=ml_data['ai_explanation'],
            overall_severity=ml_data['severity'],
            urgency_level=ml_data['urgency'],
            pet_context=ml_data['pet_context'],
            confidence_score=ml_data['confidence_score']
        )
        
        # Create diagnosis suggestions
        suggestions = []
        for pred in ml_data['predictions']:
            suggestion = DiagnosisSuggestion.objects.create(
                ai_diagnosis=ai_diagnosis,
                condition_name=pred['label'],
                likelihood_percentage=pred['confidence'] * 100,
                description=f"AI-suggested condition based on symptoms: {symptoms_text}",
                matched_symptoms=[symptoms_text],
                urgency_level=ml_data['urgency'],
                contagious=False,  # This would need to be determined by a knowledge base
                confidence_score=pred['confidence']
            )
            suggestions.append({
                'id': suggestion.id,
                'condition_name': suggestion.condition_name,
                'likelihood_percentage': suggestion.likelihood_percentage,
                'description': suggestion.description,
                'matched_symptoms': suggestion.matched_symptoms,
                'urgency_level': suggestion.urgency_level,
                'contagious': suggestion.contagious,
                'confidence_score': suggestion.confidence_score
            })
        
        # Generate structured report
        report = {
            'case_id': ai_diagnosis.case_id,
            'generated_at': ai_diagnosis.generated_at.isoformat(),
            'pet_owner_info': {
                'name': request.user.username,
                'email': request.user.email,
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
                'blood_type': 'Unknown',  # Extract from medical_notes if available
                'spayed_neutered': 'Unknown',
                'allergies': 'None',
                'chronic_diseases': 'None',
            },
            'symptom_summary': symptoms_text,
            'ai_suggested_diagnoses': suggestions,
            'overall_severity': ai_diagnosis.overall_severity,
            'urgency_level': ai_diagnosis.urgency_level,
            'confidence_score': ai_diagnosis.confidence_score,
            'ai_explanation': ai_diagnosis.ai_explanation
        }
        
        return Response({
            'diagnosis_id': ai_diagnosis.id,
            'case_id': ai_diagnosis.case_id,
            'report': report
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    """Start a new conversation with a selected pet"""
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
        
        if not pet_id:
            return Response({
                'success': False,
                'error': 'Pet ID is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if pet exists and belongs to user
        try:
            pet = Pet.objects.get(id=pet_id, owner=user_obj)  # Changed from request.user
        except Pet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pet not found or not owned by user'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Create a new conversation (using your actual model fields)
        conversation = Conversation.objects.create(
            user=user_obj,  # Changed from request.user
            pet=pet,
            title=f"Chat with {pet.name}"
        )
        
        # Create welcome message using your Message model
        welcome_message = f"Hello! I'm here to help you with {pet.name}. What would you like to know about your {getattr(pet, 'species', 'pet')}?"
        
        Message.objects.create(
            conversation=conversation,
            content=welcome_message,
            is_user=False  # This is an AI message
        )
        
        return Response({
            'success': True,
            'conversation_id': conversation.id,
            'pet_context': {
                'id': pet.id,
                'name': pet.name,
                'species': getattr(pet, 'species', getattr(pet, 'animal_type', 'Unknown')),
                'breed': getattr(pet, 'breed', 'Unknown'),
                'age': getattr(pet, 'age', 0)
            },
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
@permission_classes([IsAuthenticated])
def test_gemini_api_key(request):
    """Test if Gemini API key is working"""
    try:
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        
        if not api_key:
            return Response({
                'error': 'GEMINI_API_KEY not found in settings',
                'solution': 'Add GEMINI_API_KEY to your settings.py'
            })
        
        # Test API key
        genai.configure(api_key=api_key)
        
        try:
            # Try to list models
            models = list(genai.list_models())
            model_names = [m.name for m in models]
            
            return Response({
                'success': True,
                'api_key_valid': True,
                'available_models': model_names,
                'total_models': len(models),
                'api_key_preview': f"{api_key[:8]}...{api_key[-4:]}"
            })
            
        except Exception as api_error:
            return Response({
                'success': False,
                'api_key_valid': False,
                'error': str(api_error),
                'api_key_preview': f"{api_key[:8]}...{api_key[-4:]}",
                'solutions': [
                    'Get a new API key from https://aistudio.google.com/app/apikey',
                    'Check if Gemini is available in your region',
                    'Verify billing is enabled'
                ]
            })
            
    except Exception as e:
        return Response({
            'error': str(e)
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

        case_id = f"#PDX-{timezone.now().strftime('%Y-%m%d')}-{str(uuid.uuid4())[:3].upper()}"
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_soap_report(request, case_id: str):
    try:
        report = SOAPReport.objects.get(case_id=case_id)
        # permissions: owner can view own pet reports
        if report.pet.owner != request.user:
            return Response({'success': False, 'error': 'Forbidden'}, status=403)
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
            'plan': report.plan,
            'flagLevel': report.flag_level,
        }
        return Response({'success': True, 'data': data})
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
