"""
Comprehensive test suite for Chunk 5: Admin Reports Endpoints
Tests all 3 reports endpoints with advanced filtering and search
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
from admin_panel.models import Admin
from chatbot.models import User, SOAPReport
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


def test_get_reports_basic():
    """Test 1: GET /api/admin/reports - Basic retrieval"""
    print(f"\n{INFO} Testing Get Reports - Basic Retrieval...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Get Reports - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 1.1: Get reports without filters
    response = requests.get(f"{BASE_URL}/reports", headers=headers)
    
    passed = response.status_code == 200 and response.json()['success']
    data = response.json() if passed else {}
    
    print_test_result(
        "Get Reports - Basic retrieval",
        passed,
        f"Retrieved {len(data.get('results', []))} reports"
    )
    
    # Test 1.2: Verify response structure
    if passed:
        has_results = 'results' in data
        has_pagination = 'pagination' in data
        has_filters = 'filters' in data
        
        structure_valid = has_results and has_pagination and has_filters
        print_test_result(
            "Get Reports - Response structure",
            structure_valid,
            f"Has all required fields: {structure_valid}"
        )
    
    # Test 1.3: Verify pagination structure
    if passed and 'pagination' in data:
        pagination = data['pagination']
        required_fields = ['page', 'limit', 'total', 'totalPages', 'hasNext', 'hasPrev']
        has_all_fields = all(field in pagination for field in required_fields)
        
        print_test_result(
            "Get Reports - Pagination structure",
            has_all_fields,
            f"Page {pagination.get('page')}/{pagination.get('totalPages')}"
        )
    
    # Test 1.4: Without authentication
    response = requests.get(f"{BASE_URL}/reports")
    passed = response.status_code == 401
    print_test_result("Get Reports - Requires authentication", passed)


def test_get_reports_with_search():
    """Test 2: GET /api/admin/reports - Search functionality"""
    print(f"\n{INFO} Testing Get Reports - Search...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Get Reports Search - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 2.1: Search by pet name
    response = requests.get(
        f"{BASE_URL}/reports?search=pet",
        headers=headers
    )
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        search_applied = data.get('filters', {}).get('search') == 'pet'
        print_test_result(
            "Get Reports - Search by pet name",
            search_applied,
            f"Results: {len(data.get('results', []))}"
        )
    else:
        print_test_result("Get Reports - Search by pet name", False)
    
    # Test 2.2: Search by case ID
    # Get a case ID first
    response = requests.get(f"{BASE_URL}/reports?limit=1", headers=headers)
    if response.status_code == 200 and response.json().get('results'):
        case_id = response.json()['results'][0]['case_id']
        
        response = requests.get(
            f"{BASE_URL}/reports?search={case_id}",
            headers=headers
        )
        
        passed = response.status_code == 200
        if passed:
            results = response.json().get('results', [])
            found_case = any(r['case_id'] == case_id for r in results)
            print_test_result(
                "Get Reports - Search by case ID",
                found_case,
                f"Found case: {found_case}"
            )
    
    # Test 2.3: Empty search (should return all)
    response = requests.get(
        f"{BASE_URL}/reports?search=",
        headers=headers
    )
    
    passed = response.status_code == 200
    print_test_result("Get Reports - Empty search", passed)


def test_get_reports_with_filters():
    """Test 3: GET /api/admin/reports - Filtering"""
    print(f"\n{INFO} Testing Get Reports - Filters...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Get Reports Filters - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 3.1: Filter by date range - today
    response = requests.get(
        f"{BASE_URL}/reports?dateRange=today",
        headers=headers
    )
    
    passed = response.status_code == 200
    if passed:
        filters = response.json().get('filters', {})
        print_test_result(
            "Get Reports - Filter by dateRange (today)",
            filters.get('dateRange') == 'today',
            f"DateRange: {filters.get('dateRange')}"
        )
    
    # Test 3.2: Filter by date range - last_7_days
    response = requests.get(
        f"{BASE_URL}/reports?dateRange=last_7_days",
        headers=headers
    )
    
    passed = response.status_code == 200 and response.json().get('success')
    print_test_result("Get Reports - Filter last_7_days", passed)
    
    # Test 3.3: Filter by date range - last_30_days
    response = requests.get(
        f"{BASE_URL}/reports?dateRange=last_30_days",
        headers=headers
    )
    
    passed = response.status_code == 200 and response.json().get('success')
    print_test_result("Get Reports - Filter last_30_days", passed)
    
    # Test 3.4: Filter by species - dogs
    response = requests.get(
        f"{BASE_URL}/reports?species=dogs",
        headers=headers
    )
    
    passed = response.status_code == 200
    if passed:
        filters = response.json().get('filters', {})
        print_test_result(
            "Get Reports - Filter by species (dogs)",
            filters.get('species') == 'dogs'
        )
    
    # Test 3.5: Filter by species - cats
    response = requests.get(
        f"{BASE_URL}/reports?species=cats",
        headers=headers
    )
    
    passed = response.status_code == 200 and response.json().get('success')
    print_test_result("Get Reports - Filter by species (cats)", passed)
    
    # Test 3.6: Filter by flag level - emergency
    response = requests.get(
        f"{BASE_URL}/reports?flagLevel=emergency",
        headers=headers
    )
    
    passed = response.status_code == 200
    if passed:
        filters = response.json().get('filters', {})
        print_test_result(
            "Get Reports - Filter by flagLevel (emergency)",
            filters.get('flagLevel') == 'emergency'
        )
    
    # Test 3.7: Filter by flag level - urgent
    response = requests.get(
        f"{BASE_URL}/reports?flagLevel=urgent",
        headers=headers
    )
    
    passed = response.status_code == 200 and response.json().get('success')
    print_test_result("Get Reports - Filter by flagLevel (urgent)", passed)
    
    # Test 3.8: Combined filters
    response = requests.get(
        f"{BASE_URL}/reports?dateRange=last_30_days&species=dogs&flagLevel=urgent",
        headers=headers
    )
    
    passed = response.status_code == 200
    if passed:
        filters = response.json().get('filters', {})
        all_applied = (
            filters.get('dateRange') == 'last_30_days' and
            filters.get('species') == 'dogs' and
            filters.get('flagLevel') == 'urgent'
        )
        print_test_result(
            "Get Reports - Combined filters",
            all_applied,
            "All filters applied correctly"
        )


def test_get_reports_pagination():
    """Test 4: GET /api/admin/reports - Pagination"""
    print(f"\n{INFO} Testing Get Reports - Pagination...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Get Reports Pagination - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 4.1: Default pagination (page 1, limit 10)
    response = requests.get(f"{BASE_URL}/reports", headers=headers)
    
    passed = response.status_code == 200
    if passed:
        pagination = response.json().get('pagination', {})
        default_values = pagination.get('page') == 1 and pagination.get('limit') == 10
        print_test_result(
            "Get Reports - Default pagination",
            default_values,
            f"Page {pagination.get('page')}, Limit {pagination.get('limit')}"
        )
    
    # Test 4.2: Custom page and limit
    response = requests.get(
        f"{BASE_URL}/reports?page=2&limit=5",
        headers=headers
    )
    
    passed = response.status_code == 200
    if passed:
        pagination = response.json().get('pagination', {})
        custom_values = pagination.get('page') == 2 and pagination.get('limit') == 5
        print_test_result(
            "Get Reports - Custom pagination",
            custom_values,
            f"Page {pagination.get('page')}, Limit {pagination.get('limit')}"
        )
    
    # Test 4.3: Max limit enforcement (100)
    response = requests.get(
        f"{BASE_URL}/reports?limit=200",
        headers=headers
    )
    
    passed = response.status_code == 200
    if passed:
        pagination = response.json().get('pagination', {})
        limited = pagination.get('limit') <= 100
        print_test_result(
            "Get Reports - Max limit enforcement",
            limited,
            f"Limit capped at {pagination.get('limit')}"
        )
    
    # Test 4.4: Invalid page number (should default to 1)
    response = requests.get(
        f"{BASE_URL}/reports?page=0",
        headers=headers
    )
    
    passed = response.status_code == 200
    if passed:
        pagination = response.json().get('pagination', {})
        corrected = pagination.get('page') >= 1
        print_test_result(
            "Get Reports - Invalid page correction",
            corrected,
            f"Page corrected to {pagination.get('page')}"
        )


def test_get_reports_validation():
    """Test 5: GET /api/admin/reports - Parameter validation"""
    print(f"\n{INFO} Testing Get Reports - Validation...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Get Reports Validation - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 5.1: Invalid dateRange
    response = requests.get(
        f"{BASE_URL}/reports?dateRange=invalid",
        headers=headers
    )
    
    passed = response.status_code == 400
    print_test_result("Get Reports - Invalid dateRange rejected", passed)
    
    # Test 5.2: Invalid species
    response = requests.get(
        f"{BASE_URL}/reports?species=invalid",
        headers=headers
    )
    
    passed = response.status_code == 400
    print_test_result("Get Reports - Invalid species rejected", passed)
    
    # Test 5.3: Invalid flagLevel
    response = requests.get(
        f"{BASE_URL}/reports?flagLevel=invalid",
        headers=headers
    )
    
    passed = response.status_code == 400
    print_test_result("Get Reports - Invalid flagLevel rejected", passed)


def test_get_report_by_case_id():
    """Test 6: GET /api/admin/reports/:caseId"""
    print(f"\n{INFO} Testing Get Report by Case ID...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Get Report by ID - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Get a case ID first
    response = requests.get(f"{BASE_URL}/reports?limit=1", headers=headers)
    
    if response.status_code != 200 or not response.json().get('results'):
        print_test_result("Get Report by ID - No reports available", False, "Cannot test without reports")
        return
    
    case_id = response.json()['results'][0]['case_id']
    
    # Test 6.1: Get report by valid case ID
    response = requests.get(f"{BASE_URL}/reports/{case_id}", headers=headers)
    
    passed = response.status_code == 200 and response.json().get('success')
    if passed:
        report = response.json().get('report', {})
        print_test_result(
            "Get Report by ID - Valid case ID",
            report.get('case_id') == case_id,
            f"Retrieved: {case_id}"
        )
    else:
        print_test_result("Get Report by ID - Valid case ID", False)
    
    # Test 6.2: Verify complete report structure
    if passed:
        required_fields = ['case_id', 'pet_info', 'owner_info', 'subjective', 
                          'objective', 'assessment', 'plan', 'flag_level']
        has_all = all(field in report for field in required_fields)
        
        print_test_result(
            "Get Report by ID - Complete structure",
            has_all,
            f"Has all SOAP sections: {has_all}"
        )
    
    # Test 6.3: Verify pet_info structure
    if passed and 'pet_info' in report:
        pet_info = report['pet_info']
        pet_fields = ['id', 'name', 'species', 'breed', 'age', 'sex']
        has_pet_fields = all(field in pet_info for field in pet_fields)
        
        print_test_result(
            "Get Report by ID - Pet info structure",
            has_pet_fields,
            f"Pet: {pet_info.get('name')}"
        )
    
    # Test 6.4: Verify owner_info structure
    if passed and 'owner_info' in report:
        owner_info = report['owner_info']
        owner_fields = ['id', 'name', 'email']
        has_owner_fields = all(field in owner_info for field in owner_fields)
        
        print_test_result(
            "Get Report by ID - Owner info structure",
            has_owner_fields,
            f"Owner: {owner_info.get('name')}"
        )
    
    # Test 6.5: Non-existent case ID
    response = requests.get(
        f"{BASE_URL}/reports/#PDX-9999-9999-999",
        headers=headers
    )
    
    passed = response.status_code == 404
    print_test_result("Get Report by ID - Non-existent ID returns 404", passed)
    
    # Test 6.6: Without authentication
    response = requests.get(f"{BASE_URL}/reports/{case_id}")
    passed = response.status_code == 401
    print_test_result("Get Report by ID - Requires authentication", passed)


def test_get_flagged_reports():
    """Test 7: GET /api/admin/reports/flagged"""
    print(f"\n{INFO} Testing Get Flagged Reports...")
    
    token = get_admin_token()
    if not token:
        print_test_result("Get Flagged Reports - Get Token", False)
        return
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test 7.1: Get all flagged reports
    response = requests.get(f"{BASE_URL}/reports/flagged", headers=headers)
    
    passed = response.status_code == 200 and response.json().get('success')
    data = response.json() if passed else {}
    
    print_test_result(
        "Get Flagged Reports - All reports",
        passed,
        f"Retrieved {data.get('count', 0)} reports"
    )
    
    # Test 7.2: Filter by emergency
    response = requests.get(
        f"{BASE_URL}/reports/flagged?filter=emergency",
        headers=headers
    )
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        filter_applied = data.get('filter') == 'emergency'
        print_test_result(
            "Get Flagged Reports - Emergency filter",
            filter_applied,
            f"Count: {data.get('count')}"
        )
    
    # Test 7.3: Filter by urgent
    response = requests.get(
        f"{BASE_URL}/reports/flagged?filter=urgent",
        headers=headers
    )
    
    passed = response.status_code == 200 and response.json().get('success')
    print_test_result("Get Flagged Reports - Urgent filter", passed)
    
    # Test 7.4: Filter by moderate
    response = requests.get(
        f"{BASE_URL}/reports/flagged?filter=moderate",
        headers=headers
    )
    
    passed = response.status_code == 200 and response.json().get('success')
    print_test_result("Get Flagged Reports - Moderate filter", passed)
    
    # Test 7.5: Invalid filter
    response = requests.get(
        f"{BASE_URL}/reports/flagged?filter=invalid",
        headers=headers
    )
    
    passed = response.status_code == 400
    print_test_result("Get Flagged Reports - Invalid filter rejected", passed)
    
    # Test 7.6: Verify report structure
    response = requests.get(f"{BASE_URL}/reports/flagged", headers=headers)
    if response.status_code == 200:
        reports = response.json().get('reports', [])
        if reports:
            report = reports[0]
            required_fields = ['case_id', 'pet_info', 'owner_info', 'flag_level', 'date_flagged']
            has_all = all(field in report for field in required_fields)
            
            print_test_result(
                "Get Flagged Reports - Report structure",
                has_all,
                f"Case: {report.get('case_id')}"
            )
    
    # Test 7.7: Without authentication
    response = requests.get(f"{BASE_URL}/reports/flagged")
    passed = response.status_code == 401
    print_test_result("Get Flagged Reports - Requires authentication", passed)


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
    print("CHUNK 5: ADMIN REPORTS ENDPOINTS - TEST SUITE")
    print("="*70)
    
    try:
        # Run tests
        test_get_reports_basic()
        test_get_reports_with_search()
        test_get_reports_with_filters()
        test_get_reports_pagination()
        test_get_reports_validation()
        test_get_report_by_case_id()
        test_get_flagged_reports()
        
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

