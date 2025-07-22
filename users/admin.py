from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class PetOwnerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'get_is_pet_owner')  # Changed this line
    list_filter = ('is_vet_admin',)
    search_fields = ('user__username', 'user__email', 'phone_number')
    def get_is_pet_owner(self, obj):
        """Display if user is a pet owner (not vet admin)"""
        return not obj.is_vet_admin
    get_is_pet_owner.boolean = True
    get_is_pet_owner.short_description = 'Is Pet Owner'