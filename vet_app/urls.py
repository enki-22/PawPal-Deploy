from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/chatbot/', include('chatbot.urls')),
    path('api/pets/', include('pets.urls')),  # Add this line if missing
    path('chat/', include('chatbot.urls')),
    path('', include('users.urls')),
    path('api/admin/', include('admin_panel.urls')), 
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)