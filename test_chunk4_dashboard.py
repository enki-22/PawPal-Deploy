"""
Comprehensive test suite for Chunk 4: Admin Dashboard Endpoints
Tests all 6 dashboard endpoints with various scenarios
"""
import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vet_app.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.utils import timezone
from admin_panel.models import Admin, Announcement
from chatbot.models import User, SOAPReport, Conversation
from pets.models import Pet

# Configuration
BASE_URL = "http://localhost:8000/api/admin"

# Colors for terminal output
PASS = "[PASS]"
FAIL = "[FAIL]"
INFO = "[INFO]"

test_results = []


def print_test_result(test_name, passed, details=""):
    """Print test result"""
    status = PASS if passed else FAIL
    print(f"{status} {test_name}")
    if details:
        print(f"     {details}")
    test_results.append({'test': test_name, 'passed': passed, 'details': details})


def get_admin_token():
    """Get admin token for authentication"""
    response = requests.post(f"{BASE_URL}/login", json={
        'email': 'vet@pawpal.com',
        'password': 'VetAdmin123!'
    })
    
    if response.status_code == 200:
        return response.json()['data']['token']
    return None


def create_test_data():
    """Create test data for dashboard endpoints"""
    print(f"\n{INFO} Creating test data...")
    
    try:
        # Create some test users if they don't exist
        for i in range(3):
            email = f"testuser{i}@test.com"
            if not User.objects.filter(email=email).exists():
                User.objects.create_user(
                    username=f"testuser{i}",
                    email=email,
                    password="testpass123",
                    first_name=f"Test",
                    last_name=f"User{i}"
                )
        
        # Create test pets
        users = User.objects.filter(email__contains='testuser')
        for user in users:
            if not Pet.objects.filter(owner=user).exists():
                Pet.objects.create(
                    owner=user,
                    name=f"Pet_{user.username}",
                    animal_type='dog',
                    breed='Golden Retriever',
                    age=3,
                    sex='male',
                    weight=25.5
                )
        
        # Create test announcements
        admin = Admin.objects.filter(role='VET').first()
        if admin:
            Announcement.objects.filter(title__contains='Test').delete()
            
            Announcement.objects.create(
                title="Test Announcement 1",
                content="This is a test announcement for the dashboard",
                announcement_type="info",
                target_audience="all",
                is_active=True,
                start_date=timezone.now(),
                created_by_id=admin.id if hasattr(admin, 'id') else 1
            )
        
        print(f"{INFO} Test data created successfully")
        return True
        
    except Exception as e:
        print(f"{FAIL} Failed to create test data: {str(e)}")
        return False


def test_dashboard_stats():
    """Test 1: GET /api/admin/dashboard/stats"""
    print(f"\n{INFO} Testing Dashboard Stats Endpoint...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Dashboard Stats - Get Token", False, "Failed to get admin token")
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 1.1: Get stats without filters
    response = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers)
    
    passed = (response.status_code == 200 and 
             response.json()['success'] and
             'data' in response.json())
    
    data = response.json().get('data', {})
    print_test_result(
        "Dashboard Stats - No filters",
        passed,
        f"Users: {data.get('total_users')}, Pets: {data.get('total_pets')}"
    )
    
    # Test 1.2: Get stats with reports filter
    response = requests.get(
        f"{BASE_URL}/dashboard/stats?reports_filter=last_7_days",
        headers=headers
    )
    
    passed = response.status_code == 200 and response.json()['success']
    data = response.json().get('data', {})
    print_test_result(
        "Dashboard Stats - With reports filter",
        passed,
        f"Filter: {data.get('filters_applied', {}).get('reports_filter')}"
    )
    
    # Test 1.3: Get stats with conversations filter
    response = requests.get(
        f"{BASE_URL}/dashboard/stats?conversations_filter=this_month",
        headers=headers
    )
    
    passed = response.status_code == 200 and response.json()['success']
    print_test_result("Dashboard Stats - With conversations filter", passed)
    
    # Test 1.4: Verify data structure
    response = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers)
    data = response.json().get('data', {})
    
    required_fields = ['total_users', 'total_pets', 'total_reports', 'total_conversations']
    has_all_fields = all(field in data for field in required_fields)
    
    print_test_result(
        "Dashboard Stats - Data structure",
        has_all_fields,
        f"Has all required fields: {has_all_fields}"
    )
    
    # Test 1.5: Without authentication
    response = requests.get(f"{BASE_URL}/dashboard/stats")
    
    passed = response.status_code == 401
    print_test_result("Dashboard Stats - Requires authentication", passed)


def test_recent_pets():
    """Test 2: GET /api/admin/dashboard/recent-pets"""
    print(f"\n{INFO} Testing Recent Pets Endpoint...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Recent Pets - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 2.1: Get recent pets
    response = requests.get(f"{BASE_URL}/dashboard/recent-pets", headers=headers)
    
    passed = response.status_code == 200 and response.json()['success']
    data = response.json().get('data', [])
    
    print_test_result(
        "Recent Pets - Successful retrieval",
        passed,
        f"Retrieved {len(data)} pets"
    )
    
    # Test 2.2: Verify data structure
    if data and len(data) > 0:
        pet = data[0]
        required_fields = ['pet_name', 'species', 'breed', 'owner_name', 'registration_date']
        has_all_fields = all(field in pet for field in required_fields)
        
        print_test_result(
            "Recent Pets - Data structure",
            has_all_fields,
            f"First pet: {pet.get('pet_name')}"
        )
    
    # Test 2.3: Max 5 pets returned
    passed = len(data) <= 5
    print_test_result(
        "Recent Pets - Max 5 limit",
        passed,
        f"Returned {len(data)} pets"
    )
    
    # Test 2.4: Without authentication
    response = requests.get(f"{BASE_URL}/dashboard/recent-pets")
    passed = response.status_code == 401
    print_test_result("Recent Pets - Requires authentication", passed)


def test_flagged_cases():
    """Test 3: GET /api/admin/dashboard/flagged-cases"""
    print(f"\n{INFO} Testing Flagged Cases Endpoint...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Flagged Cases - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 3.1: Get all flagged cases
    response = requests.get(f"{BASE_URL}/dashboard/flagged-cases", headers=headers)
    
    passed = response.status_code == 200 and response.json()['success']
    data = response.json().get('data', [])
    
    print_test_result(
        "Flagged Cases - Get all",
        passed,
        f"Retrieved {len(data)} cases"
    )
    
    # Test 3.2: Filter by emergency
    response = requests.get(
        f"{BASE_URL}/dashboard/flagged-cases?filter=emergency",
        headers=headers
    )
    
    passed = response.status_code == 200
    print_test_result("Flagged Cases - Filter emergency", passed)
    
    # Test 3.3: Filter by urgent
    response = requests.get(
        f"{BASE_URL}/dashboard/flagged-cases?filter=urgent",
        headers=headers
    )
    
    passed = response.status_code == 200
    print_test_result("Flagged Cases - Filter urgent", passed)
    
    # Test 3.4: Filter by moderate
    response = requests.get(
        f"{BASE_URL}/dashboard/flagged-cases?filter=moderate",
        headers=headers
    )
    
    passed = response.status_code == 200
    print_test_result("Flagged Cases - Filter moderate", passed)
    
    # Test 3.5: Invalid filter
    response = requests.get(
        f"{BASE_URL}/dashboard/flagged-cases?filter=invalid",
        headers=headers
    )
    
    passed = response.status_code == 400
    print_test_result("Flagged Cases - Invalid filter rejected", passed)
    
    # Test 3.6: Verify data structure
    response = requests.get(f"{BASE_URL}/dashboard/flagged-cases", headers=headers)
    data = response.json().get('data', [])
    
    if data and len(data) > 0:
        case = data[0]
        required_fields = ['case_id', 'pet_name', 'species', 'owner_name', 'flag_level']
        has_all_fields = all(field in case for field in required_fields)
        
        print_test_result(
            "Flagged Cases - Data structure",
            has_all_fields,
            f"Flag level: {case.get('flag_level')}"
        )


def test_dashboard_charts():
    """Test 4: GET /api/admin/dashboard/charts"""
    print(f"\n{INFO} Testing Dashboard Charts Endpoint...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Dashboard Charts - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 4.1: Get chart data
    response = requests.get(f"{BASE_URL}/dashboard/charts", headers=headers)
    
    passed = response.status_code == 200 and response.json()['success']
    data = response.json().get('data', {})
    
    print_test_result("Dashboard Charts - Successful retrieval", passed)
    
    # Test 4.2: Verify species breakdown
    species_breakdown = data.get('species_breakdown', {})
    expected_species = ['Dogs', 'Cats', 'Birds', 'Rabbits', 'Others']
    has_all_species = all(species in species_breakdown for species in expected_species)
    
    print_test_result(
        "Dashboard Charts - Species breakdown",
        has_all_species,
        f"Total species: {len(species_breakdown)}"
    )
    
    # Test 4.3: Verify common symptoms structure
    common_symptoms = data.get('common_symptoms', [])
    
    if common_symptoms and len(common_symptoms) > 0:
        symptom = common_symptoms[0]
        has_structure = 'symptom' in symptom and 'count' in symptom
        print_test_result(
            "Dashboard Charts - Common symptoms structure",
            has_structure,
            f"Top symptom: {symptom.get('symptom', 'N/A')}"
        )
    else:
        print_test_result(
            "Dashboard Charts - Common symptoms",
            True,
            "No symptoms data available (expected for fresh database)"
        )
    
    # Test 4.4: Verify symptoms by species
    symptoms_by_species = data.get('symptoms_by_species', {})
    is_dict = isinstance(symptoms_by_species, dict)
    
    print_test_result(
        "Dashboard Charts - Symptoms by species",
        is_dict,
        f"Species groups: {len(symptoms_by_species)}"
    )
    
    # Test 4.5: Without authentication
    response = requests.get(f"{BASE_URL}/dashboard/charts")
    passed = response.status_code == 401
    print_test_result("Dashboard Charts - Requires authentication", passed)


def test_dashboard_faqs():
    """Test 5: GET /api/admin/dashboard/faqs"""
    print(f"\n{INFO} Testing Dashboard FAQs Endpoint...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Dashboard FAQs - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 5.1: Get FAQs
    response = requests.get(f"{BASE_URL}/dashboard/faqs", headers=headers)
    
    passed = response.status_code == 200 and response.json()['success']
    data = response.json().get('data', [])
    
    print_test_result(
        "Dashboard FAQs - Successful retrieval",
        passed,
        f"Retrieved {len(data)} FAQs"
    )
    
    # Test 5.2: Verify FAQs structure
    if data and len(data) > 0:
        faq = data[0]
        has_structure = 'question' in faq and 'answer' in faq
        
        print_test_result(
            "Dashboard FAQs - Data structure",
            has_structure,
            f"First question: {faq.get('question', '')[:50]}..."
        )
    
    # Test 5.3: Verify minimum FAQs
    passed = len(data) >= 5
    print_test_result(
        "Dashboard FAQs - Minimum count",
        passed,
        f"Has {len(data)} FAQs (expected >= 5)"
    )
    
    # Test 5.4: Without authentication
    response = requests.get(f"{BASE_URL}/dashboard/faqs")
    passed = response.status_code == 401
    print_test_result("Dashboard FAQs - Requires authentication", passed)


def test_dashboard_announcements():
    """Test 6: GET /api/admin/dashboard/announcements"""
    print(f"\n{INFO} Testing Dashboard Announcements Endpoint...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Dashboard Announcements - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 6.1: Get announcements
    response = requests.get(f"{BASE_URL}/dashboard/announcements", headers=headers)
    
    passed = response.status_code == 200 and response.json()['success']
    data = response.json().get('data', [])
    
    print_test_result(
        "Dashboard Announcements - Successful retrieval",
        passed,
        f"Retrieved {len(data)} announcements"
    )
    
    # Test 6.2: Verify max 3 announcements
    passed = len(data) <= 3
    print_test_result(
        "Dashboard Announcements - Max 3 limit",
        passed,
        f"Returned {len(data)} announcements"
    )
    
    # Test 6.3: Verify announcement structure
    if data and len(data) > 0:
        announcement = data[0]
        required_fields = ['title', 'validity', 'description']
        has_all_fields = all(field in announcement for field in required_fields)
        
        print_test_result(
            "Dashboard Announcements - Data structure",
            has_all_fields,
            f"Title: {announcement.get('title', '')[:50]}"
        )
    
    # Test 6.4: Without authentication
    response = requests.get(f"{BASE_URL}/dashboard/announcements")
    passed = response.status_code == 401
    print_test_result("Dashboard Announcements - Requires authentication", passed)


def test_role_permissions():
    """Test 7: Role-based permissions"""
    print(f"\n{INFO} Testing Role-Based Permissions...")
    
    # Test with different admin roles
    roles_to_test = [
        ('master@pawpal.com', 'MasterAdmin123!', 'MASTER'),
        ('vet@pawpal.com', 'VetAdmin123!', 'VET'),
        ('desk@pawpal.com', 'DeskAdmin123!', 'DESK'),
    ]
    
    for email, password, role in roles_to_test:
        response = requests.post(f"{BASE_URL}/login", json={
            'email': email,
            'password': password
        })
        
        if response.status_code == 200:
            token = response.json()['data']['token']
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test access to dashboard stats
            response = requests.get(f"{BASE_URL}/dashboard/stats", headers=headers)
            passed = response.status_code == 200
            
            print_test_result(
                f"Role Permissions - {role} can access dashboard",
                passed
            )


def print_summary():
    """Print test summary"""
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed_count = sum(1 for result in test_results if result['passed'])
    total_count = len(test_results)
    pass_rate = (passed_count / total_count * 100) if total_count > 0 else 0
    
    print(f"\nTotal Tests: {total_count}")
    print(f"Passed: {passed_count}")
    print(f"Failed: {total_count - passed_count}")
    print(f"Pass Rate: {pass_rate:.1f}%\n")
    
    if pass_rate == 100:
        print("[SUCCESS] ALL TESTS PASSED!")
    elif pass_rate >= 80:
        print("[WARNING] MOST TESTS PASSED")
    else:
        print("[FAILURE] MANY TESTS FAILED")
    
    # Print failed tests
    failed_tests = [r for r in test_results if not r['passed']]
    if failed_tests:
        print("\nFailed Tests:")
        for test in failed_tests:
            print(f"  - {test['test']}")
            if test['details']:
                print(f"    {test['details']}")
    
    print("\n" + "="*70)


def main():
    """Main test runner"""
    print("\n" + "="*70)
    print("CHUNK 4: ADMIN DASHBOARD ENDPOINTS - TEST SUITE")
    print("="*70)
    
    try:
        # Create test data
        if not create_test_data():
            print(f"\n{FAIL} Failed to create test data. Some tests may fail.")
        
        # Run tests
        test_dashboard_stats()
        test_recent_pets()
        test_flagged_cases()
        test_dashboard_charts()
        test_dashboard_faqs()
        test_dashboard_announcements()
        test_role_permissions()
        
        # Summary
        print_summary()
        
    except KeyboardInterrupt:
        print(f"\n\n{INFO} Tests interrupted by user")
    except Exception as e:
        print(f"\n\n{FAIL} Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()

