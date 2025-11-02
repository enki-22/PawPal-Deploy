# Testing Guide for Consolidated Endpoints

This document provides test cases for verifying that consolidated endpoints work correctly for both Pet Owners and Admins.

---

## Prerequisites

### Test Users Needed
1. **Pet Owner Account**: Regular Django User with JWT token
2. **Admin Account**: Admin user with admin JWT token (MASTER, VET, or DESK role)

### Test Data Needed
- At least 2 pet owners with pets
- SOAP reports for different pets
- Chat conversations linked to pets

---

## Test Cases

### 1. SOAP Report by Case ID
**Endpoint:** `GET /api/diagnosis/soap/:caseId`

#### Test 1.1: Pet Owner - Own Report ✅
```bash
# Get case_id from a report owned by test user
curl -X GET "http://localhost:8000/api/diagnosis/soap/#PDX-2025-1101-001" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** Returns SOAP report with `data` key
**Status:** 200 OK

#### Test 1.2: Pet Owner - Another's Report ❌
```bash
# Get case_id from a report owned by different user
curl -X GET "http://localhost:8000/api/diagnosis/soap/#PDX-2025-1101-002" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** 403 Forbidden - "You do not have permission to view this report"

#### Test 1.3: Admin - Any Report ✅
```bash
curl -X GET "http://localhost:8000/api/diagnosis/soap/#PDX-2025-1101-001" \
  -H "Authorization: Bearer <admin_jwt_token>"
```
**Expected:** Returns SOAP report with `report` key (admin format)
**Status:** 200 OK

---

### 2. Get Diagnoses for Pet
**Endpoint:** `GET /api/diagnosis/:petId`

#### Test 2.1: Pet Owner - Own Pet ✅
```bash
curl -X GET "http://localhost:8000/api/diagnosis/1" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** Returns diagnoses array with `data` key
**Status:** 200 OK

#### Test 2.2: Pet Owner - Another's Pet ❌
```bash
curl -X GET "http://localhost:8000/api/diagnosis/2" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** 403 Forbidden - "You do not have permission to view this pet's diagnoses"

#### Test 2.3: Admin - Any Pet ✅
```bash
curl -X GET "http://localhost:8000/api/diagnosis/1" \
  -H "Authorization: Bearer <admin_jwt_token>"
```
**Expected:** Returns diagnoses array with `diagnoses` key (admin format)
**Status:** 200 OK

---

### 3. Flagged Cases
**Endpoint:** `GET /api/diagnosis/flagged/:petId?` (pet_id optional)

#### Test 3.1: Pet Owner - With Pet ID (Own Pet) ✅
```bash
curl -X GET "http://localhost:8000/api/diagnosis/flagged/1" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** Returns flagged cases for pet 1
**Status:** 200 OK

#### Test 3.2: Pet Owner - Without Pet ID ❌
```bash
curl -X GET "http://localhost:8000/api/diagnosis/flagged" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** 400 Bad Request - "Pet ID is required"

#### Test 3.3: Admin - All Flagged Cases ✅
```bash
curl -X GET "http://localhost:8000/api/diagnosis/flagged" \
  -H "Authorization: Bearer <admin_jwt_token>"
```
**Expected:** Returns all flagged cases across all pets
**Status:** 200 OK

#### Test 3.4: Admin - Specific Pet's Flagged Cases ✅
```bash
curl -X GET "http://localhost:8000/api/diagnosis/flagged/1" \
  -H "Authorization: Bearer <admin_jwt_token>"
```
**Expected:** Returns flagged cases for pet 1
**Status:** 200 OK

---

### 4. All Reports List
**Endpoint:** `GET /api/diagnosis/reports`

#### Test 4.1: Pet Owner - Own Reports Only ✅
```bash
curl -X GET "http://localhost:8000/api/diagnosis/reports" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** Returns only reports for pets owned by the user
**Status:** 200 OK

#### Test 4.2: Admin - All Reports ✅
```bash
curl -X GET "http://localhost:8000/api/diagnosis/reports?search=Max&page=1&limit=10" \
  -H "Authorization: Bearer <admin_jwt_token>"
```
**Expected:** Returns all reports with filtering
**Status:** 200 OK

---

### 5. Pet Listing
**Endpoint:** `GET /api/pets/`

#### Test 5.1: Pet Owner - Own Pets ✅
```bash
curl -X GET "http://localhost:8000/api/pets/" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** Returns array of pets owned by user
**Status:** 200 OK

#### Test 5.2: Admin - All Pets (Simple Format) ✅
```bash
curl -X GET "http://localhost:8000/api/pets/" \
  -H "Authorization: Bearer <admin_jwt_token>"
```
**Expected:** Returns array of all pets with owner info included
**Status:** 200 OK

#### Test 5.3: Admin - All Pets (Advanced Filtering) ✅
```bash
curl -X GET "http://localhost:8000/api/pets/?species=dogs&page=1&limit=10" \
  -H "Authorization: Bearer <admin_jwt_token>"
```
**Expected:** Returns paginated results with admin format
**Status:** 200 OK

---

### 6. Pet Detail
**Endpoint:** `GET /api/pets/:petId/`

#### Test 6.1: Pet Owner - Own Pet ✅
```bash
curl -X GET "http://localhost:8000/api/pets/1/" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** Returns pet details (simple format)
**Status:** 200 OK

#### Test 6.2: Pet Owner - Another's Pet ❌
```bash
curl -X GET "http://localhost:8000/api/pets/2/" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** 403 Forbidden - "You do not have permission to access this pet"

#### Test 6.3: Admin - Any Pet ✅
```bash
curl -X GET "http://localhost:8000/api/pets/1/" \
  -H "Authorization: Bearer <admin_jwt_token>"
```
**Expected:** Returns pet details with owner info (admin format)
**Status:** 200 OK

---

### 7. Chat Conversations List
**Endpoint:** `GET /api/chatbot/conversations/`

#### Test 7.1: Pet Owner - Own Conversations ✅
```bash
curl -X GET "http://localhost:8000/api/chatbot/conversations/" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** Returns only user's conversations
**Status:** 200 OK

#### Test 7.2: Pet Owner - Filtered by Own Pet ✅
```bash
curl -X GET "http://localhost:8000/api/chatbot/conversations/?pet_id=1" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** Returns conversations for pet 1 (if user owns pet 1)
**Status:** 200 OK

#### Test 7.3: Admin - All Conversations ✅
```bash
curl -X GET "http://localhost:8000/api/chatbot/conversations/" \
  -H "Authorization: Bearer <admin_jwt_token>"
```
**Expected:** Returns all conversations
**Status:** 200 OK

#### Test 7.4: Admin - Filtered by Pet ✅
```bash
curl -X GET "http://localhost:8000/api/chatbot/conversations/?pet_id=1" \
  -H "Authorization: Bearer <admin_jwt_token>"
```
**Expected:** Returns conversations for pet 1 (admin format with chats array)
**Status:** 200 OK

---

### 8. Chat Conversation Detail
**Endpoint:** `GET /api/chatbot/conversations/:conversationId/`

#### Test 8.1: Pet Owner - Own Conversation ✅
```bash
curl -X GET "http://localhost:8000/api/chatbot/conversations/1/" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** Returns conversation messages (pet owner format)
**Status:** 200 OK

#### Test 8.2: Pet Owner - Another's Conversation ❌
```bash
curl -X GET "http://localhost:8000/api/chatbot/conversations/2/" \
  -H "Authorization: Bearer <pet_owner_jwt_token>"
```
**Expected:** 403 Forbidden - "You do not have permission to view this conversation"

#### Test 8.3: Admin - Any Conversation ✅
```bash
curl -X GET "http://localhost:8000/api/chatbot/conversations/1/" \
  -H "Authorization: Bearer <admin_jwt_token>"
```
**Expected:** Returns conversation with admin format (chat key with pet_id, owner_name)
**Status:** 200 OK

---

## Automated Test Script

You can use this Python script to test all endpoints:

```python
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
PET_OWNER_TOKEN = "your_pet_owner_jwt_token"
ADMIN_TOKEN = "your_admin_jwt_token"

def test_endpoint(name, method, url, headers, expected_status=200, expected_keys=None):
    """Test an endpoint and verify response"""
    response = requests.request(method, url, headers=headers)
    
    print(f"\n{'='*60}")
    print(f"Test: {name}")
    print(f"URL: {url}")
    print(f"Status: {response.status_code} (Expected: {expected_status})")
    
    if response.status_code == expected_status:
        data = response.json()
        if expected_keys:
            for key in expected_keys:
                if key in data:
                    print(f"✅ Key '{key}' present")
                else:
                    print(f"❌ Key '{key}' missing")
        print(f"✅ Test PASSED")
    else:
        print(f"❌ Test FAILED")
        print(f"Response: {response.text}")
    
    return response.status_code == expected_status

# Run tests
headers_pet = {"Authorization": f"Bearer {PET_OWNER_TOKEN}"}
headers_admin = {"Authorization": f"Bearer {ADMIN_TOKEN}"}

# Test SOAP report by case ID
test_endpoint(
    "Pet Owner - Own SOAP Report",
    "GET",
    f"{BASE_URL}/api/diagnosis/soap/#PDX-2025-1101-001",
    headers_pet,
    expected_keys=['success', 'data']
)

test_endpoint(
    "Admin - Any SOAP Report",
    "GET",
    f"{BASE_URL}/api/diagnosis/soap/#PDX-2025-1101-001",
    headers_admin,
    expected_keys=['success', 'report']
)

# ... (add more tests)
```

---

## Expected Behavior Summary

| Endpoint | Pet Owner Behavior | Admin Behavior |
|----------|-------------------|----------------|
| SOAP by Case ID | Own reports only | All reports |
| Diagnoses by Pet | Own pets only | Any pet |
| Flagged Cases | Must provide pet_id (own pet) | Optional pet_id, or all |
| Reports List | Auto-filtered to own | All reports |
| Pet List | Own pets only | All pets |
| Pet Detail | Own pets only | Any pet |
| Conversations | Own conversations | All conversations |
| Conversation Detail | Own conversations | Any conversation |

---

## Common Issues & Debugging

### Issue: 401 Unauthorized
**Cause:** Invalid or expired token
**Solution:** Regenerate JWT token

### Issue: 403 Forbidden (Pet Owner)
**Cause:** Trying to access another user's data
**Expected:** This is correct behavior - pet owners should only see their data

### Issue: Wrong Response Format
**Cause:** Response format differs for admin vs pet owner
**Solution:** Check `request.user_type` in response handling

### Issue: Admin Can't See All Data
**Cause:** Permission check not working
**Solution:** Verify `request.user_type == 'admin'` in view

