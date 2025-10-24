from django.urls import path
from . import views

app_name = 'admin_panel'

urlpatterns = [
    # ============= AUTHENTICATION =============
    path('auth/login/', views.admin_login, name='admin_login'),
    path('auth/logout/', views.admin_logout, name='admin_logout'),
    path('auth/profile/', views.admin_profile, name='admin_profile'),
    
    # ============= ADMIN SETTINGS =============
    path('settings/', views.admin_settings, name='admin_settings'),
    path('settings/<int:setting_id>/', views.admin_setting_detail, name='admin_setting_detail'),
    
    # ============= DASHBOARD ANALYTICS =============
    path('dashboard/analytics/', views.dashboard_analytics, name='dashboard_analytics'),
    
    # ============= CLIENT/USER MANAGEMENT =============
    path('clients/', views.manage_clients, name='manage_clients'),
    path('clients/<int:user_id>/', views.client_management, name='client_management'),
    
    # ============= PET PROFILES =============
    path('pets/', views.pet_profiles, name='pet_profiles'),
    
    # ============= ANNOUNCEMENTS =============
    path('announcements/', views.announcements, name='announcements'),
    path('announcements/<int:announcement_id>/', views.announcement_detail, name='announcement_detail'),
    
    # ============= SOAP REPORTS =============
    path('soap-reports/', views.soap_reports, name='soap_reports'),
    path('soap-reports/<int:report_id>/', views.soap_report_detail, name='soap_report_detail'),
]