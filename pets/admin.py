from django.contrib import admin
from .models import Pet

@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ['name', 'animal_type', 'breed', 'age', 'sex', 'owner', 'created_at']
    list_filter = ['animal_type', 'sex', 'created_at']
    search_fields = ['name', 'breed', 'owner__username']
    list_per_page = 20
    ordering = ['name']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'animal_type', 'breed', 'age', 'sex')
        }),
        ('Physical Details', {
            'fields': ('weight', 'image')
        }),
        ('Medical Information', {
            'fields': ('medical_notes',)
        }),
        ('Owner Information', {
            'fields': ('owner',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # If you want to restrict access for non-superusers
        return qs.filter(owner=request.user)