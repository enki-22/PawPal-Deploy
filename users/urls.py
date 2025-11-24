from django.urls import path
from django.contrib.auth.views import LogoutView as DjangoLogoutView
from . import views  # Add this import

urlpatterns = [
    # Multi-step registration
    path('', views.register_step1_view, name='register'),
    path('web/register/', views.register_step1_view, name='register_step1_web'),
    path('web/register/step2/', views.register_step2_view, name='register_step2_web'),
    path('web/login/', views.login_view, name='login_web'),
    # Template-based URLs (web interface)
    path('web/logout/', DjangoLogoutView.as_view(next_page='login'), name='logout'),
    path('web/test/', views.test_view, name='test'),
    # API URLs
    path('register/', views.RegisterView.as_view(), name='register_api'),
    path('login/', views.LoginView.as_view(), name='login_api'),
    path('logout/', views.LogoutView.as_view(), name='logout_api'),
    path('profile/', views.user_profile_api, name='user_profile'),  # Use function-based view with custom auth
    path('change-password/', views.user_change_password, name='user_change_password'),
]