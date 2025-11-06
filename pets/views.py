from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response  
from django.db.models import Q
from .models import Pet
from .serializers import PetSerializer
from utils.unified_permissions import require_user_or_admin

# Import admin filter utilities if available
try:
    from admin_panel.pet_filters import filter_pets, validate_pet_filter_params
    PET_FILTER_UTILS_AVAILABLE = True
except ImportError:
    PET_FILTER_UTILS_AVAILABLE = False

class PetListCreateView(generics.ListCreateAPIView):
    serializer_class = PetSerializer
    authentication_classes = []  # Disable DRF authentication
    permission_classes = [AllowAny] 
    
    def get_queryset(self):
        from utils.unified_permissions import check_user_or_admin
        
        # Check authentication
        user_type, user_obj, error_response = check_user_or_admin(self.request)
        if error_response or user_type != 'pet_owner':
            return Pet.objects.none()  # Return empty queryset if not authenticated
        
        # Set request.user for compatibility
        self.request.user = user_obj
        
        queryset = Pet.objects.filter(owner=user_obj)
        
        # Apply filters
        search = self.request.GET.get('search', '')
        animal_type = self.request.GET.get('animal_type', '')
        sex = self.request.GET.get('sex', '')
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(breed__icontains=search)
            )
        
        if animal_type:
            queryset = queryset.filter(animal_type=animal_type)
            
        if sex:
            queryset = queryset.filter(sex=sex)
        
        return queryset
    
    def perform_create(self, serializer):
        from utils.unified_permissions import check_user_or_admin
        
        # Check authentication
        user_type, user_obj, error_response = check_user_or_admin(self.request)
        if error_response or user_type != 'pet_owner':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Authentication required")
        
        serializer.save(owner=user_obj)

class PetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PetSerializer
    authentication_classes = []  # Disable DRF authentication
    permission_classes = [AllowAny]  # Allow any - we'll handle auth in get_queryset
    
    def get_queryset(self):
        from utils.unified_permissions import check_user_or_admin
        
        # Check authentication
        user_type, user_obj, error_response = check_user_or_admin(self.request)
        if error_response or user_type != 'pet_owner':
            return Pet.objects.none()  # Return empty queryset if not authenticated
        
        # Set request.user for compatibility
        self.request.user = user_obj
        
        return Pet.objects.filter(owner=user_obj)
    
    def perform_update(self, serializer):
        """Override to update AI diagnoses when pet is updated"""
        pet = serializer.save()
        
        # Update pet_context in all related AI diagnoses
        from chatbot.models import AIDiagnosis
        updated_pet_context = {
            'name': pet.name,
            'species': getattr(pet, 'animal_type', 'Unknown'),
            'breed': getattr(pet, 'breed', 'Unknown') or 'Unknown',
            'age': getattr(pet, 'age', 'Unknown'),
            'sex': getattr(pet, 'sex', 'Unknown'),
            'weight': float(pet.weight) if pet.weight else None,
            'medical_notes': getattr(pet, 'medical_notes', '') or '',
        }
        
        # Update all AI diagnoses for this pet
        updated_count = AIDiagnosis.objects.filter(pet=pet).update(pet_context=updated_pet_context)
        if updated_count > 0:
            print(f"✅ Updated pet_context in {updated_count} AI diagnosis(es) for pet {pet.name}")

@api_view(['GET'])
@authentication_classes([])  # Disable DRF authentication - our decorator handles it
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_user_or_admin
def pet_list(request):
    """
    GET /api/pets/
    (CONSOLIDATED: Replaces both /api/pets/ and /api/admin/pets)
    
    Get list of pets with filtering
    Supports both Pet Owners and Admins with role-based access
    
    Query Parameters (Pet Owner):
        - search: Search in pet name, breed
        - animal_type: Filter by animal type
        - sex: Filter by sex
    
    Query Parameters (Admin - uses admin filter format):
        - search: Search in pet name, owner name, pet ID
        - species: all | dogs | cats | birds | rabbits | others
        - status: all | active | inactive | deceased
        - page: Page number (default: 1)
        - limit: Items per page (default: 10, max: 100)
    
    Returns:
        Pet Owner: Array of pet objects
        Admin: Paginated results with pagination info
    
    Permissions:
        - Admins: Can view all pets with advanced filtering
        - Pet Owners: Can only view their own pets
    """
    print(f"[PET_LIST] Received request, user_type: {getattr(request, 'user_type', 'NOT SET')}")
    print(f"[PET_LIST] Authorization header: {request.META.get('HTTP_AUTHORIZATION', '')[:50]}...")
    try:
        # Check if this is an admin request (check for admin-specific params)
        is_admin_format = request.query_params.get('species') is not None or \
                         request.query_params.get('page') is not None
        
        if request.user_type == 'admin' and PET_FILTER_UTILS_AVAILABLE and is_admin_format:
            # Admin format with advanced filtering
            params = {
                'search': request.query_params.get('search', ''),
                'species': request.query_params.get('species', 'all'),
                'status': request.query_params.get('status', 'all'),
                'page': request.query_params.get('page', 1),
                'limit': request.query_params.get('limit', 10)
            }
            
            # Validate parameters
            is_valid, error_message = validate_pet_filter_params(params)
            if not is_valid:
                return Response({
                    'success': False,
                    'error': 'Invalid filter parameters',
                    'details': error_message
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get base queryset (all pets for admin)
            queryset = Pet.objects.select_related('owner').all()
            
            # Apply filters and pagination
            filtered_queryset, pagination_info, applied_filters = filter_pets(
                queryset,
                params
            )
            
            # Format results for admin
            results = []
            for pet in filtered_queryset:
                owner_name = f"{pet.owner.first_name} {pet.owner.last_name}".strip() or pet.owner.username
                
                results.append({
                    'pet_id': f"RP-{str(pet.id).zfill(6)}",
                    'name': pet.name,
                    'species': pet.get_animal_type_display(),
                    'breed': pet.breed or 'Unknown',
                    'owner_name': owner_name,
                    'status': 'Active',  # Placeholder
                    'photo': request.build_absolute_uri(pet.image.url) if pet.image else None,
                    'registered_date': pet.created_at.isoformat()
                })
            
            return Response({
                'success': True,
                'results': results,
                'pagination': pagination_info,
                'filters': applied_filters
            }, status=status.HTTP_200_OK)
        
        else:
            # Pet owner format (simple filtering) or admin without admin params
            # Apply ownership filter for pet owners
            if request.user_type == 'admin':
                pets = Pet.objects.select_related('owner').all()
            else:  # pet_owner
                pets = Pet.objects.filter(owner=request.user)
            
            # Apply simple filters
            search = request.GET.get('search', '')
            animal_type = request.GET.get('animal_type', '')
            sex = request.GET.get('sex', '')
            
            if search:
                pets = pets.filter(
                    Q(name__icontains=search) |
                    Q(breed__icontains=search) |
                    (Q(owner__first_name__icontains=search) if request.user_type == 'admin' else Q())
                )
            
            if animal_type:
                pets = pets.filter(animal_type=animal_type)
                
            if sex:
                pets = pets.filter(sex=sex)
            
            # Serialize data
            pets_data = []
            for pet in pets:
                # Build absolute URL for image
                image_url = None
                if pet.image:
                    image_url = request.build_absolute_uri(pet.image.url)
                
                pet_data = {
                    'id': pet.id,
                    'name': pet.name,
                    'animal_type': pet.animal_type,
                    'breed': pet.breed or 'Mixed Breed',
                    'age': pet.age,
                    'sex': pet.sex,
                    'weight': str(pet.weight) if pet.weight else None,
                    'image': image_url,
                    'medical_notes': pet.medical_notes,
                    'created_at': pet.created_at.strftime('%B %d, %Y'),
                }
                
                # Add owner info for admin requests
                if request.user_type == 'admin':
                    owner_name = f"{pet.owner.first_name} {pet.owner.last_name}".strip() or pet.owner.username
                    pet_data['owner_name'] = owner_name
                    pet_data['owner_id'] = pet.owner.id
                
                pets_data.append(pet_data)
            
            return Response(pets_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@authentication_classes([])  # Disable DRF authentication - our decorator handles it
@permission_classes([AllowAny])  # Allow any - our decorator handles auth
@require_user_or_admin
def pet_detail(request, pet_id):
    """
    GET /api/pets/:petId/
    (CONSOLIDATED: Replaces both /api/pets/:petId/ and /api/admin/pets/:petId)
    
    Get, update, or delete a specific pet
    Supports both Pet Owners and Admins with role-based access
    
    Permissions:
        - Admins: Can view/update any pet (full detail with owner info)
        - Pet Owners: Can only view/update their own pets
    
    Methods:
        - GET: Retrieve pet details
        - PUT: Update pet information
        - DELETE: Delete pet (pet owners only)
    """
    try:
        # Get pet (no ownership filter yet - we'll check after)
        try:
            pet = Pet.objects.select_related('owner').get(id=pet_id)
        except Pet.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Pet not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Check permissions
        if request.user_type == 'admin':
            # Admins can access any pet
            pass
        else:  # pet_owner
            # Pet owners can only access their own pets
            if pet.owner != request.user:
                return Response({
                    'success': False,
                    'error': 'You do not have permission to access this pet'
                }, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'GET':
            # Return pet details
            image_url = None
            if pet.image:
                image_url = request.build_absolute_uri(pet.image.url)
            
            # Base pet data (same for both)
            pet_data = {
                'id': pet.id,
                'name': pet.name,
                'animal_type': pet.animal_type,
                'breed': pet.breed or 'Mixed Breed',
                'age': pet.age,
                'sex': pet.sex,
                'weight': str(pet.weight) if pet.weight else None,
                'image': image_url,
                'medical_notes': pet.medical_notes,
                'created_at': pet.created_at.strftime('%B %d, %Y'),
                'updated_at': pet.updated_at.strftime('%B %d, %Y'),
            }
            
            # Add admin-specific info if admin
            if request.user_type == 'admin':
                owner_name = f"{pet.owner.first_name} {pet.owner.last_name}".strip() or pet.owner.username
                owner_profile = getattr(pet.owner, 'profile', None)
                owner_contact = owner_profile.phone_number if owner_profile and hasattr(owner_profile, 'phone_number') else 'N/A'
                
                pet_data = {
                    'pet_id': f"RP-{str(pet.id).zfill(6)}",
                    'name': pet.name,
                    'species': pet.get_animal_type_display(),
                    'breed': pet.breed or 'Unknown',
                    'sex': pet.get_sex_display(),
                    'age': f"{pet.age} years old",
                    'blood_type': None,  # Placeholder
                    'spayed_neutered': None,  # Placeholder
                    'allergies': None,  # Placeholder
                    'chronic_disease': None,  # Placeholder
                    'photo': image_url,
                    'owner': {
                        'name': owner_name,
                        'contact': owner_contact,
                        'id': pet.owner.id
                    },
                    'registered_date': pet.created_at.isoformat(),
                    'medical_notes': pet.medical_notes
                }
                
                return Response({
                    'success': True,
                    'pet': pet_data
                }, status=status.HTTP_200_OK)
            else:
                return Response(pet_data, status=status.HTTP_200_OK)

        elif request.method == 'PUT':
            # Update pet
            # Additional permission check for pet owners (already checked above, but ensure)
            if request.user_type != 'admin' and pet.owner != request.user:
                return Response({
                    'success': False,
                    'error': 'You do not have permission to update this pet'
                }, status=status.HTTP_403_FORBIDDEN)
            
            serializer = PetSerializer(pet, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # Update pet_context in all related AI diagnoses
                from chatbot.models import AIDiagnosis
                updated_pet_context = {
                    'name': pet.name,
                    'species': getattr(pet, 'animal_type', 'Unknown'),
                    'breed': getattr(pet, 'breed', 'Unknown') or 'Unknown',
                    'age': getattr(pet, 'age', 'Unknown'),
                    'sex': getattr(pet, 'sex', 'Unknown'),
                    'weight': float(pet.weight) if pet.weight else None,
                    'medical_notes': getattr(pet, 'medical_notes', '') or '',
                }
                
                # Update all AI diagnoses for this pet
                updated_count = AIDiagnosis.objects.filter(pet=pet).update(pet_context=updated_pet_context)
                if updated_count > 0:
                    print(f"✅ Updated pet_context in {updated_count} AI diagnosis(es) for pet {pet.name}")
                
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        elif request.method == 'DELETE':
            # Delete pet (pet owners only - admins should use a different mechanism if needed)
            if request.user_type != 'admin' and pet.owner != request.user:
                return Response({
                    'success': False,
                    'error': 'You do not have permission to delete this pet'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Admins typically shouldn't delete pets via this endpoint
            # But we'll allow it if they have access
            pet.delete()
            return Response({
                'success': True,
                'message': 'Pet deleted successfully'
            }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([])  # Disable DRF authentication - we handle it in the function
@permission_classes([AllowAny])  # Allow any - we'll handle auth in the function
def pet_create(request):
    """Create a new pet"""
    from utils.unified_permissions import check_user_or_admin
    
    # Check authentication
    user_type, user_obj, error_response = check_user_or_admin(request)
    if error_response:
        return error_response
    
    # Only pet owners can create pets
    if user_type != 'pet_owner':
        return Response({
            'success': False,
            'error': 'Only pet owners can create pets'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        serializer = PetSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            pet = serializer.save(owner=user_obj)
            # Return the created pet with proper image URL
            response_data = serializer.data
            if pet.image:
                response_data['image'] = request.build_absolute_uri(pet.image.url)
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)