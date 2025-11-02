# Endpoint Consolidation Summary

## ✅ Completed Consolidations

### 1. SOAP Report by Case ID ✅
**Before:**
- Pet Owner: `GET /api/diagnosis/soap/:caseId`
- Admin: `GET /api/admin/reports/:caseId`

**After:**
- **Unified:** `GET /api/diagnosis/soap/:caseId`
  - Supports both Pet Owners and Admins
  - Pet Owners: Can only view their own reports
  - Admins: Can view any report
  - Response format adapts based on user type

**Files Modified:**
- `chatbot/views_diagnosis.py`: Updated `get_soap_report_by_case_id()`

---

### 2. Get Diagnoses for Pet ✅
**Before:**
- Pet Owner: `GET /api/diagnosis/:petId`
- Admin: `GET /api/admin/pets/:petId/diagnoses`

**After:**
- **Unified:** `GET /api/diagnosis/:petId`
  - Supports both Pet Owners and Admins
  - Pet Owners: Can only view diagnoses for their own pets
  - Admins: Can view diagnoses for any pet
  - Response format differs (admin gets summary, pet owner gets full details)

**Files Modified:**
- `chatbot/views_diagnosis.py`: Updated `get_pet_diagnoses()`

---

### 3. Flagged Cases ✅
**Before:**
- Pet Owner: `GET /api/diagnosis/flagged/:petId`
- Admin: `GET /api/admin/reports/flagged`
- Admin Dashboard: `GET /api/admin/dashboard/flagged-cases`

**After:**
- **Unified:** `GET /api/diagnosis/flagged/:petId?` (pet_id optional for admins)
  - Pet Owners: Must provide pet_id, sees only their flagged cases
  - Admins: Can omit pet_id to see all flagged cases, or provide pet_id for specific pet
  - Supports both `flag_level` and `filter` query parameters

**Files Modified:**
- `chatbot/views_diagnosis.py`: Replaced `get_flagged_cases_for_pet()` with `get_flagged_cases()`
- `chatbot/urls.py`: Added both routes (with and without pet_id)

---

### 4. All Reports List ✅
**Before:**
- Admin: `GET /api/admin/reports`
- Pet Owner: No equivalent endpoint

**After:**
- **New Unified:** `GET /api/diagnosis/reports`
  - Supports both Pet Owners and Admins
  - Pet Owners: Automatically filtered to their own reports
  - Admins: See all reports with full filtering
  - Supports all existing filter parameters (search, dateRange, species, flagLevel, pagination)

**Files Modified:**
- `chatbot/views_diagnosis.py`: Added `get_all_reports()`
- `chatbot/urls.py`: Added new route

---

## 🔧 Infrastructure Created

### Unified Permission System
**New File:** `utils/unified_permissions.py`

**Components:**
1. `check_user_or_admin(request)` - Checks authentication for both user types
2. `require_user_or_admin` - Decorator for views supporting both types
3. `filter_by_ownership(queryset, request, owner_field)` - Helper for role-based filtering
4. `IsUserOrAdmin` - DRF Permission class

**Usage:**
```python
@require_user_or_admin
def my_view(request):
    if request.user_type == 'admin':
        # Admin sees all
        queryset = Model.objects.all()
    else:  # pet_owner
        # Pet owner sees only their own
        queryset = Model.objects.filter(owner=request.user)
```

---

## 📋 Endpoints to Deprecate

The following admin endpoints should be marked as deprecated and eventually removed:

### High Priority (Replace Immediately)
1. ✅ `GET /api/admin/reports/:caseId` → Use `GET /api/diagnosis/soap/:caseId`
2. ✅ `GET /api/admin/reports` → Use `GET /api/diagnosis/reports`
3. ✅ `GET /api/admin/reports/flagged` → Use `GET /api/diagnosis/flagged` (omit pet_id for all)
4. ✅ `GET /api/admin/pets/:petId/diagnoses` → Use `GET /api/diagnosis/:petId`

### Medium Priority (Can Deprecate Later)
5. `GET /api/admin/dashboard/flagged-cases` → Use `GET /api/diagnosis/flagged` (omit pet_id)

---

## 📝 Next Steps

### Phase 1: Update Admin URLs (Required)
1. **Comment out deprecated routes** in `admin_panel/urls.py`:
   - `path('reports/<str:case_id>', ...)` → Comment with deprecation notice
   - `path('reports', ...)` → Comment with deprecation notice
   - `path('reports/flagged', ...)` → Comment with deprecation notice
   - `path('pets/<int:pet_id>/diagnoses', ...)` → Comment with deprecation notice

2. **Add deprecation warnings** to admin views that are still referenced elsewhere

### Phase 2: Frontend Migration
- Update frontend to use new unified endpoints
- Remove references to deprecated admin endpoints

### Phase 3: Testing
- Test all consolidated endpoints with both user types
- Verify role-based filtering works correctly
- Test edge cases (pet owner accessing another's data, etc.)

### Phase 4: Cleanup
- Remove deprecated view functions from `admin_panel/views_reports.py`
- Remove deprecated routes from `admin_panel/urls.py`
- Update documentation

---

## 🎯 Benefits Achieved

1. ✅ **Reduced Duplication**: 4 duplicate endpoints consolidated
2. ✅ **Single Source of Truth**: One endpoint per operation
3. ✅ **Role-Based Access**: Automatic filtering based on user type
4. ✅ **Maintainability**: Less code to maintain, fewer bugs
5. ✅ **Consistency**: Same endpoint logic for both user types

---

## ⚠️ Important Notes

1. **Backward Compatibility**: Deprecated endpoints still work but should not be used for new development
2. **Response Format**: Some endpoints return slightly different formats for admin vs pet owner (documented in each view)
3. **Authentication**: Unified permission system handles both Django User (pet owner) and Admin JWT tokens
4. **Filtering**: Pet owners automatically filtered to their own data; admins see everything

---

## 🔍 Testing Checklist

- [ ] Pet owner can view their own SOAP reports
- [ ] Pet owner CANNOT view another's SOAP reports (403 error)
- [ ] Admin can view any SOAP report
- [ ] Pet owner can list their own reports
- [ ] Admin can list all reports with filters
- [ ] Pet owner can view their flagged cases
- [ ] Admin can view all flagged cases
- [ ] Admin can view flagged cases for specific pet
- [ ] Response formats match expected structure for both user types

