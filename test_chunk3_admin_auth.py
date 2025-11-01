"""
Comprehensive test suite for Chunk 3: Admin Authentication Endpoints
Tests all 5 admin authentication endpoints with various scenarios
"""
import os
import sys
import django
import requests
import json
from datetime import datetime

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vet_app.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from admin_panel.models import Admin, AdminPasswordHistory
from admin_panel.jwt_utils import generate_admin_jwt, verify_admin_jwt
from users.models import OTP

# Configuration
BASE_URL = "http://localhost:8000/api/admin"
TEST_ADMIN_EMAIL = "testadmin@pawpal.com"
TEST_ADMIN_PASSWORD = "TestAdmin123!"
TEST_ADMIN_NEW_PASSWORD = "NewPassword456@"

# Colors for terminal output
PASS = "\033[92m[PASS]\033[0m"
FAIL = "\033[91m[FAIL]\033[0m"
INFO = "\033[94m[INFO]\033[0m"

test_results = []


def print_test_result(test_name, passed, details=""):
    """Print test result with color"""
    status = PASS if passed else FAIL
    print(f"{status} {test_name}")
    if details:
        print(f"     {details}")
    test_results.append({'test': test_name, 'passed': passed, 'details': details})


def create_test_admins():
    """Create test admin accounts for all roles"""
    print(f"\n{INFO} Creating test admin accounts...")
    
    # Clear existing test admins
    Admin.objects.filter(email__contains='testadmin').delete()
    
    # Create MASTER admin
    master_admin = Admin.objects.create(
        email="testmaster@pawpal.com",
        password="MasterPass123!",
        name="Test Master Admin",
        role="MASTER",
        contact_number="1234567890",
        is_active=True
    )
    
    # Create VET admin
    vet_admin = Admin.objects.create(
        email="testvet@pawpal.com",
        password="VetPass123!",
        name="Test Vet Admin",
        role="VET",
        contact_number="1234567891",
        is_active=True
    )
    
    # Create DESK admin
    desk_admin = Admin.objects.create(
        email="testdesk@pawpal.com",
        password="DeskPass123!",
        name="Test Desk Admin",
        role="DESK",
        contact_number="1234567892",
        is_active=True
    )
    
    # Create inactive admin
    inactive_admin = Admin.objects.create(
        email="testinactive@pawpal.com",
        password="InactivePass123!",
        name="Test Inactive Admin",
        role="DESK",
        contact_number="1234567893",
        is_active=False
    )
    
    print(f"{INFO} Created test admins: MASTER, VET, DESK, INACTIVE")
    return {
        'master': master_admin,
        'vet': vet_admin,
        'desk': desk_admin,
        'inactive': inactive_admin
    }


def test_admin_login():
    """Test 1: POST /api/admin/login"""
    print(f"\n{INFO} Testing Admin Login Endpoint...")
    
    # Test 1.1: Successful login with valid credentials
    response = requests.post(f"{BASE_URL}/login", json={
        'email': 'testvet@pawpal.com',
        'password': 'VetPass123!'
    })
    
    passed = (response.status_code == 200 and 
             response.json()['success'] and 
             'token' in response.json()['data'])
    
    token = response.json()['data'].get('token') if passed else None
    admin_info = response.json()['data'].get('admin_info') if passed else None
    
    print_test_result(
        "Admin Login - Valid credentials",
        passed,
        f"Token: {token[:20]}..." if token else "No token received"
    )
    
    # Test 1.2: Verify admin_info structure
    if admin_info:
        has_required_fields = all(k in admin_info for k in ['id', 'name', 'email', 'role'])
        print_test_result(
            "Admin Login - Response contains admin_info",
            has_required_fields,
            f"Role: {admin_info.get('role')}"
        )
    
    # Test 1.3: Invalid credentials
    response = requests.post(f"{BASE_URL}/login", json={
        'email': 'testvet@pawpal.com',
        'password': 'WrongPassword!'
    })
    
    passed = response.status_code == 400 and not response.json()['success']
    print_test_result("Admin Login - Invalid credentials rejected", passed)
    
    # Test 1.4: Inactive admin cannot login
    response = requests.post(f"{BASE_URL}/login", json={
        'email': 'testinactive@pawpal.com',
        'password': 'InactivePass123!'
    })
    
    passed = response.status_code == 400 and not response.json()['success']
    print_test_result("Admin Login - Inactive admin rejected", passed)
    
    # Test 1.5: Missing fields
    response = requests.post(f"{BASE_URL}/login", json={
        'email': 'testvet@pawpal.com'
    })
    
    passed = response.status_code == 400
    print_test_result("Admin Login - Missing password rejected", passed)
    
    return token


def test_verify_token(token):
    """Test 2: POST /api/admin/verify-token"""
    print(f"\n{INFO} Testing Token Verification Endpoint...")
    
    # Test 2.1: Valid token in Authorization header
    response = requests.post(
        f"{BASE_URL}/verify-token",
        headers={'Authorization': f'Bearer {token}'}
    )
    
    passed = (response.status_code == 200 and 
             response.json()['success'] and 
             response.json()['valid'])
    
    admin_info = response.json().get('admin_info') if passed else None
    print_test_result(
        "Token Verification - Valid token",
        passed,
        f"Admin: {admin_info.get('name')}" if admin_info else ""
    )
    
    # Test 2.2: Valid token in request body
    response = requests.post(f"{BASE_URL}/verify-token", json={
        'token': token
    })
    
    passed = response.status_code == 200 and response.json()['valid']
    print_test_result("Token Verification - Token in body", passed)
    
    # Test 2.3: Invalid token
    response = requests.post(f"{BASE_URL}/verify-token", json={
        'token': 'invalid.token.here'
    })
    
    passed = not response.json().get('valid')
    print_test_result("Token Verification - Invalid token rejected", passed)
    
    # Test 2.4: Missing token
    response = requests.post(f"{BASE_URL}/verify-token", json={})
    
    passed = response.status_code == 400
    print_test_result("Token Verification - Missing token rejected", passed)


def test_admin_logout(token):
    """Test 3: POST /api/admin/logout"""
    print(f"\n{INFO} Testing Admin Logout Endpoint...")
    
    # Test 3.1: Successful logout with valid token
    response = requests.post(
        f"{BASE_URL}/logout",
        headers={'Authorization': f'Bearer {token}'}
    )
    
    passed = response.status_code == 200 and response.json()['success']
    print_test_result("Admin Logout - Successful logout", passed)
    
    # Test 3.2: Logout without token
    response = requests.post(f"{BASE_URL}/logout")
    
    passed = response.status_code in [401, 403]
    print_test_result("Admin Logout - Requires authentication", passed)


def test_change_password():
    """Test 4: POST /api/admin/change-password"""
    print(f"\n{INFO} Testing Change Password Endpoint...")
    
    # Login first to get a fresh token
    login_response = requests.post(f"{BASE_URL}/login", json={
        'email': 'testdesk@pawpal.com',
        'password': 'DeskPass123!'
    })
    token = login_response.json()['data']['token']
    
    # Test 4.1: Successful password change
    response = requests.post(
        f"{BASE_URL}/change-password",
        headers={'Authorization': f'Bearer {token}'},
        json={
            'current_password': 'DeskPass123!',
            'new_password': 'NewDeskPass456@',
            'confirm_password': 'NewDeskPass456@'
        }
    )
    
    passed = response.status_code == 200 and response.json()['success']
    print_test_result("Change Password - Successful change", passed)
    
    # Test 4.2: Verify can login with new password
    response = requests.post(f"{BASE_URL}/login", json={
        'email': 'testdesk@pawpal.com',
        'password': 'NewDeskPass456@'
    })
    
    passed = response.status_code == 200 and response.json()['success']
    print_test_result("Change Password - Can login with new password", passed)
    
    # Get new token after password change
    new_token = response.json()['data']['token'] if passed else token
    
    # Test 4.3: Wrong current password
    response = requests.post(
        f"{BASE_URL}/change-password",
        headers={'Authorization': f'Bearer {new_token}'},
        json={
            'current_password': 'WrongPassword!',
            'new_password': 'AnotherPass789#',
            'confirm_password': 'AnotherPass789#'
        }
    )
    
    passed = response.status_code == 400 and not response.json()['success']
    print_test_result("Change Password - Wrong current password rejected", passed)
    
    # Test 4.4: Password doesn't meet requirements
    response = requests.post(
        f"{BASE_URL}/change-password",
        headers={'Authorization': f'Bearer {new_token}'},
        json={
            'current_password': 'NewDeskPass456@',
            'new_password': 'weak',
            'confirm_password': 'weak'
        }
    )
    
    passed = response.status_code == 400
    print_test_result("Change Password - Weak password rejected", passed)
    
    # Test 4.5: Passwords don't match
    response = requests.post(
        f"{BASE_URL}/change-password",
        headers={'Authorization': f'Bearer {new_token}'},
        json={
            'current_password': 'NewDeskPass456@',
            'new_password': 'StrongPass123!',
            'confirm_password': 'DifferentPass123!'
        }
    )
    
    passed = response.status_code == 400
    print_test_result("Change Password - Mismatched passwords rejected", passed)
    
    # Test 4.6: Test password history (reuse detection)
    # Change password again
    response = requests.post(
        f"{BASE_URL}/change-password",
        headers={'Authorization': f'Bearer {new_token}'},
        json={
            'current_password': 'NewDeskPass456@',
            'new_password': 'AnotherPass789#',
            'confirm_password': 'AnotherPass789#'
        }
    )
    
    if response.status_code == 200:
        # Get new token
        login_response = requests.post(f"{BASE_URL}/login", json={
            'email': 'testdesk@pawpal.com',
            'password': 'AnotherPass789#'
        })
        newer_token = login_response.json()['data']['token']
        
        # Try to reuse previous password
        response = requests.post(
            f"{BASE_URL}/change-password",
            headers={'Authorization': f'Bearer {newer_token}'},
            json={
                'current_password': 'AnotherPass789#',
                'new_password': 'NewDeskPass456@',  # Reusing previous password
                'confirm_password': 'NewDeskPass456@'
            }
        )
        
        passed = response.status_code == 400 and 'PASSWORD_REUSE' in response.json().get('code', '')
        print_test_result("Change Password - Password reuse prevented", passed)


def test_request_password_reset():
    """Test 5: POST /api/admin/request-password-reset"""
    print(f"\n{INFO} Testing Request Password Reset Endpoint...")
    
    # Test 5.1: Successful reset request for VET role
    response = requests.post(f"{BASE_URL}/request-password-reset", json={
        'email': 'testvet@pawpal.com'
    })
    
    passed = response.status_code == 200 and response.json()['success']
    print_test_result("Password Reset Request - VET role allowed", passed)
    
    # Verify OTP was created
    if passed:
        otp_exists = OTP.objects.filter(
            email='testvet@pawpal.com',
            purpose='admin_password_reset'
        ).exists()
        print_test_result("Password Reset Request - OTP created", otp_exists)
    
    # Test 5.2: Successful reset request for DESK role
    response = requests.post(f"{BASE_URL}/request-password-reset", json={
        'email': 'testdesk@pawpal.com'
    })
    
    passed = response.status_code == 200
    print_test_result("Password Reset Request - DESK role allowed", passed)
    
    # Test 5.3: MASTER role denied
    response = requests.post(f"{BASE_URL}/request-password-reset", json={
        'email': 'testmaster@pawpal.com'
    })
    
    passed = response.status_code == 403 and 'MASTER_RESET_DENIED' in response.json().get('code', '')
    print_test_result("Password Reset Request - MASTER role denied", passed)
    
    # Test 5.4: Non-existent email returns generic success (security)
    response = requests.post(f"{BASE_URL}/request-password-reset", json={
        'email': 'nonexistent@pawpal.com'
    })
    
    passed = response.status_code == 200  # Generic success for security
    print_test_result("Password Reset Request - Non-existent email (security)", passed)
    
    # Test 5.5: Invalid email format
    response = requests.post(f"{BASE_URL}/request-password-reset", json={
        'email': 'not-an-email'
    })
    
    passed = response.status_code == 400
    print_test_result("Password Reset Request - Invalid email rejected", passed)


def test_jwt_utilities():
    """Test JWT utility functions"""
    print(f"\n{INFO} Testing JWT Utility Functions...")
    
    # Get a test admin
    admin = Admin.objects.get(email='testvet@pawpal.com')
    
    # Test 6.1: Token generation
    token = generate_admin_jwt(admin)
    passed = isinstance(token, str) and len(token) > 20
    print_test_result("JWT Utilities - Token generation", passed)
    
    # Test 6.2: Token verification
    payload, error = verify_admin_jwt(token)
    passed = payload is not None and error is None
    print_test_result("JWT Utilities - Token verification", passed)
    
    # Test 6.3: Token payload contains correct info
    if payload:
        has_required = all(k in payload for k in ['admin_id', 'email', 'role', 'name'])
        passed = has_required and payload['email'] == admin.email
        print_test_result(
            "JWT Utilities - Token payload correct",
            passed,
            f"Role: {payload.get('role')}"
        )
    
    # Test 6.4: 8-hour expiration
    if payload:
        exp = payload.get('exp')
        iat = payload.get('iat')
        hours_valid = (exp - iat) / 3600
        passed = 7.9 <= hours_valid <= 8.1  # Allow small variance
        print_test_result(
            "JWT Utilities - 8-hour expiration",
            passed,
            f"Valid for {hours_valid:.1f} hours"
        )


def test_password_history():
    """Test password history functionality"""
    print(f"\n{INFO} Testing Password History...")
    
    admin = Admin.objects.get(email='testmaster@pawpal.com')
    
    # Test 7.1: Add password to history
    AdminPasswordHistory.add_password_to_history(admin, admin.password)
    history_count = AdminPasswordHistory.objects.filter(admin=admin).count()
    passed = history_count >= 1
    print_test_result("Password History - Add to history", passed)
    
    # Test 7.2: Check password in history
    is_in_history = AdminPasswordHistory.is_password_in_history(admin, 'MasterPass123!')
    print_test_result("Password History - Detect password reuse", is_in_history)
    
    # Test 7.3: Add multiple passwords and verify only last 3 kept
    for i in range(5):
        AdminPasswordHistory.add_password_to_history(
            admin,
            f"TestPassword{i}!"
        )
    
    final_count = AdminPasswordHistory.objects.filter(admin=admin).count()
    passed = final_count == 3  # Should keep only last 3
    print_test_result(
        "Password History - Keep only last 3",
        passed,
        f"Count: {final_count}"
    )


def test_role_based_access():
    """Test role-based access control"""
    print(f"\n{INFO} Testing Role-Based Access Control...")
    
    # Get tokens for different roles
    master_response = requests.post(f"{BASE_URL}/login", json={
        'email': 'testmaster@pawpal.com',
        'password': 'MasterPass123!'
    })
    master_token = master_response.json()['data']['token']
    
    vet_response = requests.post(f"{BASE_URL}/login", json={
        'email': 'testvet@pawpal.com',
        'password': 'VetPass123!'
    })
    vet_token = vet_response.json()['data']['token']
    
    # Test 8.1: Verify MASTER token has correct role
    payload, _ = verify_admin_jwt(master_token)
    passed = payload and payload.get('role') == 'MASTER'
    print_test_result("Role Access - MASTER role in token", passed)
    
    # Test 8.2: Verify VET token has correct role
    payload, _ = verify_admin_jwt(vet_token)
    passed = payload and payload.get('role') == 'VET'
    print_test_result("Role Access - VET role in token", passed)
    
    # Test 8.3: Verify DESK token has correct role
    desk_response = requests.post(f"{BASE_URL}/login", json={
        'email': 'testdesk@pawpal.com',
        'password': 'AnotherPass789#'  # We changed this earlier
    })
    
    if desk_response.status_code == 200:
        desk_token = desk_response.json()['data']['token']
        payload, _ = verify_admin_jwt(desk_token)
        passed = payload and payload.get('role') == 'DESK'
        print_test_result("Role Access - DESK role in token", passed)


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
        print(f"\033[92m✓ ALL TESTS PASSED!\033[0m")
    elif pass_rate >= 80:
        print(f"\033[93m⚠ MOST TESTS PASSED\033[0m")
    else:
        print(f"\033[91m✗ MANY TESTS FAILED\033[0m")
    
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
    print("CHUNK 3: ADMIN AUTHENTICATION ENDPOINTS - TEST SUITE")
    print("="*70)
    
    try:
        # Setup
        admins = create_test_admins()
        
        # Run tests
        token = test_admin_login()
        if token:
            test_verify_token(token)
            test_admin_logout(token)
        
        test_change_password()
        test_request_password_reset()
        test_jwt_utilities()
        test_password_history()
        test_role_based_access()
        
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

