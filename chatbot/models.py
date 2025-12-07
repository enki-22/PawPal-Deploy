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
            self.case_id = f"PDX-{timezone.now().strftime('%Y-%m%d')}-{str(uuid.uuid4())[:12].upper()}"
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


class SymptomLog(models.Model):
    """Daily symptom logging for pets"""
    
    SEVERITY_CHOICES = [
        ('mild', 'Mild'),
        ('moderate', 'Moderate'),
        ('severe', 'Severe'),
    ]
    
    PROGRESSION_CHOICES = [
        ('worse', 'Getting Worse'),
        ('same', 'About the Same'),
        ('better', 'Getting Better'),
        ('new', 'First Occurrence'),
    ]
    
    RISK_LEVEL_CHOICES = [
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    # Relationships
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='symptom_logs')
    pet = models.ForeignKey('pets.Pet', on_delete=models.CASCADE, related_name='symptom_logs')
    
    # Symptom data
    logged_date = models.DateTimeField(auto_now_add=True)
    symptom_date = models.DateField(help_text="Actual date symptoms occurred")
    
    # Symptoms (stored as JSON for flexibility)
    symptoms = models.JSONField(help_text="List of symptom names. Example: ['vomiting', 'lethargy', 'loss_of_appetite']")
    
    # Severity assessment
    overall_severity = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
        help_text="Overall severity of symptoms"
    )
    
    # Symptom-specific severity (optional)
    symptom_details = models.JSONField(
        default=dict,
        blank=True,
        help_text="Symptom-specific details. Example: {'vomiting': {'count': 3, 'notes': 'After eating'}}"
    )
    
    # Progression
    compared_to_yesterday = models.CharField(
        max_length=20,
        choices=PROGRESSION_CHOICES,
        blank=True,
        null=True,
        help_text="How symptoms compare to previous day"
    )
    
    # Additional notes
    notes = models.TextField(blank=True, help_text="Additional observations or context")
    
    # Risk assessment (calculated)
    risk_score = models.IntegerField(
        default=0,
        help_text="Calculated risk score (0-100)"
    )
    risk_level = models.CharField(
        max_length=20,
        choices=RISK_LEVEL_CHOICES,
        blank=True,
        help_text="Calculated risk level based on score"
    )
    
    class Meta:
        ordering = ['-symptom_date', '-logged_date']
        indexes = [
            models.Index(fields=['pet', '-symptom_date']),
            models.Index(fields=['user', '-logged_date']),
        ]
        verbose_name = 'Symptom Log'
        verbose_name_plural = 'Symptom Logs'
    
    def __str__(self):
        return f"{self.pet.name} - {self.symptom_date} - {self.overall_severity}"


class SymptomAlert(models.Model):
    """Alerts for concerning symptom patterns"""
    
    ALERT_TYPE_CHOICES = [
        ('rapid_deterioration', 'Rapid Deterioration'),
        ('new_critical_symptom', 'New Critical Symptom'),
        ('prolonged_symptoms', 'Prolonged Symptoms'),
        ('risk_escalation', 'Risk Level Increased'),
    ]
    
    # Relationships
    symptom_log = models.ForeignKey(
        SymptomLog,
        on_delete=models.CASCADE,
        related_name='alerts',
        help_text="The symptom log that triggered this alert"
    )
    pet = models.ForeignKey(
        'pets.Pet',
        on_delete=models.CASCADE,
        related_name='symptom_alerts'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='symptom_alerts'
    )
    
    # Alert details
    alert_type = models.CharField(
        max_length=50,
        choices=ALERT_TYPE_CHOICES,
        help_text="Type of alert triggered"
    )
    alert_message = models.TextField(help_text="Detailed alert message for the user")
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    acknowledged = models.BooleanField(
        default=False,
        help_text="Whether the user has acknowledged this alert"
    )
    acknowledged_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the alert was acknowledged"
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Symptom Alert'
        verbose_name_plural = 'Symptom Alerts'
    
    def __str__(self):
        return f"{self.pet.name} - {self.alert_type} - {self.created_at.strftime('%Y-%m-%d')}"
    
    def acknowledge(self):
        """Mark alert as acknowledged"""
        self.acknowledged = True
        self.acknowledged_at = timezone.now()
        self.save()


class PetHealthTrend(models.Model):
    """AI-generated health trend analysis for pets"""
    
    URGENCY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    ]
    
    pet = models.ForeignKey('pets.Pet', on_delete=models.CASCADE, related_name='health_trends')
    analysis_date = models.DateTimeField(auto_now_add=True)
    
    # AI-generated metrics
    risk_score = models.IntegerField(default=0, help_text="Risk score from 0-100")
    urgency_level = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='Low')
    trend_analysis = models.TextField(help_text="AI explanation of the trend")
    prediction = models.TextField(help_text="AI forecast for next 24h")
    alert_needed = models.BooleanField(default=False, help_text="Whether an alert should be shown")
    
    class Meta:
        ordering = ['-analysis_date']
        indexes = [
            models.Index(fields=['pet', '-analysis_date']),
        ]
        verbose_name = 'Pet Health Trend'
        verbose_name_plural = 'Pet Health Trends'
    
    def __str__(self):
        return f"{self.pet.name} - {self.analysis_date.strftime('%Y-%m-%d')} - {self.urgency_level}"