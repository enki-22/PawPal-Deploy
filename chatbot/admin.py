from django.contrib import admin
from .models import (
    Conversation, 
    Message, 
    Diagnosis, 
    AIDiagnosis, 
    DiagnosisSuggestion, 
    SOAPReport,
    SymptomLog,
    SymptomAlert
)


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'pet', 'is_pinned', 'is_archived', 'created_at', 'updated_at']
    list_filter = ['is_pinned', 'is_archived', 'created_at']
    search_fields = ['title', 'user__username', 'pet__name']
    date_hierarchy = 'created_at'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'is_user', 'created_at', 'content_preview']
    list_filter = ['is_user', 'created_at']
    search_fields = ['content', 'conversation__title']
    date_hierarchy = 'created_at'
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ['case_id', 'pet_name', 'animal_type', 'severity', 'created_at']
    list_filter = ['severity', 'animal_type', 'created_at']
    search_fields = ['case_id', 'pet_name', 'symptoms', 'diagnosis']
    date_hierarchy = 'created_at'
    readonly_fields = ['case_id', 'created_at']


@admin.register(AIDiagnosis)
class AIDiagnosisAdmin(admin.ModelAdmin):
    list_display = ['case_id', 'pet', 'overall_severity', 'urgency_level', 'confidence_score', 'generated_at']
    list_filter = ['overall_severity', 'urgency_level', 'generated_at']
    search_fields = ['case_id', 'pet__name', 'symptoms_text', 'ai_explanation']
    date_hierarchy = 'generated_at'
    readonly_fields = ['case_id', 'generated_at']


@admin.register(DiagnosisSuggestion)
class DiagnosisSuggestionAdmin(admin.ModelAdmin):
    list_display = ['condition_name', 'ai_diagnosis', 'likelihood_percentage', 'urgency_level', 'confidence_score', 'contagious']
    list_filter = ['urgency_level', 'contagious']
    search_fields = ['condition_name', 'description', 'ai_diagnosis__case_id']


@admin.register(SOAPReport)
class SOAPReportAdmin(admin.ModelAdmin):
    list_display = ['case_id', 'pet', 'flag_level', 'date_generated']
    list_filter = ['flag_level', 'date_generated']
    search_fields = ['case_id', 'pet__name', 'subjective']
    date_hierarchy = 'date_generated'
    readonly_fields = ['case_id', 'date_generated', 'date_flagged']


@admin.register(SymptomLog)
class SymptomLogAdmin(admin.ModelAdmin):
    list_display = ['pet', 'symptom_date', 'overall_severity', 'risk_level', 'compared_to_yesterday', 'logged_date']
    list_filter = ['overall_severity', 'risk_level', 'compared_to_yesterday', 'symptom_date']
    search_fields = ['pet__name', 'user__username', 'notes']
    date_hierarchy = 'symptom_date'
    readonly_fields = ['logged_date']
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'pet', 'symptom_date', 'logged_date')
        }),
        ('Symptoms', {
            'fields': ('symptoms', 'symptom_details', 'overall_severity')
        }),
        ('Progression', {
            'fields': ('compared_to_yesterday', 'notes')
        }),
        ('Risk Assessment', {
            'fields': ('risk_score', 'risk_level'),
            'description': 'Calculated risk metrics'
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queries by selecting related objects"""
        qs = super().get_queryset(request)
        return qs.select_related('user', 'pet')


@admin.register(SymptomAlert)
class SymptomAlertAdmin(admin.ModelAdmin):
    list_display = ['pet', 'alert_type', 'acknowledged', 'created_at', 'acknowledged_at']
    list_filter = ['alert_type', 'acknowledged', 'created_at']
    search_fields = ['pet__name', 'user__username', 'alert_message']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'acknowledged_at']
    actions = ['mark_as_acknowledged']
    fieldsets = (
        ('Alert Information', {
            'fields': ('symptom_log', 'pet', 'user', 'alert_type', 'alert_message')
        }),
        ('Tracking', {
            'fields': ('created_at', 'acknowledged', 'acknowledged_at')
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queries by selecting related objects"""
        qs = super().get_queryset(request)
        return qs.select_related('symptom_log', 'pet', 'user')
    
    @admin.action(description='Mark selected alerts as acknowledged')
    def mark_as_acknowledged(self, request, queryset):
        """Bulk action to acknowledge alerts"""
        updated = 0
        for alert in queryset:
            if not alert.acknowledged:
                alert.acknowledge()
                updated += 1
        self.message_user(request, f'{updated} alert(s) marked as acknowledged.')
    mark_as_acknowledged.short_description = 'Mark as acknowledged'
