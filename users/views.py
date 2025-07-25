from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .forms import UserAccountForm, UserContactForm
from django.contrib import messages
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer, UserRegistrationSerializer


# NEW: Template-based views for web interface
def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'Welcome back, {username}!')
                return redirect('chat')  # Redirect to chatbot after login
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = AuthenticationForm()
    
    return render(request, 'users/login.html', {'form': form})


def register_step1_view(request):
    """Step 1: Account Information"""
    if request.method == 'POST':
        form = UserAccountForm(request.POST)
        if form.is_valid():
            # Save user data to session (don't create user yet)
            request.session['registration_data'] = {
                'username': form.cleaned_data['username'],
                'email': form.cleaned_data['email'],
                'password1': form.cleaned_data['password1'],
            }
            return redirect('register_step2')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = UserAccountForm()
    
    return render(request, 'users/register_step1.html', {'form': form})

def register_step2_view(request):
    """Step 2: Contact Information"""
    # Check if step 1 was completed
    if 'registration_data' not in request.session:
        messages.error(request, 'Please complete step 1 first.')
        return redirect('register_step1')
    
    if request.method == 'POST':
        contact_form = UserContactForm(request.POST)
        if contact_form.is_valid():
            # Create the user with step 1 data
            reg_data = request.session['registration_data']
            user = User.objects.create_user(
                username=reg_data['username'],
                email=reg_data['email'],
                password=reg_data['password1']
            )
            
            # Create user profile with step 2 data
            profile = user.profile  # This gets created by signal
            profile.phone_number = contact_form.cleaned_data['phone_number']
            profile.address = f"{contact_form.cleaned_data.get('city', '')}, {contact_form.cleaned_data.get('province', '')}\n{contact_form.cleaned_data.get('address', '')}"
            profile.save()
            
            # Clear session data
            del request.session['registration_data']
            
            messages.success(request, f'Account created successfully! Welcome, {user.username}!')
            return redirect('login')
        else:
            messages.error(request, 'Please correct the contact information.')
    else:
        contact_form = UserContactForm()
    
    # Get step 1 data for display
    reg_data = request.session.get('registration_data', {})
    
    return render(request, 'users/register_step2.html', {
        'form': contact_form,
        'username': reg_data.get('username', ''),
        'email': reg_data.get('email', ''),
    })


def register_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            username = form.cleaned_data.get('username')
            messages.success(request, f'Account created for {username}! Please login.')
            return redirect('login')  # Redirect to login after registration
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = UserCreationForm()
    
    return render(request, 'users/register.html', {'form': form})

def test_view(request):
    return render(request, 'users/login.html', {'form': AuthenticationForm()})

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        # Extract user data for UserRegistrationSerializer
        user_data = {
            'username': request.data.get('username'),
            'email': request.data.get('email'),
            'password': request.data.get('password'),
            'password_confirm': request.data.get('password_confirm', request.data.get('password')),
            'first_name': request.data.get('first_name', ''),
            'last_name': request.data.get('last_name', '')
        }
        
        serializer = self.get_serializer(data=user_data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Update the user profile with additional data from React form
        profile = user.profile  # This gets the UserProfile created by signal
        profile.phone_number = request.data.get('phone_number', '')
        
        # Combine city, province, and address into one address field
        city = request.data.get('city', '')
        province = request.data.get('province', '')
        address_line = request.data.get('address', '')
        
        full_address = f"{city}, {province}"
        if address_line:
            full_address += f"\n{address_line}"
        
        profile.address = full_address.strip()
        profile.save()
        
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user).data,
            "token": token.key,
            "message": "Registration successful!"
        }, status=status.HTTP_201_CREATED)

class LoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'email': user.email,
            'is_vet_admin': user.profile.is_vet_admin
        })

class LogoutView(APIView):
    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_200_OK)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user.profile
