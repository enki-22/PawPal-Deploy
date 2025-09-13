from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Pet
from .serializers import PetSerializer

class PetListCreateView(generics.ListCreateAPIView):
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Pet.objects.filter(owner=self.request.user)
        
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
        serializer.save(owner=self.request.user)

class PetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Pet.objects.filter(owner=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pet_list(request):
    """Get user's pets with filtering"""
    try:
        pets = Pet.objects.filter(owner=request.user)
        
        # Apply filters
        search = request.GET.get('search', '')
        animal_type = request.GET.get('animal_type', '')
        sex = request.GET.get('sex', '')
        
        if search:
            pets = pets.filter(
                Q(name__icontains=search) |
                Q(breed__icontains=search)
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
            
            pets_data.append({
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
            })
        
        return Response(pets_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def pet_detail(request, pet_id):
    """Get, update, or delete a specific pet"""
    try:
        pet = Pet.objects.get(id=pet_id, owner=request.user)
    except Pet.DoesNotExist:
        return Response({'error': 'Pet not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        # Return pet details
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
            'updated_at': pet.updated_at.strftime('%B %d, %Y'),
        }
        return Response(pet_data)

    elif request.method == 'PUT':
        # Update pet
        serializer = PetSerializer(pet, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Delete pet
        pet.delete()
        return Response({'message': 'Pet deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pet_create(request):
    """Create a new pet"""
    try:
        serializer = PetSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            pet = serializer.save(owner=request.user)
            # Return the created pet with proper image URL
            response_data = serializer.data
            if pet.image:
                response_data['image'] = request.build_absolute_uri(pet.image.url)
            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)