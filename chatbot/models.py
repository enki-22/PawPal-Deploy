from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=200, default="New Conversation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_pinned = models.BooleanField(default=False)
   
    class Meta:
        ordering = ['-updated_at']
   
    def __str__(self):
        return f"{self.user.username} - {self.title}"
   
    def get_first_user_message(self):
        """Get the first user message to generate title"""
        first_message = self.messages.filter(is_user=True).first()
        return first_message.content if first_message else "New Conversation"


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    is_user = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)
   
    class Meta:
        ordering = ['created_at']
   
    def __str__(self):
        sender = "User" if self.is_user else "AI"
        return f"{sender}: {self.content[:50]}..."

# New model for AI Diagnoses
class Diagnosis(models.Model):
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    SPECIES_CHOICES = [
        ('dog', 'Dog'),
        ('cat', 'Cat'),
        ('bird', 'Bird'),
        ('rabbit', 'Rabbit'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    pet_name = models.CharField(max_length=100)
    animal_type = models.CharField(max_length=50, choices=SPECIES_CHOICES, default='dog')
    breed = models.CharField(max_length=100, blank=True, null=True)
    symptoms = models.TextField()
    diagnosis = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='moderate')
    case_id = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Diagnoses"
    
    def __str__(self):
        return f"{self.pet_name} - {self.case_id}"
    
    def save(self, *args, **kwargs):
        if not self.case_id:
            from datetime import datetime
            self.case_id = f"PDX-{datetime.now().strftime('%Y-%m%d')}-{str(self.id or '').zfill(3)}"
        super().save(*args, **kwargs)