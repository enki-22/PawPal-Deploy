# API Migration Guide - Frontend Team

## Quick Reference: Old → New Endpoints

### SOAP Reports

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/admin/reports/:caseId` | `GET /api/diagnosis/soap/:caseId` | Works for both user types |
| `GET /api/admin/reports` | `GET /api/diagnosis/reports` | Works for both user types |
| `GET /api/admin/reports/flagged` | `GET /api/diagnosis/flagged` | Pet owners: must include `?pet_id=X` |

### Diagnoses

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/admin/pets/:petId/diagnoses` | `GET /api/diagnosis/:petId` | Works for both user types |

### Pets

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/admin/pets` | `GET /api/pets/` | Use admin token for full list |
| `GET /api/admin/pets/:petId` | `GET /api/pets/:petId/` | Use admin token |

### Chats

| Old Endpoint | New Endpoint | Notes |
|-------------|--------------|-------|
| `GET /api/admin/pets/:petId/chat-history` | `GET /api/chatbot/conversations/?pet_id=:petId` | Works for both |
| `GET /api/admin/pets/:petId/chat/:chatId` | `GET /api/chatbot/conversations/:chatId/` | Works for both |

---

## Authentication Changes

### Pet Owner (No Changes)
- Continue using: `Authorization: Bearer <pet_owner_jwt_token>`
- Token from: `POST /api/auth/login`

### Admin (No Changes)
- Continue using: `Authorization: Bearer <admin_jwt_token>`
- Token from: `POST /api/admin/login`

**Important:** The unified endpoints automatically detect user type from the token!

---

## Response Format Differences

### Pet Owner Format
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### Admin Format
```json
{
  "success": true,
  "results": [...],
  "pagination": {...},
  "filters": {...}
}
```

**Note:** Some endpoints return different keys (`data` vs `results`, `report` vs `chat`) based on user type. Check response structure before accessing.

---

## Key Differences by Endpoint

### 1. Flagged Cases
**Pet Owner:** Must provide pet_id in URL
```
GET /api/diagnosis/flagged/1
```

**Admin:** Can omit pet_id for all flagged, or include for specific pet
```
GET /api/diagnosis/flagged        # All flagged
GET /api/diagnosis/flagged/1      # Specific pet
```

### 2. Conversations
**Pet Owner:** Can optionally filter by own pet
```
GET /api/chatbot/conversations/
GET /api/chatbot/conversations/?pet_id=1  # Must be their pet
```

**Admin:** Can view all or filter by any pet
```
GET /api/chatbot/conversations/
GET /api/chatbot/conversations/?pet_id=1  # Any pet
```

### 3. Pet Listing
**Pet Owner:** Always returns their pets (no pagination)
```json
[{...}, {...}]
```

**Admin:** Returns paginated format when using admin params
```json
{
  "success": true,
  "results": [...],
  "pagination": {...}
}
```

---

## Migration Checklist

- [ ] Update SOAP report endpoints in frontend
- [ ] Update diagnosis endpoints in frontend
- [ ] Update flagged cases endpoints in frontend
- [ ] Update reports list endpoint in frontend
- [ ] Update pet listing endpoint in frontend
- [ ] Update pet detail endpoint in frontend
- [ ] Update conversation endpoints in frontend
- [ ] Test all endpoints with both user types
- [ ] Remove references to deprecated admin endpoints
- [ ] Update API documentation

---

## Testing Your Migration

Use the test script: `test_consolidated_endpoints.py`

1. Update tokens in the script
2. Update test IDs
3. Run: `python test_consolidated_endpoints.py`

---

## Need Help?

- See `TESTING_CONSOLIDATED_ENDPOINTS.md` for detailed test cases
- See `CONSOLIDATION_COMPLETE.md` for full implementation details
- Check response format based on `user_type` if needed (though it's automatic)

