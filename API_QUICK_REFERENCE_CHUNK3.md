# Chunk 3: Admin Authentication - API Quick Reference

## 🚀 Quick Start

**Base URL**: `http://localhost:8000/api/admin`  
**Authentication**: JWT Bearer Token  
**Format**: JSON

---

## 📋 Endpoints Overview

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/login` | ❌ No | Admin login |
| POST | `/logout` | ✅ Yes | Admin logout |
| POST | `/verify-token` | ❌ No | Verify JWT token |
| POST | `/change-password` | ✅ Yes | Change password |
| POST | `/request-password-reset` | ❌ No | Request password reset OTP |

---

## 🔐 1. Admin Login

### POST `/login`

Authenticate admin and receive JWT token (8-hour expiration).

**Request:**
```bash
curl -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vet@pawpal.com",
    "password": "VetAdmin123!"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin_info": {
      "id": 1,
      "name": "Dr. Jane Veterinarian",
      "email": "vet@pawpal.com",
      "role": "VET",
      "role_display": "Veterinarian",
      "contact_number": "555-0002",
      "clinic_info": "Downtown Veterinary Clinic",
      "profile_image": null,
      "created_at": "2025-01-01T00:00:00Z",
      "last_login": "2025-11-01T12:00:00Z"
    },
    "expires_in": "8 hours"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Login failed",
  "errors": {
    "detail": "Invalid credentials"
  }
}
```

**Error Codes:**
- `400` - Invalid credentials or validation error
- `500` - Server error

**Notes:**
- Token expires in 8 hours
- Only active admins can login
- Last login timestamp updated on success

---

## 🚪 2. Admin Logout

### POST `/logout`

Logout admin and invalidate session.

**Request:**
```bash
curl -X POST http://localhost:8000/api/admin/logout \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

**Error Codes:**
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient permissions)
- `500` - Server error

**Notes:**
- Client should discard token after logout
- JWT is stateless, so token remains valid until expiration
- For instant invalidation, implement token blacklist

---

## ✅ 3. Verify Token

### POST `/verify-token`

Verify JWT token validity and get admin info.

**Request (Method 1 - Header):**
```bash
curl -X POST http://localhost:8000/api/admin/verify-token \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Request (Method 2 - Body):**
```bash
curl -X POST http://localhost:8000/api/admin/verify-token \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "valid": true,
  "admin_info": {
    "id": 1,
    "name": "Dr. Jane Veterinarian",
    "email": "vet@pawpal.com",
    "role": "VET",
    "role_display": "Veterinarian",
    "contact_number": "555-0002",
    "clinic_info": "Downtown Veterinary Clinic",
    "profile_image": null,
    "created_at": "2025-01-01T00:00:00Z",
    "last_login": "2025-11-01T12:00:00Z"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "valid": false,
  "error": "Token expired"
}
```

**Error Codes:**
- `400` - Token not provided
- `401` - Invalid or expired token
- `500` - Server error

**Possible Errors:**
- "Token expired"
- "Invalid token"
- "Invalid token type"
- "Admin not found or inactive"

**Notes:**
- Accepts token in header OR body
- Verifies admin still exists and is active
- Returns fresh admin info from database

---

## 🔑 4. Change Password

### POST `/change-password`

Change admin password with validation and history check.

**Request:**
```bash
curl -X POST http://localhost:8000/api/admin/change-password \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "OldPassword123!",
    "new_password": "NewPassword456@",
    "confirm_password": "NewPassword456@"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully. Please login again with your new password."
}
```

**Error Response - Wrong Current Password (400):**
```json
{
  "success": false,
  "message": "Current password is incorrect",
  "code": "INVALID_CURRENT_PASSWORD"
}
```

**Error Response - Password Reuse (400):**
```json
{
  "success": false,
  "message": "Password was used recently. Please choose a different password.",
  "code": "PASSWORD_REUSE"
}
```

**Error Response - Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "new_password": "Password must contain at least one uppercase letter",
    "confirm_password": "Passwords do not match"
  }
}
```

**Error Codes:**
- `400` - Validation error or password reuse
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (insufficient permissions)
- `500` - Server error

**Password Requirements:**
- ✅ Minimum 8 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (!@#$%^&*(),.?\":{}|<>)
- ✅ Not in last 3 passwords
- ✅ Different from current password

**Notes:**
- Current password to history before changing
- Password automatically hashed
- `password_updated_at` timestamp updated
- Client should re-login with new password

---

## 📧 5. Request Password Reset

### POST `/request-password-reset`

Request password reset OTP (VET and DESK roles only).

**Request:**
```bash
curl -X POST http://localhost:8000/api/admin/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vet@pawpal.com"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset code will be sent."
}
```

**Error Response - MASTER Role (403):**
```json
{
  "success": false,
  "message": "Master admins cannot reset password via this method. Please contact system administrator.",
  "code": "MASTER_RESET_DENIED"
}
```

**Error Response - Invalid Email (400):**
```json
{
  "success": false,
  "message": "Invalid email",
  "errors": {
    "email": "Enter a valid email address"
  }
}
```

**Error Codes:**
- `400` - Invalid email format
- `403` - MASTER role denied
- `500` - Server error

**Email Sent:**
```
Subject: PawPal Admin - Password Reset Code

Hello [Admin Name],

You requested a password reset for your PawPal admin account.

Your verification code is: 123456

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
PawPal Team
```

**OTP Details:**
- 6-digit numeric code
- Expires in 10 minutes
- Purpose: `admin_password_reset`
- Single use only
- Old OTPs invalidated when new one generated

**Security Notes:**
- ⚠️ MASTER role cannot reset via this method
- ✅ Generic success message (no user enumeration)
- ✅ All requests logged
- ✅ Non-existent emails return same success message

**Notes:**
- Returns generic success for security (don't reveal if email exists)
- MASTER admins must contact system administrator
- OTP saved to database with 10-minute expiration
- Email sent via configured SMTP

---

## 🔒 Authentication Flow

### 1. Login Flow
```
1. POST /api/admin/login
   ↓
2. Receive JWT token
   ↓
3. Store token securely (localStorage/sessionStorage)
   ↓
4. Include in Authorization header for protected requests
```

### 2. Protected Request Flow
```
1. Add header: Authorization: Bearer <token>
   ↓
2. Server verifies token signature
   ↓
3. Server checks expiration
   ↓
4. Server verifies admin exists & is active
   ↓
5. Request processed
```

### 3. Token Expiration Flow
```
1. Token expires after 8 hours
   ↓
2. Next request returns 401 Unauthorized
   ↓
3. Client detects 401
   ↓
4. Redirect to login page
   ↓
5. User logs in again
```

### 4. Password Change Flow
```
1. POST /api/admin/change-password
   ↓
2. Verify current password
   ↓
3. Check password requirements
   ↓
4. Check password history (last 3)
   ↓
5. Add current password to history
   ↓
6. Hash and save new password
   ↓
7. Update password_updated_at
   ↓
8. Client logs in with new password
```

### 5. Password Reset Flow
```
1. POST /api/admin/request-password-reset
   ↓
2. Generate 6-digit OTP
   ↓
3. Send OTP via email
   ↓
4. User receives email
   ↓
5. User enters OTP (future endpoint)
   ↓
6. Reset password with OTP
```

---

## 🎭 Admin Roles

### MASTER
- **Permissions**: Full system access
- **Can**: All administrative functions
- **Cannot**: Reset password via OTP (security measure)
- **Use Case**: System administrator, super admin

### VET
- **Permissions**: Veterinary features, diagnoses, reports
- **Can**: View/manage patients, create diagnoses, access medical records
- **Cannot**: Delete system data, manage other admins
- **Use Case**: Veterinarian, medical professional

### DESK
- **Permissions**: Front desk operations
- **Can**: Check-in patients, view schedules, basic reports
- **Cannot**: Access medical records, create diagnoses
- **Use Case**: Receptionist, front desk staff

---

## 🛡️ Security Best Practices

### Token Storage
```javascript
// ✅ Good: Session Storage (for single tab)
sessionStorage.setItem('admin_token', token);

// ✅ Good: Local Storage (for persistent login)
localStorage.setItem('admin_token', token);

// ❌ Bad: Cookie without HttpOnly flag
document.cookie = `token=${token}`;

// ❌ Bad: Global variable
window.adminToken = token;
```

### Token Usage
```javascript
// ✅ Good: Include in Authorization header
fetch('/api/admin/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// ❌ Bad: Send in URL
fetch(`/api/admin/endpoint?token=${token}`);

// ❌ Bad: Send in plain text body
fetch('/api/admin/endpoint', {
  body: JSON.stringify({ token: token })
});
```

### Error Handling
```javascript
// ✅ Good: Handle 401 gracefully
fetch('/api/admin/endpoint', { headers })
  .then(response => {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return response.json();
  });

// ✅ Good: Verify token before protected routes
async function checkAuth() {
  const token = localStorage.getItem('admin_token');
  if (!token) return false;
  
  const response = await fetch('/api/admin/verify-token', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  return data.valid;
}
```

### Password Management
```javascript
// ✅ Good: Clear passwords after use
function handlePasswordChange(form) {
  const data = new FormData(form);
  // ... send request ...
  form.reset();  // Clear password fields
}

// ✅ Good: Validate on client AND server
function validatePassword(password) {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
}
```

---

## 🧪 Testing with cURL

### Complete Test Flow

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vet@pawpal.com","password":"VetAdmin123!"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Verify Token
curl -X POST http://localhost:8000/api/admin/verify-token \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# 3. Access Protected Endpoint
curl -X GET http://localhost:8000/api/admin/dashboard/analytics/ \
  -H "Authorization: Bearer $TOKEN" \
  | jq

# 4. Change Password
curl -X POST http://localhost:8000/api/admin/change-password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "VetAdmin123!",
    "new_password": "NewVetPass456@",
    "confirm_password": "NewVetPass456@"
  }' \
  | jq

# 5. Login with New Password
NEW_TOKEN=$(curl -s -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vet@pawpal.com","password":"NewVetPass456@"}' \
  | jq -r '.data.token')

# 6. Logout
curl -X POST http://localhost:8000/api/admin/logout \
  -H "Authorization: Bearer $NEW_TOKEN" \
  | jq

# 7. Request Password Reset
curl -X POST http://localhost:8000/api/admin/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"vet@pawpal.com"}' \
  | jq
```

---

## 📊 Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Authentication required, invalid/expired token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Unexpected server error |

---

## 🐛 Common Errors & Solutions

### Error: "Token expired"
**Cause**: JWT token older than 8 hours  
**Solution**: Login again to get new token

### Error: "Invalid credentials"
**Cause**: Wrong email or password  
**Solution**: Check credentials, ensure account is active

### Error: "Admin not found or inactive"
**Cause**: Account deactivated or deleted  
**Solution**: Contact system administrator

### Error: "Password was used recently"
**Cause**: Trying to reuse one of last 3 passwords  
**Solution**: Choose a different password

### Error: "MASTER_RESET_DENIED"
**Cause**: MASTER admin trying to reset password via OTP  
**Solution**: Contact system administrator for password reset

### Error: "INVALID_CURRENT_PASSWORD"
**Cause**: Wrong current password when changing  
**Solution**: Verify current password is correct

### Error: "Password must contain..."
**Cause**: New password doesn't meet requirements  
**Solution**: Include uppercase, lowercase, number, and special character

---

## 💡 Tips & Tricks

### 1. Token Refresh Strategy
```javascript
// Check token expiration before requests
function isTokenExpired(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return Date.now() >= payload.exp * 1000;
}

// Refresh token if needed
async function refreshTokenIfNeeded() {
  const token = localStorage.getItem('admin_token');
  if (!token || isTokenExpired(token)) {
    // Redirect to login
    window.location.href = '/admin/login';
  }
}
```

### 2. Auto-Logout on Expiration
```javascript
// Set timeout to logout when token expires
function setAutoLogout(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  const expiresIn = payload.exp * 1000 - Date.now();
  
  setTimeout(() => {
    localStorage.removeItem('admin_token');
    alert('Session expired. Please login again.');
    window.location.href = '/admin/login';
  }, expiresIn);
}
```

### 3. Password Strength Indicator
```javascript
function getPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score: strength, level: levels[strength] };
}
```

### 4. Role-Based UI
```javascript
// Show/hide features based on role
function configureUIForRole(role) {
  if (role === 'MASTER') {
    showElement('#admin-management');
    showElement('#system-settings');
  } else if (role === 'VET') {
    showElement('#diagnosis-panel');
    showElement('#patient-records');
  } else if (role === 'DESK') {
    showElement('#check-in');
    showElement('#appointments');
  }
}
```

---

## 📚 Integration Examples

### React Example
```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/admin';

// Login
export async function login(email, password) {
  const response = await axios.post(`${API_BASE}/login`, {
    email,
    password
  });
  
  const { token, admin_info } = response.data.data;
  localStorage.setItem('admin_token', token);
  localStorage.setItem('admin_info', JSON.stringify(admin_info));
  
  return { token, admin_info };
}

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to all requests
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);
```

### Vue.js Example
```javascript
// authService.js
export default {
  async login(email, password) {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('admin_token', data.data.token);
      return data.data.admin_info;
    }
    throw new Error(data.message);
  },
  
  async verifyToken() {
    const token = localStorage.getItem('admin_token');
    if (!token) return null;
    
    const response = await fetch('/api/admin/verify-token', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await response.json();
    return data.valid ? data.admin_info : null;
  }
};
```

---

## 🔗 Related Documentation

- [Chunk 1: Pet Owner Authentication](./API_QUICK_REFERENCE_CHUNK1.md)
- [Chunk 2: SOAP Report & Diagnosis](./API_QUICK_REFERENCE_CHUNK2.md)
- [Full Implementation Summary](./CHUNK3_IMPLEMENTATION_SUMMARY.md)
- [Main Endpoints Documentation](./endpoints_all.md)

---

**Last Updated**: November 1, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready

