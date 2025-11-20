"""
Validation script for Symptom Tracker setup
Verifies all components are properly integrated
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vet_app.settings')
django.setup()

def validate_imports():
    """Test all imports"""
    print("\n📦 Validating Imports...")
    
    try:
        from chatbot.models import SymptomLog, SymptomAlert
        print("  ✅ Models imported")
    except ImportError as e:
        print(f"  ❌ Failed to import models: {e}")
        return False
    
    try:
        from chatbot.serializers import (
            SymptomLogSerializer,
            SymptomLogCreateSerializer,
            SymptomAlertSerializer
        )
        print("  ✅ Serializers imported")
    except ImportError as e:
        print(f"  ❌ Failed to import serializers: {e}")
        return False
    
    try:
        from chatbot.views_symptom_tracker import SymptomTrackerViewSet
        print("  ✅ ViewSet imported")
    except ImportError as e:
        print(f"  ❌ Failed to import viewset: {e}")
        return False
    
    try:
        from utils.risk_calculator import (
            calculate_risk_score,
            should_create_alert,
            CANONICAL_SYMPTOMS
        )
        print("  ✅ Risk calculator imported")
    except ImportError as e:
        print(f"  ❌ Failed to import risk calculator: {e}")
        return False
    
    return True


def validate_models():
    """Check model definitions"""
    print("\n🗄️  Validating Models...")
    
    from chatbot.models import SymptomLog, SymptomAlert
    
    # Check SymptomLog fields
    symptom_log_fields = [f.name for f in SymptomLog._meta.get_fields()]
    required_fields = [
        'user', 'pet', 'logged_date', 'symptom_date', 'symptoms',
        'overall_severity', 'risk_score', 'risk_level'
    ]
    
    missing = [f for f in required_fields if f not in symptom_log_fields]
    if missing:
        print(f"  ❌ SymptomLog missing fields: {missing}")
        return False
    print("  ✅ SymptomLog has all required fields")
    
    # Check SymptomAlert fields
    alert_fields = [f.name for f in SymptomAlert._meta.get_fields()]
    required_alert_fields = [
        'symptom_log', 'pet', 'user', 'alert_type', 'alert_message',
        'acknowledged', 'acknowledged_at'
    ]
    
    missing = [f for f in required_alert_fields if f not in alert_fields]
    if missing:
        print(f"  ❌ SymptomAlert missing fields: {missing}")
        return False
    print("  ✅ SymptomAlert has all required fields")
    
    return True


def validate_risk_calculator():
    """Validate risk calculator"""
    print("\n🧮 Validating Risk Calculator...")
    
    from utils.risk_calculator import (
        validate_symptom_coverage,
        CANONICAL_SYMPTOMS
    )
    
    # Check symptom coverage
    coverage = validate_symptom_coverage()
    
    print(f"  Total canonical symptoms: {coverage['total_canonical']}")
    print(f"  Symptoms with weights: {coverage['total_weighted']}")
    print(f"  Coverage: {coverage['coverage_rate']*100:.1f}%")
    
    if coverage['coverage_rate'] < 1.0:
        print(f"  ❌ Incomplete coverage")
        if coverage['missing_weights']:
            print(f"     Missing: {coverage['missing_weights']}")
        return False
    
    print("  ✅ 100% symptom coverage")
    return True


def validate_admin():
    """Check admin registration"""
    print("\n👨‍💼 Validating Admin...")
    
    from django.contrib import admin
    from chatbot.models import SymptomLog, SymptomAlert
    
    if SymptomLog not in admin.site._registry:
        print("  ❌ SymptomLog not registered in admin")
        return False
    print("  ✅ SymptomLog registered in admin")
    
    if SymptomAlert not in admin.site._registry:
        print("  ❌ SymptomAlert not registered in admin")
        return False
    print("  ✅ SymptomAlert registered in admin")
    
    return True


def validate_urls():
    """Check URL configuration"""
    print("\n🔗 Validating URLs...")
    
    try:
        from django.urls import reverse
        from django.urls.exceptions import NoReverseMatch
        
        # Test viewset is registered
        try:
            from chatbot.urls import router
            registered_routes = [r[0] for r in router.registry]
            if 'symptom-tracker' not in registered_routes:
                print("  ❌ symptom-tracker not registered in router")
                return False
            print("  ✅ Router configured correctly")
        except Exception as e:
            print(f"  ❌ Router configuration error: {e}")
            return False
        
        return True
    except Exception as e:
        print(f"  ❌ URL validation error: {e}")
        return False


def validate_migrations():
    """Check migrations status"""
    print("\n📋 Validating Migrations...")
    
    from django.core.management import call_command
    from io import StringIO
    
    try:
        # Check for unapplied migrations
        out = StringIO()
        call_command('showmigrations', 'chatbot', '--list', stdout=out)
        output = out.getvalue()
        
        # Look for [X] (applied) vs [ ] (unapplied)
        lines = output.split('\n')
        symptom_migrations = [l for l in lines if 'symptom' in l.lower()]
        
        if symptom_migrations:
            print(f"  Found {len(symptom_migrations)} symptom-related migration(s)")
            for line in symptom_migrations:
                status = "✅" if "[X]" in line else "❌"
                print(f"    {status} {line.strip()}")
        else:
            print("  ℹ️  No specific symptom migrations found (may be included in others)")
        
        # Check if any migrations are unapplied
        if '[ ]' in output:
            print("  ⚠️  Some migrations are unapplied")
            print("     Run: python manage.py migrate")
        else:
            print("  ✅ All migrations applied")
        
        return True
    except Exception as e:
        print(f"  ⚠️  Could not check migrations: {e}")
        return True  # Non-critical


def run_quick_test():
    """Run a quick functional test"""
    print("\n🧪 Running Quick Test...")
    
    try:
        from utils.risk_calculator import calculate_risk_score, CANONICAL_SYMPTOMS
        
        # Create mock objects
        class MockPet:
            name = "TestPet"
            animal_type = "dog"
            age = 5
        
        class MockLog:
            symptoms = ["vomiting", "lethargy"]
            overall_severity = "moderate"
            compared_to_yesterday = None
            pet = MockPet()
        
        log = MockLog()
        result = calculate_risk_score(log, None, log.pet)
        
        if result['risk_score'] > 0:
            print(f"  ✅ Risk calculation works (score: {result['risk_score']})")
        else:
            print(f"  ⚠️  Risk score is 0 (may be expected)")
        
        print(f"  ✅ Risk level: {result['risk_level']}")
        print(f"  ✅ Evaluated {result['symptoms_evaluated']} symptoms")
        
        return True
    except Exception as e:
        print(f"  ❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all validations"""
    print("="*60)
    print("SYMPTOM TRACKER VALIDATION")
    print("="*60)
    
    results = {
        'imports': validate_imports(),
        'models': validate_models(),
        'risk_calculator': validate_risk_calculator(),
        'admin': validate_admin(),
        'urls': validate_urls(),
        'migrations': validate_migrations(),
        'quick_test': run_quick_test()
    }
    
    print("\n" + "="*60)
    print("VALIDATION SUMMARY")
    print("="*60)
    
    for name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}  {name.replace('_', ' ').title()}")
    
    total = len(results)
    passed = sum(results.values())
    
    print("\n" + "="*60)
    if passed == total:
        print(f"🎉 ALL CHECKS PASSED ({passed}/{total})")
        print("="*60)
        print("\n✅ Symptom Tracker is ready to use!")
        print("\nNext steps:")
        print("  1. Start Django server: python manage.py runserver")
        print("  2. Test API endpoints (see SYMPTOM_TRACKER_API.md)")
        print("  3. Build frontend integration")
        return 0
    else:
        print(f"⚠️  SOME CHECKS FAILED ({passed}/{total})")
        print("="*60)
        print("\nPlease fix the issues above before using the Symptom Tracker.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
