# Master Admin Rules & Implementation Guide

## 🔐 CRITICAL: Master Admin Security Rules

This document outlines the **CRITICAL** security rules for Master Admin accounts and how they are enforced in the PawPal system.

---

## 1. Master Admin Creation Rules

### ✅ ALLOWED Methods

**ONLY these methods can create Master Admin:**

1. **`seed_data.py` management command** (Chunk 13)
   ```bash
   python manage.py seed_data
   ```
   - Creates: `maria.santos@pawpal.com` / `MasterAdmin123!`
   - This is the **PRIMARY** and **ONLY** recommended way

2. **Direct database insertion** (Developer only)
   - For emergency situations only
   - Requires direct database access
   - Not recommended for normal operations

### ❌ PROHIBITED Methods

**These methods CANNOT create Master Admin:**

- ❌ API endpoints (`POST /api/admin/roles`)
- ❌ Django Admin Panel (if restricted)
- ❌ Any UI-based creation
- ❌ Any automated system

### Implementation

**Location:** `admin_panel/views_admin_roles.py` (Chunk 8)

```python
@api_view(['POST'])
@require_admin_role(['MASTER'])
def _create_admin_role(request):
    # ... validation code ...
    
    # Cannot create MASTER via API
    if role == 'MASTER':
        return Response({
            'success': False,
            'error': 'Cannot create MASTER admin via API. Use management command instead.'
        }, status=status.HTTP_403_FORBIDDEN)
```

**Status:** ✅ **ENFORCED**

---

## 2. Admin Roles Page Access

### Access Control

**ONLY Master Admin can access:**

- `/api/admin/roles` (GET - List admins)
- `/api/admin/roles` (POST - Create admin)
- `/api/admin/roles/:id` (GET - Get admin details)
- `/api/admin/roles/:id` (PUT - Update admin)
- `/api/admin/roles/:id` (DELETE - Delete admin)
- `/api/admin/roles/:id/status` (PUT - Toggle status)

**All other roles get 403 Forbidden:**

- ❌ Veterinarian (VET) → 403 Forbidden
- ❌ Front Desk (DESK) → 403 Forbidden
- ❌ Unauthenticated → 401 Unauthorized

### Implementation

**Location:** `admin_panel/views_admin_roles.py`

```python
@api_view(['GET', 'POST'])
@require_admin_role(['MASTER'])  # ← Only MASTER allowed
def get_admin_roles(request):
    # ...
```

```python
@api_view(['GET', 'PUT', 'DELETE'])
@require_admin_role(['MASTER'])  # ← Only MASTER allowed
def get_admin_role_detail(request, admin_id):
    # ...
```

```python
@api_view(['PUT'])
@require_admin_role(['MASTER'])  # ← Only MASTER allowed
def toggle_admin_status(request, admin_id):
    # ...
```

**Status:** ✅ **ENFORCED**

### Frontend Requirements

- ✅ Hide "Admin Roles" navigation link if `admin.role !== 'MASTER'`
- ✅ Show 403 error page if user tries to access `/admin/roles` directly
- ✅ No UI indication that Admin Roles feature exists for non-Master admins

---

## 3. Admin Management Permissions (Master Admin ONLY)

### What Master Admin CAN Do

✅ **Create new admin accounts**
   - Roles: VET or DESK only (NOT MASTER)
   - Generates secure random password
   - Sends welcome email

✅ **Edit existing admin accounts**
   - Update name, email, contact_number, clinic_info
   - Change role: VET ↔ DESK (NOT to/from MASTER)
   - Cannot modify own role (NEW protection)

✅ **Activate/deactivate admin accounts**
   - Toggle active/inactive status
   - Cannot deactivate own account (NEW protection)
   - Cannot deactivate last Master Admin

✅ **Delete admin accounts**
   - Soft delete (retains data for audit)
   - Cannot delete MASTER admin
   - Cannot delete last Master Admin

✅ **View all admin accounts**
   - List with filtering and pagination
   - Search by name, email
   - Filter by role, status

### What Master Admin CANNOT Do

❌ **Create additional Master Admin accounts via API**
   - Rejected with 403 Forbidden

❌ **Delete Master Admin accounts**
   - Rejected with 403 Forbidden

❌ **Delete the last Master Admin**
   - System protection prevents this

❌ **Change their own role**
   - Rejected with 403 Forbidden (NEW protection)

❌ **Deactivate their own account**
   - Rejected with 403 Forbidden (NEW protection)

❌ **Change any admin's role to/from MASTER**
   - MASTER role is immutable

---

## 4. Implementation Checklist

### ✅ Completed Protections

- [x] All `/api/admin/roles/*` endpoints require `@require_admin_role(['MASTER'])`
- [x] POST `/api/admin/roles` rejects `role='MASTER'` in request body
- [x] DELETE `/api/admin/roles/:id` prevents deleting MASTER admin
- [x] DELETE `/api/admin/roles/:id` prevents deleting last Master Admin
- [x] PUT `/api/admin/roles/:id` prevents changing role to/from MASTER
- [x] PUT `/api/admin/roles/:id` prevents Master Admin changing their own role (NEW)
- [x] PUT `/api/admin/roles/:id` prevents Master Admin deactivating themselves (NEW)
- [x] PUT `/api/admin/roles/:id/status` prevents Master Admin deactivating themselves (NEW)
- [x] PUT `/api/admin/roles/:id/status` prevents deactivating last Master Admin
- [x] `seed_data.py` creates default Master Admin account
- [x] `seed_data.py` is the only way to create Master Admin programmatically

### ⚠️ Frontend Requirements (Not Backend)

- [ ] Hide "Admin Roles" nav link if `admin.role !== 'MASTER'`
- [ ] Show 403 error page for non-Master admins accessing `/admin/roles`
- [ ] No UI indication of Admin Roles feature for VET/DESK admins

---

## 5. Code Verification

### Verification Commands

```bash
# Check all endpoints are protected
grep -n "@require_admin_role" admin_panel/views_admin_roles.py

# Verify MASTER rejection in POST
grep -A 5 "Cannot create MASTER" admin_panel/views_admin_roles.py

# Verify self-modification prevention
grep -A 5 "Cannot modify your own" admin_panel/views_admin_roles.py
grep -A 5 "Cannot deactivate your own" admin_panel/views_admin_roles.py

# Verify Master Admin deletion prevention
grep -A 5 "Cannot delete MASTER" admin_panel/views_admin_roles.py
```

---

## 6. Error Codes

### Master Admin Related Error Codes

| Code | Message | Status | Context |
|------|---------|--------|---------|
| `CANNOT_CREATE_MASTER` | Cannot create MASTER admin via API | 403 | POST `/api/admin/roles` with `role=MASTER` |
| `CANNOT_DELETE_MASTER` | Cannot delete MASTER admin | 403 | DELETE `/api/admin/roles/:id` on MASTER admin |
| `LAST_MASTER_ADMIN` | Cannot delete/deactivate the last MASTER admin | 403 | Deleting/deactivating when only 1 Master Admin exists |
| `CANNOT_MODIFY_OWN_ROLE` | Cannot modify your own role | 403 | PUT `/api/admin/roles/:id` on own account |
| `CANNOT_DEACTIVATE_OWN_ACCOUNT` | Cannot deactivate your own account | 403 | PUT `/api/admin/roles/:id` or `/api/admin/roles/:id/status` on own account |

---

## 7. Testing Scenarios

### Test Case 1: Create Master Admin via API (Should Fail)

```python
# As Master Admin
POST /api/admin/roles
{
  "name": "New Master",
  "email": "newmaster@pawpal.com",
  "role": "MASTER"  # ← Should be rejected
}

# Expected: 403 Forbidden
# Error: "Cannot create MASTER admin via API. Use management command instead."
```

### Test Case 2: Non-Master Accessing Roles Page (Should Fail)

```python
# As VET or DESK Admin
GET /api/admin/roles

# Expected: 403 Forbidden
# Error: "Insufficient permissions"
```

### Test Case 3: Master Admin Changing Own Role (Should Fail)

```python
# As Master Admin (maria.santos@pawpal.com)
PUT /api/admin/roles/{own_admin_id}
{
  "role": "VET"  # ← Trying to change own role
}

# Expected: 403 Forbidden
# Error: "Cannot modify your own role"
```

### Test Case 4: Master Admin Deactivating Self (Should Fail)

```python
# As Master Admin (maria.santos@pawpal.com)
PUT /api/admin/roles/{own_admin_id}/status
{
  "status": "inactive"  # ← Trying to deactivate self
}

# Expected: 403 Forbidden
# Error: "Cannot deactivate your own account"
```

### Test Case 5: Delete Master Admin (Should Fail)

```python
# As Master Admin
DELETE /api/admin/roles/{master_admin_id}

# Expected: 403 Forbidden
# Error: "Cannot delete MASTER admin"
```

### Test Case 6: Delete Last Master Admin (Should Fail)

```python
# As Master Admin (if only 1 Master Admin exists)
DELETE /api/admin/roles/{master_admin_id}

# Expected: 403 Forbidden
# Error: "Cannot delete the last MASTER admin"
```

---

## 8. Default Master Admin Account

### Credentials (Development/Testing Only)

**Created by:** `seed_data.py` (Chunk 13)

- **Email:** `maria.santos@pawpal.com`
- **Password:** `MasterAdmin123!`
- **Role:** `MASTER`
- **Name:** Dr. Maria Santos
- **Contact:** 09171234567
- **Clinic:** PawPal Veterinary Clinic

### ⚠️ Production Warning

- Change default password immediately in production
- Use strong, unique password
- Enable 2FA if available
- Store credentials securely (password manager)

---

## 9. Security Best Practices

### For Developers

1. ✅ **Never** create Master Admin via API during development
2. ✅ **Only** use `seed_data.py` to create Master Admin
3. ✅ **Verify** all protections are in place before deployment
4. ✅ **Test** all Master Admin restrictions

### For System Administrators

1. ✅ **Change** default Master Admin password in production
2. ✅ **Limit** who has access to Master Admin account
3. ✅ **Monitor** Master Admin account activity
4. ✅ **Document** Master Admin credentials securely
5. ✅ **Restrict** database access for Master Admin creation

---

## 10. File Locations

### Backend Implementation

| Component | File | Lines |
|-----------|------|-------|
| Admin Roles Views | `admin_panel/views_admin_roles.py` | All Master-only endpoints |
| Permissions Decorator | `admin_panel/permissions.py` | `@require_admin_role(['MASTER'])` |
| Seed Data Command | `admin_panel/management/commands/seed_data.py` | Master Admin creation |
| Utility Functions | `admin_panel/admin_utils.py` | `check_master_admin_count()` |

### Frontend Requirements (To Be Implemented)

| Component | File | Status |
|-----------|------|--------|
| Navigation Component | `frontend/src/components/Navigation.jsx` | ⚠️ Hide link if not MASTER |
| Admin Roles Page | `frontend/src/pages/AdminRoles.jsx` | ⚠️ Show 403 if not MASTER |
| Route Protection | `frontend/src/routes.jsx` | ⚠️ Protect `/admin/roles` route |

---

## 11. Summary

### ✅ Backend Protections (Complete)

All backend protections are **FULLY IMPLEMENTED** and enforced:

1. ✅ All endpoints require `@require_admin_role(['MASTER'])`
2. ✅ POST endpoint rejects `role='MASTER'`
3. ✅ DELETE endpoint prevents deleting MASTER admin
4. ✅ DELETE endpoint prevents deleting last Master Admin
5. ✅ PUT endpoint prevents changing role to/from MASTER
6. ✅ PUT endpoint prevents Master Admin changing own role (NEW)
7. ✅ PUT endpoint prevents Master Admin deactivating themselves (NEW)
8. ✅ Status toggle prevents Master Admin deactivating themselves (NEW)
9. ✅ Status toggle prevents deactivating last Master Admin
10. ✅ Seed command creates Master Admin securely

### ⚠️ Frontend Requirements (Pending)

Frontend should implement:

1. ⚠️ Hide "Admin Roles" nav link for non-Master admins
2. ⚠️ Show 403 error page for unauthorized access
3. ⚠️ No UI indication of feature for VET/DESK admins

---

**Document Version:** 1.0  
**Last Updated:** November 1, 2025  
**Status:** ✅ Backend Complete | ⚠️ Frontend Pending

