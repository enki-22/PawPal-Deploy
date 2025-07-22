
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    is_vet_admin = models.BooleanField(default=False, help_text="Check if this user is a veterinarian/admin")
    
    class Meta:
        verbose_name = "Pet Owner Profile"  # Display name in admin
        verbose_name_plural = "Pet Owner Profiles"
    
    def __str__(self):
        user_type = "Vet Admin" if self.is_vet_admin else "Pet Owner"
        return f"{self.user.username} ({user_type})"

# Signal to create profile when user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()
