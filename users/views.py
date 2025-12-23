from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .serializers import UserSerializer, UserProfileSerializer, UserRegistrationSerializer
from .models import UserProfile
import json

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'user': UserSerializer(user).data,
                'token': token.key
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                token, created = Token.objects.get_or_create(user=user)
                return Response({
                    'user': UserSerializer(user).data,
                    'token': token.key
                })
            else:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'error': 'Username and password required'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            request.user.auth_token.delete()
        except:
            pass
        return Response({'message': 'Logged out successfully'})

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

# Web template views (for backward compatibility)
@csrf_exempt
@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({
                    'success': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email
                    }
                })
            else:
                return JsonResponse({'success': False, 'error': 'Invalid credentials'})
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON'})
    
    return render(request, 'users/login.html')

@csrf_exempt
@require_http_methods(["GET", "POST"])
def register_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            
            if User.objects.filter(username=username).exists():
                return JsonResponse({'success': False, 'error': 'Username already exists'})
            
            user = User.objects.create_user(username=username, email=email, password=password)
            UserProfile.objects.create(user=user)
            
            return JsonResponse({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            })
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON'})
    
    return render(request, 'users/register.html')

def register_step1_view(request):
    return render(request, 'users/register_step1.html')

def register_step2_view(request):
    return render(request, 'users/register_step2.html')

def test_view(request):
    return JsonResponse({'message': 'Users app is working!'})


@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])  # We use custom check inside
@parser_classes([MultiPartParser, FormParser, JSONParser])
def user_profile_api(request):
    """
    Get or Update current user profile.
    Handles both User model fields (first_name, last_name, email)
    and UserProfile fields (phone, address, image, etc).
    """
    from utils.unified_permissions import check_user_or_admin
    
    # 1. Authentication
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners (for this specific endpoint logic)
    if user_type != 'pet_owner':
        return Response({
            'success': False, 
            'error': 'Only pet owners can access this endpoint'
        }, status=status.HTTP_403_FORBIDDEN)
    
    user = user_obj
    profile, created = UserProfile.objects.get_or_create(user=user)

    # 2. GET Request: Return Data
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        # Return a combined structure similar to previous implementation
        data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile': serializer.data
        }
        return Response(data)

    # 3. PATCH Request: Update Data
    elif request.method == 'PATCH':
        data = request.data
        
        # A. Update User Model Fields (if present)
        user_changed = False
        if 'first_name' in data:
            user.first_name = data['first_name']
            user_changed = True
        if 'last_name' in data:
            user.last_name = data['last_name']
            user_changed = True
        # Allow username updates (align with registration username)
        if 'username' in data:
            new_username = data['username']
            if User.objects.filter(username=new_username).exclude(id=user.id).exists():
                return Response({'error': 'Username already in use'}, status=400)
            user.username = new_username
            user_changed = True
        if 'email' in data:
            # Basic duplicate check
            if User.objects.filter(email=data['email']).exclude(id=user.id).exists():
                return Response({'error': 'Email already in use'}, status=400)
            user.email = data['email']
            user_changed = True
        
        if user_changed:
            user.save()

        # B. Update UserProfile Fields
        # We pass partial=True to allow updating just some fields
        serializer = UserProfileSerializer(profile, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'username': user.username,
                'profile': serializer.data
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_change_password(request):
    """
    POST /api/users/change-password/

    Body:
      - current_password
      - new_password
      - confirm_password

    Returns 200 on success or 400 with field errors.
    """
    user = request.user
    current = request.data.get('current_password')
    new = request.data.get('new_password')
    confirm = request.data.get('confirm_password')

    errors = {}
    if not current:
        errors['current_password'] = ['Current password is required']
    if not new:
        errors['new_password'] = ['New password is required']
    if not confirm:
        errors['confirm_password'] = ['Please confirm your new password']

    if errors:
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

    if new != confirm:
        return Response({'new_password': ['New password and confirmation do not match']}, status=status.HTTP_400_BAD_REQUEST)

    if len(new) < 8:
        return Response({'new_password': ['Password must be at least 8 characters']}, status=status.HTTP_400_BAD_REQUEST)

    # Verify current password
    if not user.check_password(current):
        return Response({'current_password': ['Current password is incorrect']}, status=status.HTTP_400_BAD_REQUEST)

    # All good - set new password
    user.set_password(new)
    user.save()
    return Response({'detail': 'Password changed successfully'}, status=status.HTTP_200_OK)