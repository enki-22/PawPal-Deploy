from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
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

# Configure Gemini
def get_gemini_client():
    """Configure and return Gemini model"""
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel('gemini-1.5-flash')  # Using working model name

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
@permission_classes([IsAuthenticated])
def chat(request):
    """API endpoint for chatbot (React frontend)"""
    try:
        user_message = request.data.get('message')
        conversation_id = request.data.get('conversation_id')
        chat_mode = request.data.get('chat_mode', 'general')  # Add this line
        
        if not user_message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Received message: {user_message} (Mode: {chat_mode})")
        
        # Get or create conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, user=request.user)
            except Conversation.DoesNotExist:
                conversation = Conversation.objects.create(user=request.user, title="New Conversation")
        else:
            conversation = Conversation.objects.create(user=request.user, title="New Conversation")
        
        # Save user message
        user_msg = Message.objects.create(
            conversation=conversation,
            content=user_message,
            is_user=True
        )
        
        # Get conversation history for context
        conversation_history = conversation.messages.all().order_by('created_at')
        
        # Generate AI response using Gemini with mode
        ai_response = get_openai_response(user_message, conversation_history, chat_mode)  # Add chat_mode
        print(f"AI response: {ai_response}")
        
        # Save AI response
        ai_msg = Message.objects.create(
            conversation=conversation,
            content=ai_response,
            is_user=False
        )
        
        # Generate title if this is the first exchange
        if conversation.messages.count() == 2:
            mode_prefix = "Symptom Check: " if chat_mode == 'symptom_checker' else "Pet Care: "
            title = generate_conversation_title(user_message, ai_response)
            conversation.title = mode_prefix + title
            conversation.save()
        
        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save()
        
        return Response({
            'response': ai_response,
            'conversation_id': conversation.id,
            'conversation_title': conversation.title,
            'message_id': ai_msg.id,
            'chat_mode': chat_mode
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Chat API error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversations(request):
    """Get user's conversation list"""
    try:
        conversations = Conversation.objects.filter(user=request.user)
        
        conversation_data = []
        for conv in conversations:
            last_message = conv.messages.last()
            conversation_data.append({
                'id': conv.id,
                'title': conv.title,
                'created_at': conv.created_at.isoformat(),
                'updated_at': conv.updated_at.isoformat(),
                'is_pinned': conv.is_pinned,
                'message_count': conv.messages.count(),
                'last_message': last_message.content[:50] + "..." if last_message else "",
                'last_message_time': last_message.created_at.isoformat() if last_message else conv.created_at.isoformat()
            })
        
        return Response({
            'conversations': conversation_data,
            'total': len(conversation_data)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation_messages(request, conversation_id):
    """Get messages for a specific conversation"""
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=request.user)
        messages = conversation.messages.all()
        
        message_data = []
        for msg in messages:
            message_data.append({
                'id': msg.id,
                'content': msg.content,
                'isUser': msg.is_user,
                'sender': 'You' if msg.is_user else 'PawPal',
                'timestamp': msg.created_at.isoformat()
            })
        
        return Response({
            'conversation': {
                'id': conversation.id,
                'title': conversation.title,
                'created_at': conversation.created_at.isoformat(),
            },
            'messages': message_data
        })
        
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_new_conversation(request):
    """Create a new conversation"""
    try:
        conversation = Conversation.objects.create(
            user=request.user,
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
@permission_classes([IsAuthenticated])
def toggle_pin_conversation(request, conversation_id):
    """Pin/unpin a conversation"""
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=request.user)
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
@permission_classes([IsAuthenticated])
def get_diagnoses(request):
    """Get paginated diagnoses with filtering"""
    try:
        # Import here to avoid circular imports if Diagnosis model doesn't exist yet
        try:
            from .models import Diagnosis
        except ImportError:
            return Response({'error': 'Diagnosis model not implemented yet'}, status=status.HTTP_501_NOT_IMPLEMENTED)
        
        # Get query parameters
        search = request.GET.get('search', '')
        severity = request.GET.get('severity', '')
        species = request.GET.get('species', '')
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        
        # Build query
        diagnoses = Diagnosis.objects.filter(user=request.user)
        
        if search:
            diagnoses = diagnoses.filter(
                Q(pet_name__icontains=search) |
                Q(case_id__icontains=search) |
                Q(diagnosis__icontains=search) |
                Q(symptoms__icontains=search)
            )
        
        if severity:
            diagnoses = diagnoses.filter(severity=severity)
            
        if species:
            diagnoses = diagnoses.filter(animal_type=species)
        
        # Paginate
        paginator = Paginator(diagnoses, page_size)
        page_obj = paginator.get_page(page)
        
        # Serialize data
        diagnoses_data = []
        for diagnosis in page_obj:
            diagnoses_data.append({
                'id': diagnosis.id,
                'pet_name': diagnosis.pet_name,
                'animal_type': diagnosis.animal_type,
                'breed': diagnosis.breed or 'Mixed Breed',
                'severity': diagnosis.severity,
                'case_id': diagnosis.case_id,
                'created_at': diagnosis.created_at.strftime('%B %d, %Y'),
                'diagnosis': diagnosis.diagnosis,
                'symptoms': diagnosis.symptoms,
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
@permission_classes([IsAuthenticated])
def create_diagnosis(request):
    """Create a new diagnosis from chat conversation"""
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
            user=request.user,
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