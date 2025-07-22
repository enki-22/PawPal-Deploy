from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import UserProfile

class UserAccountForm(UserCreationForm):
    """Step 1: Basic account information"""
    email = forms.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')

class UserContactForm(forms.ModelForm):
    """Step 2: Contact information"""
    PROVINCE_CHOICES = [
        ('', 'Select Province'),
        ('metro_manila', 'Metro Manila'),
        ('cebu', 'Cebu'),
        ('davao', 'Davao'),
        ('laguna', 'Laguna'),
        ('cavite', 'Cavite'),
        # Add more provinces as needed
    ]
    
    CITY_CHOICES = [
        ('', 'Select City'),
        ('manila', 'Manila'),
        ('quezon_city', 'Quezon City'),
        ('makati', 'Makati'),
        ('cebu_city', 'Cebu City'),
        ('davao_city', 'Davao City'),
        # Add more cities as needed
    ]
    
    phone_number = forms.CharField(max_length=15, required=True)
    province = forms.ChoiceField(choices=PROVINCE_CHOICES, required=True)
    city = forms.ChoiceField(choices=CITY_CHOICES, required=True)
    address = forms.CharField(widget=forms.Textarea(attrs={'rows': 3}), required=False)
    
    class Meta:
        model = UserProfile
        fields = ('phone_number', 'address')
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['phone_number'].widget.attrs.update({'placeholder': '+63 9XX XXX XXXX'})