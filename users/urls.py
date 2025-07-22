from django.urls import path
from django.contrib.auth.views import LogoutView as DjangoLogoutView
# Add a print statement to confirm this file is being loaded
print("Loading users/urls.py")

try:
    from .views import RegisterView, LoginView, LogoutView, UserProfileView, login_view, register_view, test_view
    urlpatterns = [
        # Template-based URLs (web interface)
        path('web/login/', login_view, name='login'),
        path('web/register/', register_view, name='register'),
        path('web/logout/', DjangoLogoutView.as_view(next_page='login'), name='logout'),
        path('web/test/', test_view, name='test'),
        
        # API URLs (existing - keep these)
        path('register/', RegisterView.as_view(), name='register_api'),
        path('login/', LoginView.as_view(), name='login_api'),
        path('logout/', LogoutView.as_view(), name='logout_api'),
        path('profile/', UserProfileView.as_view(), name='profile_api'),
    ]
    print("Successfully loaded user URL patterns with web templates")
except Exception as e:
    print(f"Error loading users/urls.py: {e}")
    # fallback pattern so Django doesn't crash
    urlpatterns = [
        path('register/', RegisterView.as_view(), name='register'),
        path('login/', LoginView.as_view(), name='login'),
        path('logout/', LogoutView.as_view(), name='logout'),
        path('profile/', UserProfileView.as_view(), name='profile'),
    ]