from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views_symptom_tracker import SymptomTrackerViewSet

# Create router for symptom tracker
router = DefaultRouter()
router.register(r'symptom-tracker', SymptomTrackerViewSet, basename='symptom-tracker')

urlpatterns = [
    # Template-based URL
    path('', views.chat_view, name='chat'),
   
    # Chat API endpoints
    path('chat/', views.chat, name='chat_api'),
    
   #TEST VIEW

   path('test-gemini-api-key/', views.test_gemini_api_key, name='test_gemini_api_key'),
    # Conversation management endpoints
    path('conversations/', views.get_conversations, name='get_conversations'),
    path('conversations/new/', views.create_new_conversation, name='create_conversation'),
    path('conversations/<int:conversation_id>/', views.get_conversation_messages, name='get_conversation'),
    path('conversations/<int:conversation_id>/update/', views.update_conversation, name='update_conversation'),
    path('conversations/<int:conversation_id>/pin/', views.toggle_pin_conversation, name='toggle_pin'),
    path('conversations/<int:conversation_id>/delete/', views.delete_conversation, name='delete_conversation'),
   
    # Diagnosis endpoints (for future Random Forest integration)
    path('diagnoses/', views.get_diagnoses, name='get_diagnoses'),
    path('diagnoses/create/', views.create_diagnosis, name='create_diagnosis'),
    path('predict/', views.predict_symptoms, name='predict_symptoms'),
    path('ai-diagnosis/create/', views.create_ai_diagnosis, name='create_ai_diagnosis'),
    path('create-ai-diagnosis/', views.create_ai_diagnosis, name='create_ai_diagnosis_alt'),
    path('upload-image/', views.upload_symptom_image, name='upload_symptom_image'),
    # Pet integration
    path('get-user-pets/', views.get_user_pets, name='get_user_pets'),
    path('start-conversation-with-pet/', views.start_conversation_with_pet, name='start_conversation_with_pet'),
    path('analyze-symptom-with-image/', views.analyze_symptom_with_image, name='analyze_symptom_with_image'),
    
    # Symptom checker endpoints
    path('symptom-checker/predict/', views.symptom_checker_predict, name='symptom_checker_predict'),
   
    # Debug endpoints
    path('debug/', views.debug_gemini, name='debug_gemini'),
    path('debug/openai/', views.debug_openai, name='debug_openai'),  # Legacy endpoint (uses Gemini)
   
    # Commented out for future use
    #path('test-models/', views.test_gemini_models, name='test_gemini_models'),
]

# Include symptom tracker router URLs
urlpatterns += router.urls

# Diagnosis SOAP endpoints (Chunk 2 - High Priority)
# CONSOLIDATED: These endpoints now support both Pet Owners and Admins
from . import views_diagnosis

urlpatterns += [
    path('diagnosis/generate', views_diagnosis.generate_diagnosis, name='diagnosis_generate'),
    path('diagnosis/soap/<str:case_id>', views_diagnosis.get_soap_report_by_case_id, name='diagnosis_get_soap'),
    path('diagnosis/<int:pet_id>', views_diagnosis.get_pet_diagnoses, name='diagnosis_by_pet'),
    # Flagged cases: pet_id required for pet owners, optional for admins
    path('diagnosis/flagged/<int:pet_id>', views_diagnosis.get_flagged_cases, name='diagnosis_flagged_by_pet'),
    path('diagnosis/flagged', views_diagnosis.get_flagged_cases, name='diagnosis_flagged_all'),
    # Reports list: unified endpoint for both user types
    path('diagnosis/reports', views_diagnosis.get_all_reports, name='diagnosis_reports_list'),
]



