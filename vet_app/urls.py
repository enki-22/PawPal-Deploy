from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from admin_panel.views_announcements import get_active_announcements
from chatbot.views import symptom_checker_predict
from django.urls import path, include, re_path
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/auth/', include('users.urls_auth')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/symptom-checker/predict/', symptom_checker_predict, name='symptom_checker_predict'),
    path('api/pets/', include('pets.urls')),  # Add this line if missing
    path('', include('users.urls')),
    path('api/admin/', include('admin_panel.urls')), 
    
    # ============= PUBLIC ANNOUNCEMENTS ENDPOINT (CHUNK 9) =============
    path('api/announcements/active', get_active_announcements, name='public_active_announcements'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    # This allows Railway to serve your uploaded images in production
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
    ]