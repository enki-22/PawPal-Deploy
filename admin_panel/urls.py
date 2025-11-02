from django.urls import path
from . import views
from . import views_admin_auth
from . import views_dashboard
from . import views_reports
from . import views_clients
from . import views_pets
from . import views_admin_roles
from . import views_profile
from . import views_announcements

app_name = 'admin_panel'

urlpatterns = [
    # ============= NEW ADMIN AUTHENTICATION (CHUNK 3) =============
    path('login', views_admin_auth.admin_login, name='admin_login_new'),
    path('logout', views_admin_auth.admin_logout, name='admin_logout_new'),
    path('verify-token', views_admin_auth.admin_verify_token, name='admin_verify_token'),
    path('change-password', views_admin_auth.admin_change_password, name='admin_change_password'),
    path('request-password-reset', views_admin_auth.admin_request_password_reset, name='admin_request_password_reset'),
    
    # ============= ADMIN PROFILE ENDPOINTS (CHUNK 10) =============
    path('profile/photo', views_profile.update_admin_profile_photo, name='admin_profile_photo'),
    path('profile', views_profile.get_admin_profile, name='admin_profile'),  # GET, PUT
    path('recovery-email/verify', views_profile.verify_recovery_email, name='admin_recovery_email_verify'),
    path('recovery-email', views_profile.set_recovery_email, name='admin_recovery_email'),
    
    # ============= DASHBOARD ENDPOINTS (CHUNK 4) =============
    path('dashboard/stats', views_dashboard.dashboard_stats, name='dashboard_stats'),
    path('dashboard/recent-pets', views_dashboard.recent_pets, name='dashboard_recent_pets'),
    path('dashboard/flagged-cases', views_dashboard.flagged_cases, name='dashboard_flagged_cases'),
    path('dashboard/charts', views_dashboard.dashboard_charts, name='dashboard_charts'),
    path('dashboard/faqs', views_dashboard.dashboard_faqs, name='dashboard_faqs'),
    path('dashboard/announcements', views_dashboard.dashboard_announcements, name='dashboard_announcements'),
    
    # ============= REPORTS ENDPOINTS (CHUNK 5) =============
    # ⚠️ DEPRECATED: These endpoints are being consolidated into unified endpoints
    # Use instead:
    #   - /api/diagnosis/soap/:caseId (instead of /api/admin/reports/:caseId)
    #   - /api/diagnosis/reports (instead of /api/admin/reports)
    #   - /api/diagnosis/flagged (instead of /api/admin/reports/flagged)
    # TODO: Remove these after frontend migration
    path('reports/flagged', views_reports.get_flagged_reports, name='reports_flagged'),  # DEPRECATED
    path('reports/<str:case_id>', views_reports.get_report_by_case_id, name='report_detail'),  # DEPRECATED
    path('reports', views_reports.get_reports, name='reports_list'),  # DEPRECATED
    
    # ============= CLIENT MANAGEMENT ENDPOINTS (CHUNK 6) =============
    path('clients/<int:user_id>/verify', views_clients.verify_client, name='client_verify'),
    path('clients/<int:user_id>/deactivate', views_clients.deactivate_client, name='client_deactivate'),
    path('clients/<int:user_id>/email', views_clients.send_client_email, name='client_email'),
    path('clients/<int:user_id>', views_clients.get_client_detail, name='client_detail'),
    path('clients/<int:user_id>', views_clients.update_client, name='client_update'),  # PUT
    path('clients', views_clients.get_clients, name='clients_list'),
    
    # ============= PET MANAGEMENT ENDPOINTS (CHUNK 7) =============
    path('pets/<int:pet_id>/files/download-all', views_pets.download_all_pet_files, name='pet_files_download_all'),
    path('pets/<int:pet_id>/files/<str:file_id>/download', views_pets.download_pet_file, name='pet_file_download'),
    path('pets/<int:pet_id>/files', views_pets.get_pet_files, name='pet_files'),
    # ⚠️ DEPRECATED: Use /api/chatbot/conversations/ with ?pet_id=:petId instead
    path('pets/<int:pet_id>/chat/<int:chat_id>', views_pets.get_pet_chat_detail, name='pet_chat_detail'),  # DEPRECATED
    path('pets/<int:pet_id>/chat-history', views_pets.get_pet_chat_history, name='pet_chat_history'),  # DEPRECATED
    # ⚠️ DEPRECATED: Use /api/diagnosis/:petId instead
    path('pets/<int:pet_id>/diagnoses', views_pets.get_pet_diagnoses, name='pet_diagnoses'),  # DEPRECATED
    path('pets/<int:pet_id>/vaccinations', views_pets.get_pet_vaccinations, name='pet_vaccinations'),
    path('pets/<int:pet_id>/medical-records', views_pets.get_pet_medical_records, name='pet_medical_records'),
    # ⚠️ DEPRECATED: Use /api/pets/:petId/ instead
    path('pets/<int:pet_id>', views_pets.get_pet_detail, name='pet_detail'),  # DEPRECATED
    path('pets', views_pets.get_pets, name='pets_list'),  # DEPRECATED
    
    # ============= ADMIN ROLE MANAGEMENT ENDPOINTS (CHUNK 8) =============
    # Note: Multiple HTTP methods on same path handled by api_view decorator
    # Specific routes must come before generic routes
    path('roles/<int:admin_id>/status', views_admin_roles.toggle_admin_status, name='admin_role_status'),
    path('roles/<int:admin_id>', views_admin_roles.get_admin_role_detail, name='admin_role_detail'),  # GET, PUT, DELETE
    path('roles', views_admin_roles.get_admin_roles, name='admin_roles'),  # GET, POST
    
    # ============= ANNOUNCEMENT MANAGEMENT ENDPOINTS (CHUNK 9) =============
    path('announcements/<int:announcement_id>', views_announcements.manage_announcement_detail, name='announcement_detail'),  # GET, PUT, DELETE
    path('announcements', views_announcements.manage_announcements, name='announcements'),  # GET, POST
    
    # ============= OLD AUTHENTICATION (DEPRECATED) =============
    path('auth/login/', views.admin_login, name='admin_login'),
    path('auth/logout/', views.admin_logout, name='admin_logout'),
    path('auth/profile/', views.admin_profile, name='admin_profile'),
    
    # ============= ADMIN SETTINGS =============
    path('settings/', views.admin_settings, name='admin_settings'),
    path('settings/<int:setting_id>/', views.admin_setting_detail, name='admin_setting_detail'),
    
    # ============= DASHBOARD ANALYTICS (OLD) =============
    path('dashboard/analytics/', views.dashboard_analytics, name='dashboard_analytics_old'),
    
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