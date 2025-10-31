from django.urls import path
from . import views_otp

urlpatterns = [
    path('register', views_otp.register, name='auth_register'),
    path('send-otp', views_otp.send_otp, name='auth_send_otp'),
    path('verify-otp', views_otp.verify_otp, name='auth_verify_otp'),
    path('request-password-reset', views_otp.request_password_reset, name='auth_request_password_reset'),
    path('reset-password', views_otp.reset_password, name='auth_reset_password'),
]




