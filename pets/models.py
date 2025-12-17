from django.db import models
from django.contrib.auth.models import User

class Pet(models.Model):
    ANIMAL_CHOICES = [
        ('cat', 'Cat'),
        ('dog', 'Dog'),
        ('hamster', 'Hamster'),
        ('bird', 'Bird'),
        ('rabbit', 'Rabbit'),
        ('fish', 'Fish'),
        ('other', 'Other'),
    ]
    
    SEX_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pets')
    name = models.CharField(max_length=100)
    animal_type = models.CharField(max_length=20, choices=ANIMAL_CHOICES)  # This is the correct field name
    breed = models.CharField(max_length=100, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    age = models.PositiveIntegerField(help_text="Age in years")
    sex = models.CharField(max_length=10, choices=SEX_CHOICES)
    weight = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Weight in kg")
    image = models.ImageField(upload_to='pets/', blank=True, null=True)
    medical_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.animal_type})"