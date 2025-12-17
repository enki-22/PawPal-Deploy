from rest_framework import serializers
from .models import Pet

class PetSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Pet
        fields = ['id', 'name', 'animal_type', 'breed', 'date_of_birth', 'age', 'sex', 'weight', 'image', 'image_url', 'medical_notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'image_url']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None