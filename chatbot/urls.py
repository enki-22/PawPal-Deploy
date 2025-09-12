from django.urls import path
from . import views

urlpatterns = [
    # Template-based URL
    path('', views.chat_view, name='chat'),
    
    # Chat API endpoints
    path('chat/', views.chat, name='chat_api'),
    
    # Conversation management endpoints
    path('conversations/', views.get_conversations, name='get_conversations'),
    path('conversations/new/', views.create_new_conversation, name='create_conversation'),
    path('conversations/<int:conversation_id>/', views.get_conversation_messages, name='get_conversation'),
    path('conversations/<int:conversation_id>/pin/', views.toggle_pin_conversation, name='toggle_pin'),
    
    # Diagnosis endpoints (for future Random Forest integration)
    path('diagnoses/', views.get_diagnoses, name='get_diagnoses'),
    path('diagnoses/create/', views.create_diagnosis, name='create_diagnosis'),
    
    # Debug endpoints
    path('debug/', views.debug_gemini, name='debug_gemini'),
    path('debug/openai/', views.debug_openai, name='debug_openai'),  # Legacy endpoint (uses Gemini)
    
    # Commented out for future use
    #path('test-models/', views.test_gemini_models, name='test_gemini_models'),
]