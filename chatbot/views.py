from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Conversation, Message
import json
import openai


@login_required
def chat_view(request):
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
                
                # Generate AI response (mock for now)
                ai_response = f"Thank you for asking about: '{user_message}'. I'm here to help with your pet's health questions!"
                
                # Save AI response
                Message.objects.create(
                    conversation=conversation,
                    content=ai_response,
                    is_user=False
                )
                
                return JsonResponse({'response': ai_response})
                
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return render(request, 'chatbot/chat.html')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
    try:
        user_message = request.data.get('message')
        if not user_message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)
        
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
        
        # For now, use mock response (replace with OpenAI later)
        ai_response = f"Thank you for your question: '{user_message}'. I'm a veterinary AI assistant. Please add payment to OpenAI for real responses!"
        
        # TODO: Replace with real OpenAI call when billing is set up
        # client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        # response = client.chat.completions.create(...)
        
        # Save AI response
        Message.objects.create(
            conversation=conversation,
            content=ai_response,
            is_user=False
        )
        
        return Response({
            'response': ai_response,
            'conversation_id': conversation.id
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)