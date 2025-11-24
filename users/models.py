from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    province = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    is_vet_admin = models.BooleanField(default=False, help_text="Check if this user is a veterinarian/admin")
    is_verified = models.BooleanField(default=False, help_text="Email verification status")
    # Newly added fields for Profile Settings
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    facebook = models.URLField(max_length=200, blank=True, null=True)
    
    class Meta:
        verbose_name = "Pet Owner Profile"
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
    if hasattr(instance, 'profile'):
        instance.profile.save()


class OTP(models.Model):
    PURPOSE_ACCOUNT = 'account_creation'
    PURPOSE_PASSWORD = 'password_reset'
    PURPOSE_CHOICES = [
        (PURPOSE_ACCOUNT, 'Account Creation'),
        (PURPOSE_PASSWORD, 'Password Reset'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps', null=True, blank=True)
    email = models.EmailField()
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    attempts = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['email', 'purpose']),
            models.Index(fields=['expires_at']),
        ]

    def __str__(self):
        return f"OTP({self.purpose}) for {self.email} - verified={self.is_verified}"

    @classmethod
    def create_new(cls, email: str, purpose: str, user: User | None = None, ttl_minutes: int = 10):
        expires = timezone.now() + timedelta(minutes=ttl_minutes)
        # Keep latest only: delete old unverified for same purpose
        cls.objects.filter(email=email, purpose=purpose, is_verified=False).delete()
        instance = cls(email=email, purpose=purpose, user=user, code='000000', expires_at=expires)
        return instance