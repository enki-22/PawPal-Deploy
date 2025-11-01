# Chunk 6: Admin Client Management - API Quick Reference

## Base URL
```
/api/admin/clients
```

## Authentication
All endpoints require JWT authentication via Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. List All Clients

### Endpoint
```http
GET /api/admin/clients
```

### Permissions
✓ MASTER | ✓ VET | ✓ DESK

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | - | Search in name, email |
| `dateRange` | string | No | all_time | today, last_7_days, last_30_days, custom, all_time |
| `custom_start` | string | No | - | Start date (YYYY-MM-DD) for custom range |
| `custom_end` | string | No | - | End date (YYYY-MM-DD) for custom range |
| `status` | string | No | all | all, active, inactive, pending_verification |
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 10 | Items per page (max: 100) |

### Success Response (200 OK)
```json
{
  "success": true,
  "results": [
    {
      "user_id": 1,
      "name": "Mal Beausoleil",
      "email": "mal.beausoleil@example.com",
      "pet_count": 2,
      "status": "Active",
      "date_created": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "search": "mal",
    "dateRange": "last_7_days",
    "status": "active"
  }
}
```

### Example Request
```bash
curl -X GET "http://localhost:8000/api/admin/clients?search=john&status=active&page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGci..."
```

---

## 2. Get Client Details

### Endpoint
```http
GET /api/admin/clients/:userId
```

### Permissions
✓ MASTER | ✓ VET | ✓ DESK

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | integer | Yes | User ID |

### Success Response (200 OK)
```json
{
  "success": true,
  "client": {
    "user_id": 1,
    "name": "Mal Beausoleil",
    "email": "mal.beausoleil@example.com",
    "contact_number": "09453419798",
    "city_province": "Santa Rosa City, Laguna",
    "address": "123 Sample Street",
    "status": "Active",
    "profile_image": null,
    "date_joined": "2025-01-15T10:30:00Z",
    "pets": [
      {
        "pet_id": 1,
        "name": "Charlie",
        "species": "Cat",
        "breed": "Domestic Shorthair",
        "photo": "http://example.com/media/pets/charlie.jpg"
      }
    ]
  }
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "error": "Client not found",
  "user_id": 99999
}
```

### Example Request
```bash
curl -X GET "http://localhost:8000/api/admin/clients/1" \
  -H "Authorization: Bearer eyJhbGci..."
```

---

## 3. Update Client Information

### Endpoint
```http
PUT /api/admin/clients/:userId
```

### Permissions
✓ MASTER | ✓ VET | ✗ DESK

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | integer | Yes | User ID |

### Request Body
```json
{
  "name": "Updated Name",
  "email": "new.email@example.com",
  "contact_number": "09123456789",
  "address": "456 New Street",
  "city_province": "Manila, Philippines"
}
```

**Note:** All fields are optional. Only provided fields will be updated.

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Client information updated successfully",
  "updated_fields": ["name", "email", "contact_number"],
  "client": {
    "user_id": 1,
    "name": "Updated Name",
    "email": "new.email@example.com",
    "contact_number": "09123456789",
    "address": "456 New Street",
    "city_province": "Manila, Philippines"
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Email already exists",
  "code": "EMAIL_EXISTS"
}
```

### Error Response (403 Forbidden)
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "PERMISSION_DENIED",
  "required_roles": ["MASTER", "VET"],
  "your_role": "DESK"
}
```

### Example Request
```bash
curl -X PUT "http://localhost:8000/api/admin/clients/1" \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com"
  }'
```

---

## 4. Verify Client Account

### Endpoint
```http
POST /api/admin/clients/:userId/verify
```

### Permissions
✓ MASTER | ✓ VET | ✗ DESK

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | integer | Yes | User ID |

### Request Body
None required.

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Client account verified successfully",
  "email_sent": true
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Client is already verified"
}
```

### Example Request
```bash
curl -X POST "http://localhost:8000/api/admin/clients/1/verify" \
  -H "Authorization: Bearer eyJhbGci..."
```

**Note:** This action sends a verification confirmation email to the client.

---

## 5. Deactivate Client Account

### Endpoint
```http
POST /api/admin/clients/:userId/deactivate
```

### Permissions
✓ MASTER | ✓ VET | ✗ DESK

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | integer | Yes | User ID |

### Request Body (Optional)
```json
{
  "reason": "Policy violation"
}
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Client account deactivated successfully",
  "email_sent": true
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Client is already deactivated"
}
```

### Example Request
```bash
curl -X POST "http://localhost:8000/api/admin/clients/1/deactivate" \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Violation of terms of service"
  }'
```

**Note:** This action sends a deactivation notification email to the client.

---

## 6. Send Custom Email to Client

### Endpoint
```http
POST /api/admin/clients/:userId/email
```

### Permissions
✓ MASTER | ✓ VET | ✓ DESK

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | integer | Yes | User ID |

### Request Body
```json
{
  "subject": "Important Update",
  "message": "Dear client, we wanted to inform you about..."
}
```

**Both fields are required.**

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Email sent successfully",
  "recipient": "client@example.com"
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Email subject is required"
}
```

### Example Request
```bash
curl -X POST "http://localhost:8000/api/admin/clients/1/email" \
  -H "Authorization: Bearer eyJhbGci..." \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Welcome to PawPal",
    "message": "Thank you for joining our platform. We are excited to have you!"
  }'
```

---

## Error Responses

### Common HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters or validation error |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | Insufficient permissions for this action |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server error occurred |

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message here",
  "details": "Additional details if available",
  "code": "ERROR_CODE"
}
```

### Authentication Errors

**401 - Missing Token:**
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

**401 - Invalid Token:**
```json
{
  "success": false,
  "error": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

**401 - Expired Token:**
```json
{
  "success": false,
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

### Permission Errors

**403 - Insufficient Permissions:**
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "PERMISSION_DENIED",
  "required_roles": ["MASTER", "VET"],
  "your_role": "DESK"
}
```

---

## Permission Matrix

| Endpoint | MASTER | VET | DESK | Notes |
|----------|--------|-----|------|-------|
| GET /clients | ✓ | ✓ | ✓ | View all clients |
| GET /clients/:id | ✓ | ✓ | ✓ | View client details |
| PUT /clients/:id | ✓ | ✓ | ✗ | Update client info |
| POST /clients/:id/verify | ✓ | ✓ | ✗ | Verify account |
| POST /clients/:id/deactivate | ✓ | ✓ | ✗ | Deactivate account |
| POST /clients/:id/email | ✓ | ✓ | ✓ | Send custom email |

---

## Testing with Postman

### 1. Setup Environment Variables
```
base_url: http://localhost:8000
admin_token: <your_jwt_token>
```

### 2. Create Collection
Import these endpoints into a Postman collection with the following structure:

```
PawPal Admin API
└── Client Management
    ├── List Clients
    ├── Get Client Details
    ├── Update Client
    ├── Verify Client
    ├── Deactivate Client
    └── Send Email
```

### 3. Set Authorization
For all requests, add header:
```
Authorization: Bearer {{admin_token}}
```

### 4. Sample Test Sequence
1. **List all clients** → Get user_id from response
2. **Get client details** → Using user_id
3. **Update client** → Change name or email
4. **Send test email** → Verify email functionality
5. **Verify client** → Set account as verified
6. **List clients again** → Verify changes

---

## Integration Guide for Frontend

### React/TypeScript Example

```typescript
// api/adminClient.ts
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/admin';

export interface Client {
  user_id: number;
  name: string;
  email: string;
  pet_count: number;
  status: string;
  date_created: string;
}

export interface ClientFilters {
  search?: string;
  dateRange?: 'today' | 'last_7_days' | 'last_30_days' | 'custom' | 'all_time';
  custom_start?: string;
  custom_end?: string;
  status?: 'all' | 'active' | 'inactive' | 'pending_verification';
  page?: number;
  limit?: number;
}

export class AdminClientAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async listClients(filters: ClientFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });

    const response = await axios.get(
      `${API_BASE}/clients?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async getClientDetails(userId: number) {
    const response = await axios.get(
      `${API_BASE}/clients/${userId}`,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async updateClient(userId: number, data: Partial<Client>) {
    const response = await axios.put(
      `${API_BASE}/clients/${userId}`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async verifyClient(userId: number) {
    const response = await axios.post(
      `${API_BASE}/clients/${userId}/verify`,
      {},
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async deactivateClient(userId: number, reason?: string) {
    const response = await axios.post(
      `${API_BASE}/clients/${userId}/deactivate`,
      { reason },
      { headers: this.getHeaders() }
    );
    return response.data;
  }

  async sendEmail(userId: number, subject: string, message: string) {
    const response = await axios.post(
      `${API_BASE}/clients/${userId}/email`,
      { subject, message },
      { headers: this.getHeaders() }
    );
    return response.data;
  }
}
```

### Usage Example

```typescript
// In your React component
import { AdminClientAPI } from './api/adminClient';

const ClientManagement = () => {
  const token = localStorage.getItem('admin_token');
  const api = new AdminClientAPI(token);

  const handleSearch = async (searchTerm: string) => {
    try {
      const data = await api.listClients({
        search: searchTerm,
        status: 'active',
        page: 1,
        limit: 20
      });
      setClients(data.results);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleVerifyClient = async (userId: number) => {
    try {
      const result = await api.verifyClient(userId);
      if (result.success) {
        alert('Client verified successfully!');
        // Refresh client list
        handleSearch('');
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  // ... component render
};
```

---

## Rate Limiting & Best Practices

### Recommendations

1. **Pagination**
   - Always use pagination for list endpoints
   - Keep `limit` reasonable (10-50 items)
   - Cache results when possible

2. **Search**
   - Debounce search input (300-500ms)
   - Minimum 2-3 characters for search
   - Show loading state during search

3. **Error Handling**
   - Always handle 401 (re-authenticate)
   - Show user-friendly error messages
   - Log errors for debugging

4. **Token Management**
   - Store token securely
   - Refresh before expiration
   - Handle token expiration gracefully

5. **Email Operations**
   - Confirm before sending emails
   - Show preview if possible
   - Handle email sending errors

---

## Changelog

### Version 1.0 (November 1, 2025)
- Initial implementation
- 6 endpoints for client management
- Role-based access control
- Advanced filtering system
- Email notification system
- Comprehensive documentation

---

## Support

For issues, questions, or feature requests related to these endpoints, please refer to:
- **Full Documentation:** `CHUNK6_IMPLEMENTATION_SUMMARY.md`
- **Main Specification:** `endpoints_all.md`

---

**Last Updated:** November 1, 2025  
**API Version:** 1.0  
**Status:** Production Ready

