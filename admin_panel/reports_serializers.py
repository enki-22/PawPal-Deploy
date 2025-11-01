"""
Reports Serializers (Chunk 5)
Serializers for admin reports endpoints
"""
from rest_framework import serializers


class ReportSummarySerializer(serializers.Serializer):
    """
    Serializer for report summary in list view
    GET /api/admin/reports
    """
    case_id = serializers.CharField()
    pet_name = serializers.CharField()
    species = serializers.CharField()
    breed = serializers.CharField()
    owner_name = serializers.CharField()
    date_generated = serializers.DateTimeField()
    flag_level = serializers.CharField()


class PaginationSerializer(serializers.Serializer):
    """
    Serializer for pagination information
    """
    page = serializers.IntegerField()
    limit = serializers.IntegerField()
    total = serializers.IntegerField()
    totalPages = serializers.IntegerField()
    hasNext = serializers.BooleanField()
    hasPrev = serializers.BooleanField()


class AppliedFiltersSerializer(serializers.Serializer):
    """
    Serializer for applied filters
    """
    search = serializers.CharField(allow_null=True)
    dateRange = serializers.CharField()
    species = serializers.CharField()
    flagLevel = serializers.CharField()
    custom_start = serializers.CharField(allow_null=True, required=False)
    custom_end = serializers.CharField(allow_null=True, required=False)


class ReportsListSerializer(serializers.Serializer):
    """
    Serializer for reports list response
    GET /api/admin/reports
    """
    success = serializers.BooleanField()
    results = ReportSummarySerializer(many=True)
    pagination = PaginationSerializer()
    filters = AppliedFiltersSerializer()


class PetInfoSerializer(serializers.Serializer):
    """
    Serializer for pet information in detailed report
    """
    id = serializers.IntegerField()
    name = serializers.CharField()
    species = serializers.CharField()
    breed = serializers.CharField()
    age = serializers.IntegerField()
    sex = serializers.CharField()
    weight = serializers.FloatField(allow_null=True)
    image = serializers.URLField(allow_null=True)
    medical_notes = serializers.CharField(allow_null=True, allow_blank=True)


class OwnerInfoSerializer(serializers.Serializer):
    """
    Serializer for owner information in detailed report
    """
    id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField()
    username = serializers.CharField()


class DetailedReportSerializer(serializers.Serializer):
    """
    Serializer for detailed SOAP report
    GET /api/admin/reports/:caseId
    """
    case_id = serializers.CharField()
    pet_info = PetInfoSerializer()
    owner_info = OwnerInfoSerializer()
    subjective = serializers.CharField()
    objective = serializers.JSONField()
    assessment = serializers.JSONField()
    plan = serializers.JSONField()
    flag_level = serializers.CharField()
    date_generated = serializers.DateTimeField()
    date_flagged = serializers.DateTimeField(allow_null=True)


class TopDiagnosisSerializer(serializers.Serializer):
    """
    Serializer for top diagnosis information
    """
    condition = serializers.CharField()
    likelihood = serializers.FloatField()
    urgency = serializers.CharField()
    description = serializers.CharField()


class FlaggedReportPetInfoSerializer(serializers.Serializer):
    """
    Serializer for pet info in flagged reports (simplified)
    """
    name = serializers.CharField()
    species = serializers.CharField()
    breed = serializers.CharField()
    age = serializers.IntegerField()


class FlaggedReportOwnerInfoSerializer(serializers.Serializer):
    """
    Serializer for owner info in flagged reports (simplified)
    """
    name = serializers.CharField()
    email = serializers.EmailField()


class FlaggedReportSerializer(serializers.Serializer):
    """
    Serializer for flagged report
    GET /api/admin/reports/flagged
    """
    case_id = serializers.CharField()
    pet_info = FlaggedReportPetInfoSerializer()
    owner_info = FlaggedReportOwnerInfoSerializer()
    top_diagnosis = TopDiagnosisSerializer(allow_null=True)
    flag_level = serializers.CharField()
    date_flagged = serializers.DateTimeField()
    subjective = serializers.CharField()


class FlaggedReportsListSerializer(serializers.Serializer):
    """
    Serializer for flagged reports list response
    GET /api/admin/reports/flagged
    """
    success = serializers.BooleanField()
    filter = serializers.CharField()
    count = serializers.IntegerField()
    reports = FlaggedReportSerializer(many=True)

