"""
Serializers for chatbot and diagnosis endpoints
"""
from rest_framework import serializers
from .models import SOAPReport, Conversation, Message, AIDiagnosis
from pets.models import Pet
from django.contrib.auth.models import User


class PetBasicSerializer(serializers.ModelSerializer):
    """Basic pet information for SOAP reports"""
    
    class Meta:
        model = Pet
        fields = ['id', 'name', 'animal_type', 'breed', 'age', 'sex', 'weight']
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Ensure breed has a default value
        if not data.get('breed'):
            data['breed'] = 'Mixed Breed'
        # Convert weight to float if exists
        if data.get('weight'):
            data['weight'] = float(data['weight'])
        return data


class OwnerBasicSerializer(serializers.ModelSerializer):
    """Basic owner information for SOAP reports"""
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'name', 'email']
    
    def get_name(self, obj):
        """Get full name or username"""
        full_name = obj.get_full_name()
        return full_name if full_name else obj.username


class SOAPReportSerializer(serializers.ModelSerializer):
    """Serializer for SOAP Report model"""
    pet = PetBasicSerializer(read_only=True)
    owner = serializers.SerializerMethodField()
    chat_conversation_id = serializers.SerializerMethodField()
    
    class Meta:
        model = SOAPReport
        fields = [
            'case_id',
            'pet',
            'owner',
            'subjective',
            'objective',
            'assessment',
            'plan',
            'flag_level',
            'date_generated',
            'date_flagged',
            'chat_conversation_id'
        ]
        read_only_fields = ['case_id', 'date_generated', 'date_flagged']
    
    def get_owner(self, obj):
        """Get owner information from pet"""
        return OwnerBasicSerializer(obj.pet.owner).data
    
    def get_chat_conversation_id(self, obj):
        """Get conversation ID if exists"""
        return obj.chat_conversation.id if obj.chat_conversation else None


class SOAPReportListSerializer(serializers.ModelSerializer):
    """Simplified serializer for listing SOAP reports"""
    pet_name = serializers.CharField(source='pet.name', read_only=True)
    pet_id = serializers.IntegerField(source='pet.id', read_only=True)
    owner_name = serializers.SerializerMethodField()
    top_condition = serializers.SerializerMethodField()
    likelihood = serializers.SerializerMethodField()
    
    class Meta:
        model = SOAPReport
        fields = [
            'case_id',
            'pet_id',
            'pet_name',
            'owner_name',
            'date_generated',
            'flag_level',
            'top_condition',
            'likelihood',
            'severity',
        ]
    
    def get_owner_name(self, obj):
        """Get owner's name"""
        owner = obj.pet.owner
        full_name = owner.get_full_name()
        return full_name if full_name else owner.username
    
    def get_top_condition(self, obj):
        """Get top condition from assessment"""
        if obj.assessment and len(obj.assessment) > 0:
            return obj.assessment[0].get('condition', 'Unknown')
        return None
    
    def get_likelihood(self, obj):
        """Get likelihood of top condition"""
        if obj.assessment and len(obj.assessment) > 0:
            return obj.assessment[0].get('likelihood', 0)
        return None

    def get_severity(self, obj):
        """Get severity of top condition"""
        if obj.assessment and len(obj.assessment) > 0:
            return obj.assessment[0].get('severity', 'Unknown')
        return None

class DiagnosisGenerateSerializer(serializers.Serializer):
    """Serializer for diagnosis generation input"""
    pet_id = serializers.IntegerField(required=True)
    symptoms = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=True,
        min_length=1,
        help_text="List of symptom descriptions"
    )
    duration = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Duration of symptoms (e.g., '3 days', '1 week')"
    )
    subjective = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Subjective description from pet owner"
    )
    chat_conversation_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Optional chat conversation ID to link"
    )
    image = serializers.ImageField(
        required=False,
        allow_null=True,
        help_text="Optional symptom image"
    )
    
    def validate_pet_id(self, value):
        """Validate that pet exists and belongs to requesting user"""
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError("Request context is required")
        
        try:
            pet = Pet.objects.get(id=value, owner=request.user)
            return value
        except Pet.DoesNotExist:
            raise serializers.ValidationError("Pet not found or does not belong to you")
    
    def validate_symptoms(self, value):
        """Validate symptoms list"""
        if not value:
            raise serializers.ValidationError("At least one symptom is required")
        
        # Remove empty strings
        cleaned_symptoms = [s.strip() for s in value if s.strip()]
        
        if not cleaned_symptoms:
            raise serializers.ValidationError("At least one non-empty symptom is required")
        
        return cleaned_symptoms


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for Conversation model"""
    pet_name = serializers.CharField(source='pet.name', read_only=True, allow_null=True)
    message_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id',
            'title',
            'pet_name',
            'created_at',
            'updated_at',
            'is_pinned',
            'is_archived',
            'message_count',
            'last_message_preview'
        ]
        read_only_fields = ['created_at', 'updated_at', 'message_count', 'last_message_preview']
    
    def get_message_count(self, obj):
        """Get count of messages in conversation"""
        return obj.messages.count()
    
    def get_last_message_preview(self, obj):
        """Get preview of last message"""
        last_message = obj.messages.last()
        if last_message:
            preview = last_message.content[:100]
            return preview + "..." if len(last_message.content) > 100 else preview
        return ""


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model"""
    sender = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender', 'is_user', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_sender(self, obj):
        """Get sender label"""
        return "You" if obj.is_user else "PawPal"


class AIDiagnosisSerializer(serializers.ModelSerializer):
    """Serializer for AI Diagnosis model"""
    pet = PetBasicSerializer(read_only=True)
    
    class Meta:
        model = AIDiagnosis
        fields = [
            'id',
            'case_id',
            'pet',
            'generated_at',
            'symptoms_text',
            'image_analysis',
            'ml_predictions',
            'ai_explanation',
            'suggested_diagnoses',
            'overall_severity',
            'urgency_level',
            'pet_context',
            'confidence_score'
        ]
        read_only_fields = ['id', 'case_id', 'generated_at']

