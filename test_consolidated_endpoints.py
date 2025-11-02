"""
Test script for consolidated endpoints
Tests that endpoints work correctly for both Pet Owners and Admins
"""
import requests
import json
import sys

# Configuration - UPDATE THESE VALUES
BASE_URL = "http://localhost:8000"
PET_OWNER_TOKEN = None  # Set to pet owner JWT token
ADMIN_TOKEN = None  # Set to admin JWT token

# Test case IDs - UPDATE THESE
TEST_PET_ID = 1
TEST_CASE_ID = "#PDX-2025-1101-001"  # Update with actual case ID
TEST_CONVERSATION_ID = 1

def print_test_result(test_name, passed, details=""):
    """Print formatted test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {test_name}")
    if details:
        print(f"   {details}")

def test_endpoint(test_name, method, url, headers, expected_status=200, expected_keys=None, data=None):
    """Test an endpoint and verify response"""
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        else:
            response = requests.request(method, url, headers=headers, json=data)
        
        passed = response.status_code == expected_status
        details = f"Status: {response.status_code} (Expected: {expected_status})"
        
        if passed and expected_keys:
            try:
                response_data = response.json()
                missing_keys = [key for key in expected_keys if key not in response_data]
                if missing_keys:
                    passed = False
                    details += f" | Missing keys: {missing_keys}"
                else:
                    details += f" | All expected keys present"
            except:
                passed = False
                details += " | Invalid JSON response"
        
        print_test_result(test_name, passed, details)
        return passed
        
    except Exception as e:
        print_test_result(test_name, False, f"Exception: {str(e)}")
        return False

def main():
    """Run all endpoint tests"""
    if not PET_OWNER_TOKEN or not ADMIN_TOKEN:
        print("❌ Error: Please set PET_OWNER_TOKEN and ADMIN_TOKEN in this script")
        print("   Get tokens from:")
        print("   - Pet Owner: POST /api/auth/login")
        print("   - Admin: POST /api/admin/login")
        sys.exit(1)
    
    headers_pet = {"Authorization": f"Bearer {PET_OWNER_TOKEN}"}
    headers_admin = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    
    print("="*70)
    print("TESTING CONSOLIDATED ENDPOINTS")
    print("="*70)
    
    all_passed = True
    
    # 1. SOAP Report by Case ID
    print("\n1. SOAP Report by Case ID")
    print("-" * 70)
    all_passed &= test_endpoint(
        "Pet Owner - Own SOAP Report",
        "GET",
        f"{BASE_URL}/api/diagnosis/soap/{TEST_CASE_ID}",
        headers_pet,
        expected_keys=['success', 'data']
    )
    
    all_passed &= test_endpoint(
        "Admin - Any SOAP Report",
        "GET",
        f"{BASE_URL}/api/diagnosis/soap/{TEST_CASE_ID}",
        headers_admin,
        expected_keys=['success', 'report']
    )
    
    # 2. Get Diagnoses for Pet
    print("\n2. Get Diagnoses for Pet")
    print("-" * 70)
    all_passed &= test_endpoint(
        "Pet Owner - Own Pet Diagnoses",
        "GET",
        f"{BASE_URL}/api/diagnosis/{TEST_PET_ID}",
        headers_pet,
        expected_keys=['success', 'data']
    )
    
    all_passed &= test_endpoint(
        "Admin - Any Pet Diagnoses",
        "GET",
        f"{BASE_URL}/api/diagnosis/{TEST_PET_ID}",
        headers_admin,
        expected_keys=['success', 'diagnoses']
    )
    
    # 3. Flagged Cases
    print("\n3. Flagged Cases")
    print("-" * 70)
    all_passed &= test_endpoint(
        "Pet Owner - Flagged Cases (with pet_id)",
        "GET",
        f"{BASE_URL}/api/diagnosis/flagged/{TEST_PET_ID}",
        headers_pet,
        expected_keys=['success', 'data']
    )
    
    all_passed &= test_endpoint(
        "Pet Owner - Flagged Cases (without pet_id) - Should Fail",
        "GET",
        f"{BASE_URL}/api/diagnosis/flagged",
        headers_pet,
        expected_status=400
    )
    
    all_passed &= test_endpoint(
        "Admin - All Flagged Cases",
        "GET",
        f"{BASE_URL}/api/diagnosis/flagged",
        headers_admin,
        expected_keys=['success', 'reports']
    )
    
    all_passed &= test_endpoint(
        "Admin - Specific Pet Flagged Cases",
        "GET",
        f"{BASE_URL}/api/diagnosis/flagged/{TEST_PET_ID}",
        headers_admin,
        expected_keys=['success', 'reports']
    )
    
    # 4. Reports List
    print("\n4. Reports List")
    print("-" * 70)
    all_passed &= test_endpoint(
        "Pet Owner - Own Reports",
        "GET",
        f"{BASE_URL}/api/diagnosis/reports",
        headers_pet,
        expected_keys=['success', 'results']
    )
    
    all_passed &= test_endpoint(
        "Admin - All Reports",
        "GET",
        f"{BASE_URL}/api/diagnosis/reports?page=1&limit=10",
        headers_admin,
        expected_keys=['success', 'results', 'pagination']
    )
    
    # 5. Pet Listing
    print("\n5. Pet Listing")
    print("-" * 70)
    all_passed &= test_endpoint(
        "Pet Owner - Own Pets",
        "GET",
        f"{BASE_URL}/api/pets/",
        headers_pet,
        expected_status=200
    )
    
    all_passed &= test_endpoint(
        "Admin - All Pets (Simple)",
        "GET",
        f"{BASE_URL}/api/pets/",
        headers_admin,
        expected_status=200
    )
    
    all_passed &= test_endpoint(
        "Admin - All Pets (Paginated)",
        "GET",
        f"{BASE_URL}/api/pets/?species=dogs&page=1&limit=10",
        headers_admin,
        expected_keys=['success', 'results', 'pagination']
    )
    
    # 6. Pet Detail
    print("\n6. Pet Detail")
    print("-" * 70)
    all_passed &= test_endpoint(
        "Pet Owner - Own Pet Detail",
        "GET",
        f"{BASE_URL}/api/pets/{TEST_PET_ID}/",
        headers_pet,
        expected_status=200
    )
    
    all_passed &= test_endpoint(
        "Admin - Any Pet Detail",
        "GET",
        f"{BASE_URL}/api/pets/{TEST_PET_ID}/",
        headers_admin,
        expected_keys=['success', 'pet']
    )
    
    # 7. Conversations List
    print("\n7. Conversations List")
    print("-" * 70)
    all_passed &= test_endpoint(
        "Pet Owner - Own Conversations",
        "GET",
        f"{BASE_URL}/api/chatbot/conversations/",
        headers_pet,
        expected_keys=['conversations']
    )
    
    all_passed &= test_endpoint(
        "Admin - All Conversations",
        "GET",
        f"{BASE_URL}/api/chatbot/conversations/",
        headers_admin,
        expected_status=200
    )
    
    # 8. Conversation Detail
    print("\n8. Conversation Detail")
    print("-" * 70)
    all_passed &= test_endpoint(
        "Pet Owner - Own Conversation",
        "GET",
        f"{BASE_URL}/api/chatbot/conversations/{TEST_CONVERSATION_ID}/",
        headers_pet,
        expected_keys=['conversation', 'messages']
    )
    
    all_passed &= test_endpoint(
        "Admin - Any Conversation",
        "GET",
        f"{BASE_URL}/api/chatbot/conversations/{TEST_CONVERSATION_ID}/",
        headers_admin,
        expected_keys=['success', 'chat']
    )
    
    # Summary
    print("\n" + "="*70)
    if all_passed:
        print("✅ ALL TESTS PASSED")
    else:
        print("❌ SOME TESTS FAILED - Review output above")
    print("="*70)
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

