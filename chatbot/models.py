from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid


class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    pet = models.ForeignKey('pets.Pet', on_delete=models.CASCADE, null=True, blank=True, related_name='conversations')
    title = models.CharField(max_length=200, default='New Conversation')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    is_pinned = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    is_user = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{'User' if self.is_user else 'AI'}: {self.content[:50]}..."


class Diagnosis(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='diagnoses')
    pet_name = models.CharField(max_length=100)
    animal_type = models.CharField(max_length=20, default='dog')
    breed = models.CharField(max_length=100, blank=True, null=True)
    symptoms = models.TextField()
    diagnosis = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='moderate')
    case_id = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Diagnosis {self.case_id} - {self.pet_name}"


class AIDiagnosis(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    URGENCY_CHOICES = [
        ('routine', 'Routine Check-up'),
        ('soon', 'Schedule Soon'),
        ('immediate', 'Immediate Care'),
        ('emergency', 'Emergency'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_diagnoses')
    pet = models.ForeignKey('pets.Pet', on_delete=models.CASCADE, related_name='ai_diagnoses')
    
    # Case Information
    case_id = models.CharField(max_length=50, unique=True, default='')
    generated_at = models.DateTimeField(auto_now_add=True)
    
    # Input Data
    symptoms_text = models.TextField(help_text="User's symptom description")
    image_analysis = models.JSONField(blank=True, null=True, help_text="Image classification results")
    
    # AI Predictions
    ml_predictions = models.JSONField(help_text="Random Forest predictions")
    ai_explanation = models.TextField(help_text="Gemini AI explanation")
    
    # Diagnosis Results
    suggested_diagnoses = models.JSONField(help_text="Structured diagnosis suggestions")
    overall_severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES)
    urgency_level = models.CharField(max_length=20, choices=URGENCY_CHOICES)
    
    # Additional Context
    pet_context = models.JSONField(help_text="Pet profile context used")
    confidence_score = models.FloatField(default=0.0)
    
    class Meta:
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"AI Diagnosis {self.case_id} - {self.pet.name}"
    
    def save(self, *args, **kwargs):
        if not self.case_id:
            self.case_id = f"PDX-{timezone.now().strftime('%Y-%m%d')}-{str(uuid.uuid4())[:3].upper()}"
        super().save(*args, **kwargs)


class DiagnosisSuggestion(models.Model):
    """Individual diagnosis suggestions within an AI Diagnosis"""
    
    ai_diagnosis = models.ForeignKey(AIDiagnosis, on_delete=models.CASCADE, related_name='suggestions')
    
    # Diagnosis Details
    condition_name = models.CharField(max_length=200)
    likelihood_percentage = models.FloatField()
    description = models.TextField()
    matched_symptoms = models.JSONField(help_text="List of symptoms that match this condition")
    
    # Medical Information
    urgency_level = models.CharField(max_length=20, choices=AIDiagnosis.URGENCY_CHOICES)
    contagious = models.BooleanField(default=False)
    treatment_notes = models.TextField(blank=True, null=True)
    
    # Confidence Metrics
    confidence_score = models.FloatField()
    risk_factors = models.JSONField(blank=True, null=True, help_text="Risk factors for this condition")
    
    class Meta:
        ordering = ['-likelihood_percentage']
    
    def __str__(self):
        return f"{self.condition_name} ({self.likelihood_percentage}%)"


class SOAPReport(models.Model):
    case_id = models.CharField(max_length=30, unique=True)
    pet = models.ForeignKey('pets.Pet', on_delete=models.CASCADE, related_name='soap_reports')
    chat_conversation = models.ForeignKey(Conversation, on_delete=models.SET_NULL, null=True, blank=True, related_name='soap_reports')
    subjective = models.TextField()
    objective = models.JSONField()  # {symptoms: [], duration: ""}
    assessment = models.JSONField()  # [{condition, likelihood, urgency, description, matched_symptoms, contagious}]
    plan = models.JSONField()  # {severityLevel, careAdvice: []}
    flag_level = models.CharField(max_length=20)
    date_generated = models.DateTimeField(auto_now_add=True)
    date_flagged = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_generated']

    def __str__(self):
        return f"SOAP {self.case_id} - {self.pet.name}"