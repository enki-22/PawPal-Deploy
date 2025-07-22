from django.urls import path
from . import views

urlpatterns = [
    # Template-based URL (change name to 'chat')
    path('', views.chat_view, name='chat'),
    
    # API URL (change name to avoid conflict)
    path('chat/', views.chat, name='chat_api'),
]