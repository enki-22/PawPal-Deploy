from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from admin_panel.views_announcements import get_active_announcements
from chatbot.views import symptom_checker_predict

urlpatterns = [
    # Rename Django admin path to avoid collision with React Admin routes
    path('django-admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/auth/', include('users.urls_auth')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/symptom-checker/predict/', symptom_checker_predict, name='symptom_checker_predict'),
    path('api/pets/', include('pets.urls')),  # Add this line if missing
    # NOTE: Removed root inclusion of `users.urls` to avoid exposing template routes under API paths.
    # If you need site root pages, create a dedicated `pages` or `frontend` urls module.
    path('api/admin/', include('admin_panel.urls')), 
    
    # ============= PUBLIC ANNOUNCEMENTS ENDPOINT (CHUNK 9) =============
    path('api/announcements/active', get_active_announcements, name='public_active_announcements'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)