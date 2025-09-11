from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Conversation, Message
import json
import google.generativeai as genai
from django.conf import settings

# Configure Gemini
def get_gemini_client():
    """Configure and return Gemini model"""
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel('gemini-pro')

def get_gemini_response(user_message, conversation_history=None):
    """Generate AI response using Google Gemini"""
    try:
        # Get Gemini model
        model = get_gemini_client()
        
        print(f"Using Gemini API key: {settings.GEMINI_API_KEY[:10]}...{settings.GEMINI_API_KEY[-4:]}")
        
        # Build conversation context
        system_prompt = """You are PawPal, a friendly and knowledgeable AI veterinary assistant. 
        You help pet owners with basic pet health questions, provide general guidance, and 
        encourage them to seek professional veterinary care when needed.
        
        Guidelines:
        - Be warm, caring, and professional
        - Provide helpful information about pet health
        - Always recommend seeing a veterinarian for serious concerns
        - Ask follow-up questions to better understand the pet's situation
        - Keep responses concise but informative (under 200 words)
        - Focus on dogs, cats, and common household pets
        - If unsure about something, acknowledge it and recommend professional care
        """
        
        # Build conversation context with history
        conversation_text = system_prompt + "\n\n"
        
        # Add conversation history if provided (last 3 messages for context)
        if conversation_history and conversation_history.exists():
            conversation_text += "Previous conversation:\n"
            history_list = list(conversation_history)
            recent_messages = history_list[-6:] if len(history_list) > 6 else history_list
            
            for msg in recent_messages:
                role = "User" if msg.is_user else "PawPal"
                conversation_text += f"{role}: {msg.content}\n"
        
        # Add current user message
        conversation_text += f"\nUser: {user_message}\nPawPal:"
        
        print(f"Sending request to Gemini...")
        
        # Generate response
        response = model.generate_content(conversation_text)
        ai_response = response.text.strip()
        
        print(f"Gemini Response received: {ai_response[:50]}...")
        return ai_response
        
    except Exception as e:
        print(f"Gemini Error: {type(e).__name__}: {e}")
        
        error_str = str(e).lower()
        
        if "api_key" in error_str or "authentication" in error_str:
            return "I'm having trouble with my API key. Please check the Gemini API configuration."
        elif "quota" in error_str or "limit" in error_str:
            return "I've reached my usage limit. Please try again later or contact support."
        elif "safety" in error_str:
            return "I can't respond to that type of question. Please ask about general pet health topics."
        else:
            return "I'm having trouble connecting right now. Please try again or consult with a veterinarian for immediate concerns."

# Replace the OpenAI function with Gemini
def get_openai_response(user_message, conversation_history=None):
    """Use Gemini instead of OpenAI (keeping same function name for compatibility)"""
    return get_gemini_response(user_message, conversation_history)

@login_required
def chat_view(request):
    """Web interface for chatbot"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_message = data.get('message')
            
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
                ai_response = get_openai_response(user_message, conversation_history)
                
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
        if not user_message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Received message: {user_message}")
        
        # Get or create conversation
        conversation, created = Conversation.objects.get_or_create(
            user=request.user,
            defaults={'user': request.user}
        )
        
        # Save user message
        user_msg = Message.objects.create(
            conversation=conversation,
            content=user_message,
            is_user=True
        )
        
        # Get conversation history for context
        conversation_history = Message.objects.filter(
            conversation=conversation
        ).order_by('created_at')
        
        # Generate AI response using Gemini
        ai_response = get_openai_response(user_message, conversation_history)
        print(f"AI response: {ai_response}")
        
        # Save AI response
        ai_msg = Message.objects.create(
            conversation=conversation,
            content=ai_response,
            is_user=False
        )
        
        return Response({
            'response': ai_response,
            'conversation_id': conversation.id,
            'message_id': ai_msg.id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Chat API error: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_gemini(request):
    """Debug Gemini configuration"""
    from django.conf import settings
    
    api_key = getattr(settings, 'GEMINI_API_KEY', 'NOT SET')
    masked_key = f"{api_key[:10]}...{api_key[-10:]}" if api_key and len(api_key) > 20 else api_key
    
    return Response({
        'api_key_preview': masked_key,
        'api_key_length': len(api_key) if api_key else 0,
        'gemini_available': True,
        'test_message': 'Gemini debug endpoint working'
    })