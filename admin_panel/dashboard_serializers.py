"""
Dashboard Serializers (Chunk 4)
Serializers for dashboard endpoint responses
"""
from rest_framework import serializers


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics
    GET /api/admin/dashboard/stats
    """
    total_users = serializers.IntegerField(
        help_text="Total registered users"
    )
    total_pets = serializers.IntegerField(
        help_text="Total registered pets"
    )
    total_reports = serializers.IntegerField(
        help_text="Total SOAP reports (filtered)"
    )
    total_conversations = serializers.IntegerField(
        help_text="Total conversations (filtered)"
    )
    filters_applied = serializers.DictField(
        help_text="Applied filter parameters"
    )


class RecentPetSerializer(serializers.Serializer):
    """
    Serializer for recent pet data
    GET /api/admin/dashboard/recent-pets
    """
    pet_name = serializers.CharField()
    species = serializers.CharField()
    breed = serializers.CharField()
    owner_name = serializers.CharField()
    registration_date = serializers.DateTimeField()


class FlaggedCaseSerializer(serializers.Serializer):
    """
    Serializer for flagged case data
    GET /api/admin/dashboard/flagged-cases
    """
    case_id = serializers.CharField()
    pet_name = serializers.CharField()
    species = serializers.CharField()
    condition = serializers.CharField(allow_null=True)
    likelihood = serializers.FloatField(allow_null=True)
    urgency = serializers.CharField(allow_null=True)
    owner_name = serializers.CharField()
    date_flagged = serializers.DateTimeField()
    flag_level = serializers.CharField()


class SpeciesBreakdownSerializer(serializers.Serializer):
    """
    Serializer for species breakdown data
    """
    Dogs = serializers.IntegerField()
    Cats = serializers.IntegerField()
    Birds = serializers.IntegerField()
    Rabbits = serializers.IntegerField()
    Others = serializers.IntegerField()


class CommonSymptomSerializer(serializers.Serializer):
    """
    Serializer for common symptom data
    """
    symptom = serializers.CharField()
    count = serializers.IntegerField()


class DashboardChartsSerializer(serializers.Serializer):
    """
    Serializer for dashboard charts data
    GET /api/admin/dashboard/charts
    """
    species_breakdown = SpeciesBreakdownSerializer()
    common_symptoms = CommonSymptomSerializer(many=True)
    symptoms_by_species = serializers.DictField(
        child=serializers.ListField(child=serializers.CharField())
    )


class FAQSerializer(serializers.Serializer):
    """
    Serializer for FAQ data
    GET /api/admin/dashboard/faqs
    """
    question = serializers.CharField()
    answer = serializers.CharField()


class AnnouncementSerializer(serializers.Serializer):
    """
    Serializer for announcement data
    GET /api/admin/dashboard/announcements
    """
    title = serializers.CharField()
    validity = serializers.CharField()
    description = serializers.CharField()
    type = serializers.CharField()
    target_audience = serializers.CharField()

