from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Conversation, Message
import json
from openai import OpenAI
from django.conf import settings

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)


# Force reload the client with new API key
def get_openai_client():
    """Get OpenAI client with current API key"""
    return OpenAI(api_key=settings.OPENAI_API_KEY)

def get_openai_response(user_message, conversation_history=None):
    """Generate AI response using OpenAI GPT"""
    try:
        # Get fresh client instance
        client = get_openai_client()
        
        print(f"Using API key: {settings.OPENAI_API_KEY[:10]}...{settings.OPENAI_API_KEY[-4:]}")  # Debug
        
        # Build conversation context
        messages = [
            {
                "role": "system", 
                "content": """You are PawPal, a friendly and knowledgeable AI veterinary assistant. 
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
            }
        ]
        
        # Add conversation history if provided (last 5 messages for context)
        if conversation_history and conversation_history.exists():
            history_list = list(conversation_history)
            recent_messages = history_list[-5:] if len(history_list) > 5 else history_list
            
            for msg in recent_messages:
                role = "user" if msg.is_user else "assistant"
                messages.append({
                    "role": role,
                    "content": msg.content
                })
        
        # Add current user message
        messages.append({
            "role": "user", 
            "content": user_message
        })
        
        print(f"Sending request to OpenAI...")  # Debug log
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=300,
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content.strip()
        print(f"OpenAI Response received: {ai_response[:50]}...")  # Debug log
        return ai_response
        
    except Exception as e:
        print(f"OpenAI Error: {type(e).__name__}: {e}")  # More detailed error logging
        
        error_str = str(e).lower()
        
        if "authentication" in error_str or "401" in error_str:
            return f"Authentication error - please check API key. Error: {e}"
        elif "rate_limit" in error_str or "429" in error_str:
            return f"Rate limit exceeded. Error: {e}"
        elif "quota" in error_str or "billing" in error_str:
            return f"Billing/quota issue. Error: {e}"
        else:
            return f"OpenAI API Error: {e}"  # Return the actual error for debugging

            
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
                ).order_by('id')
                
                # Generate AI response using OpenAI
                ai_response = get_openai_response(user_message, conversation_history)
                
                # Save AI response
                Message.objects.create(
                    conversation=conversation,
                    content=ai_response,
                    is_user=False
                )
                
                return JsonResponse({'response': ai_response})
                
        except Exception as e:
            print(f"Chat view error: {e}")  # For debugging
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
        
        print(f"Received message: {user_message}")  # Debug log
        
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
        
        # Generate AI response using OpenAI
        ai_response = get_openai_response(user_message, conversation_history)
        print(f"AI response: {ai_response}")  # Debug log
        
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
        print(f"Chat API error: {e}")  # Debug log
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_openai(request):
    """Debug OpenAI configuration"""
    from django.conf import settings
    
    api_key = getattr(settings, 'OPENAI_API_KEY', 'NOT SET')
    masked_key = f"{api_key[:10]}...{api_key[-10:]}" if api_key and len(api_key) > 20 else api_key
    
    return Response({
        'api_key_preview': masked_key,
        'api_key_length': len(api_key) if api_key else 0,
        'openai_client_exists': 'client' in globals(),
        'test_message': 'Debug endpoint working'
    })